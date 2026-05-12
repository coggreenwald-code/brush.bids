// Periodic job that settles ended auctions: captures the highest authorized
// hold, releases the rest, and marks the artwork paid. Runs every 60s and is
// also callable on demand via POST /api/auctions/settle.

import { storage } from "./storage";
import { getUncachableStripeClient } from "./stripeClient";

let inFlight = false;
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
    // Retry any loser-cancel calls that failed on prior ticks.
    try {
      await releaseLingeringLosingHolds();
    } catch (err) {
      console.error("[scheduler] lingering-hold cleanup failed:", err);
    }
  } finally {
    inFlight = false;
  }
  return { settled, errors };
}

async function releaseLingeringLosingHolds(): Promise<void> {
  const lingering = await storage.getAuthorizedBidsOnPaidArtworks();
  if (lingering.length === 0) return;
  const stripe = await getUncachableStripeClient();
  for (const bid of lingering) {
    if (!bid.stripePaymentIntentId) continue;
    try {
      await stripe.paymentIntents.cancel(bid.stripePaymentIntentId);
      await storage.updateBidByPaymentIntent(bid.stripePaymentIntentId, { holdStatus: "canceled" });
      console.log(`[scheduler] cleaned up lingering loser hold ${bid.id}`);
    } catch (err) {
      console.error(`[scheduler] retry-cancel failed for bid ${bid.id}:`, err);
    }
  }
}

async function settleArtwork(artworkId: number): Promise<void> {
  const artwork = await storage.getArtwork(artworkId);
  if (!artwork || artwork.paidAt) return;

  const winningBid = await storage.getHighestAuthorizedBid(artworkId);
  if (!winningBid || !winningBid.stripePaymentIntentId) {
    if (!noWinnerLogged.has(artworkId)) {
      noWinnerLogged.add(artworkId);
      console.log(`[scheduler] artwork ${artworkId} ended with no authorized bids yet`);
    }
    return;
  }
  noWinnerLogged.delete(artworkId);

  const stripe = await getUncachableStripeClient();
  let currentWinner = winningBid;
  while (true) {
    if (!currentWinner.stripePaymentIntentId) return;
    try {
      await stripe.paymentIntents.capture(currentWinner.stripePaymentIntentId);
      await storage.updateBidByPaymentIntent(currentWinner.stripePaymentIntentId, { holdStatus: "captured" });
      await storage.markArtworkPaid(artworkId, currentWinner.bidderId);
      console.log(`[scheduler] captured winning bid ${currentWinner.id} for artwork ${artworkId}`);
      break;
    } catch (err: any) {
      if (err?.code !== "payment_intent_unexpected_state") throw err;
      // Disambiguate "already captured" vs "no longer capturable" by reading
      // the actual PI status before deciding.
      const pi = await stripe.paymentIntents.retrieve(currentWinner.stripePaymentIntentId);
      if (pi.status === "succeeded") {
        await storage.updateBidByPaymentIntent(currentWinner.stripePaymentIntentId, { holdStatus: "captured" });
        await storage.markArtworkPaid(artworkId, currentWinner.bidderId);
        break;
      }
      console.warn(`[scheduler] bid ${currentWinner.id} not capturable (${pi.status}); falling back`);
      await storage.updateBidByPaymentIntent(currentWinner.stripePaymentIntentId, { holdStatus: "failed" });
      const next = await storage.getHighestAuthorizedBid(artworkId);
      if (!next || next.id === currentWinner.id) return;
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

// Cancel every authorized hold strictly LOWER than the new bid's amount.
// Comparing by amount (not id) keeps a late webhook for an older, lower bid
// from wiping out a higher active hold.
export async function releaseLosingHoldsForArtwork(artworkId: number, newBidId: number): Promise<void> {
  const stripe = await getUncachableStripeClient();
  const all = await storage.getAuthorizedBidsForArtwork(artworkId);
  const newBid = all.find(b => b.id === newBidId);
  if (!newBid) return;
  const newAmount = Number(newBid.amount);
  for (const bid of all) {
    if (bid.id === newBidId || Number(bid.amount) >= newAmount || !bid.stripePaymentIntentId) continue;
    try {
      await stripe.paymentIntents.cancel(bid.stripePaymentIntentId);
      await storage.updateBidByPaymentIntent(bid.stripePaymentIntentId, { holdStatus: "canceled" });
    } catch (err) {
      console.error(`[scheduler] failed to release outbid hold ${bid.id}:`, err);
    }
  }
}
