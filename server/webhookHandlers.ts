// Webhook handlers for Stripe events.
//
// Bid hold flow (kind=bid_hold):
//   1. /api/bids creates a Checkout Session in manual-capture mode and returns
//      the URL. NO bid row is written yet.
//   2. checkout.session.completed OR payment_intent.amount_capturable_updated
//      arrives — whichever fires first inserts the bid row as "authorized",
//      releases lower holds, and applies anti-snipe.
//   3. payment_intent.succeeded marks the bid "captured" (the scheduler also
//      handles this when it captures the winning hold).
//   4. checkout.session.expired / payment_intent.canceled / payment_failed
//      either no-op (no bid existed) or mark an existing bid as canceled/failed.
//
// Legacy winner-pay flow: untagged sessions still mark the artwork as paid
// for backwards compatibility, though that endpoint is now disabled.

import type Stripe from 'stripe';
import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';
import { releaseLosingHoldsForArtwork } from './auctionScheduler';

// Best-effort idempotent bid record: insert if no bid exists for this checkout
// session yet, otherwise just patch the existing row to "authorized" with the
// PI id. Then release lower holds and apply anti-snipe.
async function ensureBidAuthorized(opts: {
  artworkId: number;
  bidderId: string;
  amount: number;
  sessionId?: string;
  paymentIntentId: string;
}): Promise<void> {
  let bid = opts.sessionId ? await storage.getBidByCheckoutSession(opts.sessionId) : undefined;
  if (!bid) bid = await storage.getBidByPaymentIntent(opts.paymentIntentId);

  if (!bid) {
    bid = await storage.createBid({
      artworkId: opts.artworkId,
      bidderId: opts.bidderId,
      amount: String(opts.amount) as any,
      stripeCheckoutSessionId: opts.sessionId,
      stripePaymentIntentId: opts.paymentIntentId,
      holdStatus: 'authorized',
    });
    console.log(`Bid ${bid.id} created+authorized via webhook (PI: ${opts.paymentIntentId})`);
  } else if (bid.holdStatus !== 'authorized' && bid.holdStatus !== 'captured') {
    await storage.updateBidByPaymentIntent(opts.paymentIntentId, { holdStatus: 'authorized' });
    if (opts.sessionId) {
      await storage.updateBidByCheckoutSession(opts.sessionId, {
        holdStatus: 'authorized',
        stripePaymentIntentId: opts.paymentIntentId,
      });
    }
    console.log(`Bid ${bid.id} authorized via webhook (PI: ${opts.paymentIntentId})`);
  } else {
    return; // already authorized/captured — nothing to do
  }

  await releaseLosingHoldsForArtwork(bid.artworkId, bid.id);

  const artwork = await storage.getArtwork(bid.artworkId);
  if (artwork?.endTime && Number(bid.amount) >= Number(artwork.price)) {
    const now = new Date();
    const endTime = new Date(artwork.endTime);
    const remainingMs = endTime.getTime() - now.getTime();
    const ANTI_SNIPE_WINDOW_MS = 2 * 60 * 1000;
    if (remainingMs > 0 && remainingMs < ANTI_SNIPE_WINDOW_MS) {
      const newEnd = new Date(now.getTime() + ANTI_SNIPE_WINDOW_MS);
      await storage.extendAuctionEndTime(artwork.id, newEnd);
      console.log(`Auction ${artwork.id} extended to ${newEnd.toISOString()} (anti-snipe)`);
    }
  }
}

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. Webhook route must be registered BEFORE express.json().'
      );
    }

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);

    const stripe = await getUncachableStripeClient();
    const webhookSecret = await sync.getWebhookSecret();

    let event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return;
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;
        case 'checkout.session.expired':
          await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session);
          break;
        case 'payment_intent.amount_capturable_updated':
          await handleAmountCapturableUpdated(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.succeeded':
          await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.canceled':
          await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.payment_failed':
          await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        case 'account.updated':
          await handleAccountUpdated(event.data.object as Stripe.Account);
          break;
      }
    } catch (err) {
      console.error(`Webhook handler error for ${event.type}:`, err);
    }
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const kind = session.metadata?.kind;

  if (kind === 'bid_hold') {
    const paymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id;
    if (!paymentIntentId) {
      console.warn(`bid_hold session ${session.id} has no payment_intent`);
      return;
    }
    const artworkId = Number(session.metadata?.artworkId);
    const bidderId = String(session.metadata?.bidderId || '');
    // Read amount in dollars from session.amount_total (cents)
    const amount = (session.amount_total ?? 0) / 100;
    if (!artworkId || !bidderId || !amount) {
      console.warn(`bid_hold session ${session.id} missing required metadata`);
      return;
    }
    await ensureBidAuthorized({ artworkId, bidderId, amount, sessionId: session.id, paymentIntentId });
    return;
  }

  // Legacy winner-pay flow (post-auction Pay Now button)
  const sessionId = session.id;
  const metadata = session.metadata;
  const artwork = await storage.getArtworkBySessionId(sessionId);
  if (artwork && !artwork.paidAt) {
    if (metadata?.artworkId && Number(metadata.artworkId) === artwork.id && artwork.paidBy === metadata.bidderId) {
      await storage.markArtworkPaid(artwork.id);
      console.log(`Payment confirmed for artwork ${artwork.id} by ${artwork.paidBy}`);
    }
  }
}

