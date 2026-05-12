// Periodic job that settles ended auctions:
//   1. Capture the highest authorized bid (winning hold)
//   2. Cancel/release all losing authorized holds
//   3. Mark the artwork as paid
//
// Runs every 60s via setInterval (started in server/index.ts) and is also
// callable on-demand via POST /api/auctions/settle.

import { storage } from "./storage";
import { getUncachableStripeClient } from "./stripeClient";

let inFlight = false;
// Track which artwork IDs we've already logged as "no authorized bid" so the
// scheduler doesn't spam the console every tick — but we DO still re-check
// them, because a late-arriving webhook (or a bid PI that flips to authorized
// after the first scan) must still be eligible to win.
const noWinnerLogged = new Set<number>();

export async function settleEndedAuctions(): Promise<{ settled: number; errors: number }> {
  if (inFlight) return { settled: 0, errors: 0 };
  inFlight = true;
  let settled = 0;
  let errors = 0;
  try {
    const ended = await storage.getEndedAuctionsAwaitingCapture();
    for (const artwork of ended) {
      try {
        await settleArtwork(artwork.id);
        settled++;
      } catch (err) {
        errors++;
        console.error(`[scheduler] failed to settle artwork ${artwork.id}:`, err);
      }
    }
  } finally {
    inFlight = false;
  }
  return { settled, errors };
}

async function settleArtwork(artworkId: number): Promise<void> {
  const artwork = await storage.getArtwork(artworkId);
  if (!artwork || artwork.paidAt) return;

  const winningBid = await storage.getHighestAuthorizedBid(artworkId);
  if (!winningBid || !winningBid.stripePaymentIntentId) {
    // No authorized bid right now. We keep re-checking every tick — a late
    // webhook may still flip a pending hold to authorized — but we only log
    // the "no winner" message once to avoid spamming the console.
    if (!noWinnerLogged.has(artworkId)) {
      noWinnerLogged.add(artworkId);
      console.log(`[scheduler] artwork ${artworkId} ended with no authorized bids yet; will re-check each tick`);
    }
    return;
  }
  // Reset the log gate when a winner finally appears
  noWinnerLogged.delete(artworkId);

  const stripe = await getUncachableStripeClient();

  // Try to capture the highest-authorized bid. If its hold is no longer
  // capturable (expired auth, canceled by Stripe, etc.), invalidate that bid
  // and immediately fall back to the next-highest authorized bid. We loop
  // until something captures or we run out of valid bids.
  let captured = false;
  let currentWinner = winningBid;
  while (!captured) {
    if (!currentWinner.stripePaymentIntentId) {
      await storage.updateBidByPaymentIntent(
        currentWinner.stripePaymentIntentId || "",
        { holdStatus: "failed" },
      ).catch(() => {});
      const next = await storage.getHighestAuthorizedBid(artworkId);
      if (!next || next.id === currentWinner.id) return;
      currentWinner = next;
      continue;
    }

    try {
      await stripe.paymentIntents.capture(currentWinner.stripePaymentIntentId);
      await storage.updateBidByPaymentIntent(currentWinner.stripePaymentIntentId, { holdStatus: "captured" });
      await storage.markArtworkPaid(artworkId, currentWinner.bidderId);
      console.log(`[scheduler] captured winning bid ${currentWinner.id} for artwork ${artworkId}`);
      captured = true;
      break;
    } catch (err: any) {
      // payment_intent_unexpected_state covers BOTH "already captured" and
      // "no longer capturable" (canceled/expired). Disambiguate by retrieving
      // the PI's actual status from Stripe before deciding.
      if (err?.code !== "payment_intent_unexpected_state") {
        throw err;
      }
      let pi: any = null;
      try {
        pi = await stripe.paymentIntents.retrieve(currentWinner.stripePaymentIntentId);
      } catch (retrieveErr) {
        console.error(`[scheduler] failed to retrieve PI ${currentWinner.stripePaymentIntentId}:`, retrieveErr);
        throw err;
      }
      if (pi.status === "succeeded") {
        // Already captured on Stripe's side (idempotent retry). Reflect it.
        await storage.updateBidByPaymentIntent(currentWinner.stripePaymentIntentId, { holdStatus: "captured" });
        await storage.markArtworkPaid(artworkId, currentWinner.bidderId);
        captured = true;
        break;
      }
      // Hold is gone (canceled, expired, requires_payment_method, etc.).
      // Mark this bid as failed and try the next-highest authorized bid.
      console.warn(`[scheduler] winning bid ${currentWinner.id} not capturable (PI status=${pi.status}); falling back to next-highest`);
      await storage.updateBidByPaymentIntent(currentWinner.stripePaymentIntentId, { holdStatus: "failed" });
      const next = await storage.getHighestAuthorizedBid(artworkId);
      if (!next) {
        console.log(`[scheduler] artwork ${artworkId} has no remaining authorized bids after capture failure`);
        return;
      }
      if (next.id === currentWinner.id) return; // shouldn't happen, guard against loop
      currentWinner = next;
    }
  }

  // Release every other authorized hold for this artwork
  const losers = await storage.getOtherAuthorizedBids(artworkId, currentWinner.id);
  for (const bid of losers) {
    if (!bid.stripePaymentIntentId) continue;
    try {
      await stripe.paymentIntents.cancel(bid.stripePaymentIntentId);
      await storage.updateBidByPaymentIntent(bid.stripePaymentIntentId, { holdStatus: "canceled" });
    } catch (err) {
      console.error(`[scheduler] failed to release losing bid ${bid.id}:`, err);
    }
  }
}

let timer: NodeJS.Timeout | null = null;

export function startAuctionScheduler(intervalMs = 60_000): void {
  if (timer) return;
  // Run once on startup, then on interval
  settleEndedAuctions().catch(err => console.error("[scheduler] startup run failed:", err));
  timer = setInterval(() => {
    settleEndedAuctions().catch(err => console.error("[scheduler] tick failed:", err));
  }, intervalMs);
}

// Release every authorized hold whose amount is strictly LESS than the new
// authorization's amount. We never cancel based on bid id alone — a late webhook
// for an older, lower bid must not be allowed to wipe out a higher hold.
export async function releaseLosingHoldsForArtwork(artworkId: number, newBidId: number): Promise<void> {
  const stripe = await getUncachableStripeClient();
  const allAuthorized = await storage.getAuthorizedBidsForArtwork(artworkId);
  // Find the just-authorized bid's amount
  const newBid = allAuthorized.find(b => b.id === newBidId);
  if (!newBid) return; // race: it was already canceled/captured
  const newAmount = Number(newBid.amount);

  for (const bid of allAuthorized) {
    if (bid.id === newBidId) continue;
    if (Number(bid.amount) >= newAmount) continue; // never cancel an equal-or-higher hold
    if (!bid.stripePaymentIntentId) continue;
    try {
      await stripe.paymentIntents.cancel(bid.stripePaymentIntentId);
      await storage.updateBidByPaymentIntent(bid.stripePaymentIntentId, { holdStatus: "canceled" });
      console.log(`[scheduler] released outbid hold ${bid.id} ($${bid.amount} < $${newAmount})`);
    } catch (err) {
      console.error(`[scheduler] failed to release outbid hold ${bid.id}:`, err);
    }
  }
}
