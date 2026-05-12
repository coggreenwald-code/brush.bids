// Webhook handlers for Stripe events.
//
// Two distinct flows:
//   • Bid hold flow (kind=bid_hold): checkout.session.completed → mark bid as
//     "authorized", store payment_intent_id, and immediately release any other
//     authorized holds on the same artwork (the new bidder has just outbid them).
//   • Legacy winner-pay flow: untagged sessions still mark the artwork as paid
//     for backwards compatibility.

import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';
import { releaseLosingHoldsForArtwork } from './auctionScheduler';

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
          await handleCheckoutCompleted(event.data.object as any);
          break;
        case 'checkout.session.expired':
          await handleCheckoutExpired(event.data.object as any);
          break;
        case 'payment_intent.canceled':
          await handlePaymentIntentCanceled(event.data.object as any);
          break;
        case 'payment_intent.payment_failed':
          await handlePaymentIntentFailed(event.data.object as any);
          break;
        case 'account.updated':
          await handleAccountUpdated(event.data.object as any);
          break;
      }
    } catch (err) {
      console.error(`Webhook handler error for ${event.type}:`, err);
    }
  }
}

async function handleCheckoutCompleted(session: any) {
  const kind = session.metadata?.kind;

  if (kind === 'bid_hold') {
    const bid = await storage.getBidByCheckoutSession(session.id);
    if (!bid) {
      console.warn(`bid_hold session ${session.id} has no matching bid`);
      return;
    }
    if (bid.holdStatus === 'authorized' || bid.holdStatus === 'captured') return;

    const paymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id;
    if (!paymentIntentId) {
      console.warn(`bid_hold session ${session.id} has no payment_intent`);
      return;
    }

    await storage.updateBidByCheckoutSession(session.id, {
      holdStatus: 'authorized',
      stripePaymentIntentId: paymentIntentId,
    });
    console.log(`Bid ${bid.id} hold authorized (PI: ${paymentIntentId})`);

    // Whoever just authorized has outbid the previous holders — release every
    // hold strictly lower than this one (never equal-or-higher; protects against
    // out-of-order webhooks where an older lower bid authorizes late).
    await releaseLosingHoldsForArtwork(bid.artworkId, bid.id);

    // Anti-snipe extension: only triggered when an authorized hold lands inside
    // the last 2 minutes AND it's actually the new highest. This way unfinished
    // checkout sessions can't be used to extend the auction indefinitely.
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

async function handleCheckoutExpired(session: any) {
  if (session.metadata?.kind !== 'bid_hold') return;
  const bid = await storage.getBidByCheckoutSession(session.id);
  if (!bid || bid.holdStatus !== 'pending') return;
  await storage.updateBidByCheckoutSession(session.id, { holdStatus: 'failed' });
  console.log(`Bid ${bid.id} expired without authorization`);
}

async function handlePaymentIntentCanceled(pi: any) {
  const bid = await storage.getBidByPaymentIntent(pi.id);
  if (!bid) return;
  if (bid.holdStatus === 'captured') return; // safety: never overwrite captured
  if (bid.holdStatus === 'canceled') return;
  await storage.updateBidByPaymentIntent(pi.id, { holdStatus: 'canceled' });
}

async function handlePaymentIntentFailed(pi: any) {
  const bid = await storage.getBidByPaymentIntent(pi.id);
  if (!bid) return;
  if (bid.holdStatus === 'captured') return;
  await storage.updateBidByPaymentIntent(pi.id, { holdStatus: 'failed' });
}

async function handleAccountUpdated(account: any) {
  const user = await storage.getUserByStripeAccount(account.id);
  if (!user) return;
  await storage.updateUserStripeStatus(user.id, {
    onboardingComplete: !!account.details_submitted,
    payoutsEnabled: !!account.payouts_enabled,
  });
}