// Canonical "card hold succeeded" event for manual-capture PaymentIntents.
// May arrive before checkout.session.completed; we still want to record the bid.
async function handleAmountCapturableUpdated(pi: Stripe.PaymentIntent) {
  if (pi.metadata?.kind !== 'bid_hold') return;
  const artworkId = Number(pi.metadata.artworkId);
  const bidderId = String(pi.metadata.bidderId || '');
  const amount = Number(pi.metadata.bidAmount || (pi.amount_capturable ?? 0) / 100);
  if (!artworkId || !bidderId || !amount) {
    console.warn(`PI ${pi.id} amount_capturable_updated missing metadata`);
    return;
  }
  await ensureBidAuthorized({ artworkId, bidderId, amount, paymentIntentId: pi.id });
}

// Mark a bid captured once Stripe confirms the funds have been pulled.
// The scheduler also writes this state directly when it captures, but this
// webhook is the source-of-truth fallback.
async function handlePaymentIntentSucceeded(pi: Stripe.PaymentIntent) {
  const bid = await storage.getBidByPaymentIntent(pi.id);
  if (!bid) return;
  if (bid.holdStatus === 'captured') return;
  await storage.updateBidByPaymentIntent(pi.id, { holdStatus: 'captured' });
  console.log(`Bid ${bid.id} marked captured via payment_intent.succeeded`);
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  if (session.metadata?.kind !== 'bid_hold') return;
  // Bid row may not exist (we only create on authorization). If it does, mark failed.
  const bid = await storage.getBidByCheckoutSession(session.id);
  if (!bid || bid.holdStatus === 'authorized' || bid.holdStatus === 'captured') return;
  await storage.updateBidByCheckoutSession(session.id, { holdStatus: 'failed' });
  console.log(`Bid ${bid.id} expired without authorization`);
}

async function handlePaymentIntentCanceled(pi: Stripe.PaymentIntent) {
  const bid = await storage.getBidByPaymentIntent(pi.id);
  if (!bid) return;
  if (bid.holdStatus === 'captured') return; // safety: never overwrite captured
  if (bid.holdStatus === 'canceled') return;
  await storage.updateBidByPaymentIntent(pi.id, { holdStatus: 'canceled' });
}

async function handlePaymentIntentFailed(pi: Stripe.PaymentIntent) {
  const bid = await storage.getBidByPaymentIntent(pi.id);
  if (!bid) return;
  if (bid.holdStatus === 'captured') return;
  await storage.updateBidByPaymentIntent(pi.id, { holdStatus: 'failed' });
}

async function handleAccountUpdated(account: Stripe.Account) {
  const user = await storage.getUserByStripeAccount(account.id);
  if (!user) return;
  await storage.updateUserStripeStatus(user.id, {
    onboardingComplete: !!account.details_submitted,
    payoutsEnabled: !!account.payouts_enabled,
  });
}
