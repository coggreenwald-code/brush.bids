// Stripe webhook handlers. The bid_hold flow defers bid persistence until the
// webhook confirms a card authorization; checkout.session.completed and
// payment_intent.amount_capturable_updated are both routed through
// ensureBidAuthorized (idempotent on session id / PI id).

import type Stripe from 'stripe';
import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';
import { releaseLosingHoldsForArtwork } from './auctionScheduler';
import { persistTaxFromCheckoutSession, persistTaxIfMissing } from './taxPersistence';
import { sendPayoutReadyEmail, sendPayoutRestrictedEmail } from './emailService';

async function ensureBidAuthorized(opts: {
  artworkId: number;
  bidderId: string;
  amount: number;
  sessionId?: string;
  paymentIntentId: string;
}): Promise<void> {
  let bid = opts.sessionId ? await storage.getBidByCheckoutSession(opts.sessionId) : undefined;
  if (!bid) bid = await storage.getBidByPaymentIntent(opts.paymentIntentId);

  // Revalidate auction state at authorization time — a bidder could complete
  // Checkout after the deadline or after the artwork sold.
  const artworkNow = await storage.getArtwork(opts.artworkId);
  const ended = artworkNow?.endTime ? new Date(artworkNow.endTime) <= new Date() : false;
  const closed = !artworkNow || artworkNow.status !== 'approved' || !!artworkNow.paidAt || ended;

  let outcompeted = false;
  if (!closed) {
    const existing = await storage.getAuthorizedBidsForArtwork(opts.artworkId);
    const competing = existing.filter(b => b.id !== bid?.id).map(b => Number(b.amount));
    if (competing.length && opts.amount <= Math.max(...competing)) outcompeted = true;
  }

  if (closed || outcompeted) {
    const stripe = await getUncachableStripeClient();
    await stripe.paymentIntents.cancel(opts.paymentIntentId).catch(() => {});
    const status = closed ? 'failed' : 'canceled';
    if (bid) {
      await storage.updateBidByPaymentIntent(opts.paymentIntentId, { holdStatus: status });
    } else {
      await storage.createBid({
        artworkId: opts.artworkId,
        bidderId: opts.bidderId,
        amount: opts.amount.toFixed(2),
        stripeCheckoutSessionId: opts.sessionId,
        stripePaymentIntentId: opts.paymentIntentId,
        holdStatus: status,
      });
    }
    console.warn(`Bid ${opts.paymentIntentId} rejected at authorization (${closed ? 'closed' : 'outbid'})`);
    return;
  }

  if (!bid) {
    bid = await storage.createBid({
      artworkId: opts.artworkId,
      bidderId: opts.bidderId,
      amount: opts.amount.toFixed(2),
      stripeCheckoutSessionId: opts.sessionId,
      stripePaymentIntentId: opts.paymentIntentId,
      holdStatus: 'authorized',
    });
  } else if (bid.holdStatus !== 'authorized' && bid.holdStatus !== 'captured') {
    await storage.updateBidByPaymentIntent(opts.paymentIntentId, { holdStatus: 'authorized' });
    if (opts.sessionId) {
      await storage.updateBidByCheckoutSession(opts.sessionId, {
        holdStatus: 'authorized',
        stripePaymentIntentId: opts.paymentIntentId,
      });
    }
  } else {
    return;
  }

  await releaseLosingHoldsForArtwork(bid.artworkId, bid.id);

  // Anti-snipe: if a qualifying bid lands inside the last 2 minutes, push the
  // end time out by 2 minutes.
  if (artworkNow?.endTime && Number(bid.amount) >= Number(artworkNow.price)) {
    const now = Date.now();
    const remainingMs = new Date(artworkNow.endTime).getTime() - now;
    const WINDOW = 2 * 60 * 1000;
    if (remainingMs > 0 && remainingMs < WINDOW) {
      await storage.extendAuctionEndTime(artworkNow.id, new Date(now + WINDOW));
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
    // Bid amount = pre-tax subtotal (dollars). amount_total now includes tax,
    // so use amount_subtotal (or fall back to the metadata value we set when
    // creating the session).
    const subtotalCents = session.amount_subtotal ?? 0;
    const metaAmount = Number(session.metadata?.bidAmount || 0);
    const amount = subtotalCents > 0 ? subtotalCents / 100 : metaAmount;
    if (!artworkId || !bidderId || !amount) {
      console.warn(`bid_hold session ${session.id} missing required metadata`);
      return;
    }
    await ensureBidAuthorized({ artworkId, bidderId, amount, sessionId: session.id, paymentIntentId });
    await persistTaxFromCheckoutSession(session.id, paymentIntentId);
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
// webhook is the source-of-truth fallback. We always run through markBidCaptured
// (so capturedAt is set) and ensure tax data is persisted before returning.
async function handlePaymentIntentSucceeded(pi: Stripe.PaymentIntent) {
  const bid = await storage.getBidByPaymentIntent(pi.id);
  if (!bid) return;
  await persistTaxIfMissing(bid.stripeCheckoutSessionId, pi.id);
  if (bid.holdStatus !== 'captured' || bid.capturedAt == null) {
    await storage.markBidCaptured(pi.id);
    console.log(`Bid ${bid.id} marked captured via payment_intent.succeeded`);
  }
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

  const wasPayoutsEnabled = user.stripePayoutsEnabled;
  const nowPayoutsEnabled = !!account.payouts_enabled;

  await storage.updateUserStripeStatus(user.id, {
    onboardingComplete: !!account.details_submitted,
    payoutsEnabled: nowPayoutsEnabled,
  });

  if (!wasPayoutsEnabled && nowPayoutsEnabled) {
    await sendPayoutReadyEmail({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    }).catch(err => console.error("[email] Failed to send payout-ready notification:", err));
  }

  if (wasPayoutsEnabled && !nowPayoutsEnabled) {
    await sendPayoutRestrictedEmail({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    }).catch(err => console.error("[email] Failed to send payout-restricted notification:", err));
  }
}
