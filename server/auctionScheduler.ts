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
// In-memory set of ended auctions we've already determined have no authorized
// bidder, so the scheduler doesn't reprocess them every tick. Cleared on restart.
const noWinnerArtworkIds = new Set<number>();

export async function settleEndedAuctions(): Promise<{ settled: number; errors: number }> {
  if (inFlight) return { settled: 0, errors: 0 };
  inFlight = true;
  let settled = 0;
  let errors = 0;
  try {
    const ended = await storage.getEndedAuctionsAwaitingCapture();
    for (const artwork of ended) {
      if (noWinnerArtworkIds.has(artwork.id)) continue;
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
    // No authorized bid — record it in memory so we stop re-checking. If a
    // late webhook ever flips a hold to authorized after end time, the next
    // process restart will re-discover it; that's an acceptable trade-off.
    if (!noWinnerArtworkIds.has(artworkId)) {
      noWinnerArtworkIds.add(artworkId);
      console.log(`[scheduler] artwork ${artworkId} ended with no authorized bids; marking as no-winner`);
    }
    return;
  }

  const stripe = await getUncachableStripeClient();

  // Capture the winner
  try {
    await stripe.paymentIntents.capture(winningBid.stripePaymentIntentId);
    await storage.updateBidByPaymentIntent(winningBid.stripePaymentIntentId, { holdStatus: "captured" });
    await storage.markArtworkPaid(artworkId, winningBid.bidderId);
    console.log(`[scheduler] captured winning bid ${winningBid.id} for artwork ${artworkId}`);
  } catch (err: any) {
    // If already captured (idempotent retry), reflect that and continue
    if (err?.code === "payment_intent_unexpected_state") {
      await storage.updateBidByPaymentIntent(winningBid.stripePaymentIntentId, { holdStatus: "captured" });
      await storage.markArtworkPaid(artworkId, winningBid.bidderId);
    } else {
      throw err;
    }
  }

  // Release every other authorized hold for this artwork
  const losers = await storage.getOtherAuthorizedBids(artworkId, winningBid.id);
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
