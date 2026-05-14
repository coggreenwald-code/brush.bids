// Periodic job that settles ended auctions: captures the highest authorized
// hold, releases the rest, and marks the artwork paid. Runs every 60s and is
// also callable on demand via POST /api/auctions/settle.

import { storage } from "./storage";
import { getUncachableStripeClient } from "./stripeClient";
import { persistTaxIfMissing } from "./taxPersistence";
import { resolvePayoutTarget } from "@shared/payoutHelpers";
import { sendManualPayoutQueuedEmail, sendPayoutSetupNeededEmail } from "./emailService";

let inFlight = false;
const noWinnerLogged = new Set<number>();

export async function settleEndedAuctions(): Promise<{ processed: number; captured: number; errors: number }> {
  if (inFlight) return { processed: 0, captured: 0, errors: 0 };
  inFlight = true;
  let processed = 0;
  let captured = 0;
  let errors = 0;
  try {
    const ended = await storage.getEndedAuctionsAwaitingCapture();
    for (const artwork of ended) {
      processed++;
      try {
        const didCapture = await settleArtwork(artwork.id);
        if (didCapture) captured++;
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
  return { processed, captured, errors };
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

async function settleArtwork(artworkId: number): Promise<boolean> {
  const artwork = await storage.getArtwork(artworkId);
  if (!artwork || artwork.paidAt) return false;

  const winningBid = await storage.getHighestAuthorizedBid(artworkId);
  if (!winningBid || !winningBid.stripePaymentIntentId) {
    if (!noWinnerLogged.has(artworkId)) {
      noWinnerLogged.add(artworkId);
      console.log(`[scheduler] artwork ${artworkId} ended with no authorized bids yet`);
    }
    return false;
  }
  noWinnerLogged.delete(artworkId);

  const stripe = await getUncachableStripeClient();
  let currentWinner = winningBid;
  while (true) {
    if (!currentWinner.stripePaymentIntentId) return false;
    try {
      // Recompute application_fee at capture time so the platform retains
      // (its pre-tax cut) + (collected sales tax). Artist payout stays based
      // on the pre-tax bid.
      const piBefore = await stripe.paymentIntents.retrieve(currentWinner.stripePaymentIntentId);
      const totalCents = piBefore.amount;
      const bidCents = Math.round(Number(currentWinner.amount) * 100);
      const taxCents = Math.max(0, totalCents - bidCents);
      const baseFeeCents = Number(piBefore.metadata?.baseAppFeeCents || 0)
        || Math.round(bidCents * 0.25);
      // For Connect bids the PI carries transfer_data and we bump the
      // application_fee to keep platform-cut + tax. For manual-payout bids
      // the funds land on the platform balance so capture takes no fee
      // override (whole charge stays on platform; admin pays artist later).
      const isManualPayout = (piBefore.metadata?.payoutKind === "manual") || !piBefore.transfer_data;
      const captureArgs: any = isManualPayout
        ? {}
        : { application_fee_amount: Math.min(totalCents, baseFeeCents + taxCents) };
      await stripe.paymentIntents.capture(currentWinner.stripePaymentIntentId, captureArgs);
      await persistTaxIfMissing(currentWinner.stripeCheckoutSessionId, currentWinner.stripePaymentIntentId);
      await storage.markBidCaptured(currentWinner.stripePaymentIntentId);
      await storage.markArtworkPaid(artworkId, currentWinner.bidderId);
      if (isManualPayout) {
        await queueManualPayoutForBid(currentWinner, artwork, bidCents);
      }
      console.log(`[scheduler] captured winning bid ${currentWinner.id} for artwork ${artworkId} (bid ${bidCents}c + tax ${taxCents}c, ${isManualPayout ? "manual payout queued" : "connect transfer"})`);
      break;
    } catch (err: any) {
      if (err?.code !== "payment_intent_unexpected_state") throw err;
      // Disambiguate "already captured" vs "no longer capturable" by reading
      // the actual PI status before deciding.
      const pi = await stripe.paymentIntents.retrieve(currentWinner.stripePaymentIntentId);
      if (pi.status === "succeeded") {
        await persistTaxIfMissing(currentWinner.stripeCheckoutSessionId, currentWinner.stripePaymentIntentId);
        await storage.markBidCaptured(currentWinner.stripePaymentIntentId);
        await storage.markArtworkPaid(artworkId, currentWinner.bidderId);
        const isManualPayout = (pi.metadata?.payoutKind === "manual") || !pi.transfer_data;
        if (isManualPayout) {
          const bidCents = Math.round(Number(currentWinner.amount) * 100);
          await queueManualPayoutForBid(currentWinner, artwork, bidCents);
        }
        break;
      }
      console.warn(`[scheduler] bid ${currentWinner.id} not capturable (${pi.status}); falling back`);
      await storage.updateBidByPaymentIntent(currentWinner.stripePaymentIntentId, { holdStatus: "failed" });
      const next = await storage.getHighestAuthorizedBid(artworkId);
      if (!next || next.id === currentWinner.id) return false;
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
  return true;
}

// Insert a Pending Payout row (idempotent on bid id) for a manual-payout sale,
// snapshotting the artist's current handle so later edits don't change history.
// The amount queued is the artist's pre-tax share after the platform's cut and
// any promotion boost — charity (5%) is held back too and the admin can decide
// how to disburse it later.
async function queueManualPayoutForBid(
  bid: { id: number; bidderId: string; amount: string },
  artwork: { id: number; artistId: string; promotionPercentage: string | number | null },
  bidCents: number,
): Promise<void> {
  try {
    const existing = await storage.getPayoutByBidId(bid.id);
    if (existing) return;
    const artist = await storage.getUser(artwork.artistId);
    if (!artist) {
      console.error(`[scheduler] cannot queue payout for bid ${bid.id} — artist ${artwork.artistId} missing`);
      return;
    }
    // NOTE: we DON'T short-circuit on the artist's *current* Stripe Connect
    // readiness — by the time settlement runs, the funds for this bid are
    // already on platform balance (the PI was created with `payoutKind=manual`
    // and no `transfer_data`). Even if the artist has since connected Stripe,
    // we still owe them this sale through the manual rail; future bids will
    // use Connect automatically.
    const target = resolvePayoutTarget(artist);
    // If artist has Stripe Connect ready (shouldn't happen for a manual-payout
    // PI, but guard anyway). Log and return — the transfer already happened.
    if (target && target.kind !== "manual") {
      console.error(`[scheduler] manual payout queue: bid ${bid.id} — artist ${artist.id} has Connect, skipping manual row`);
      return;
    }
    const promotionPct = Number(artwork.promotionPercentage || 0);
    // Base split: 75% artist - boost%. Charity (5%) stays on platform balance
    // until the admin disburses it manually.
    const artistShareRatio = Math.max(0, (75 - promotionPct) / 100);
    const amountDollars = ((bidCents * artistShareRatio) / 100).toFixed(2);

    // Create the payout row whether or not the artist has a handle on file.
    // If method/handle are null the admin queue will show "Awaiting artist
    // setup" and the artist will be emailed to configure their method.
    await storage.createPayout({
      bidId: bid.id,
      artworkId: artwork.id,
      artistId: artist.id,
      amount: amountDollars,
      method: target?.method ?? null,
      handle: target?.handle ?? null,
      recipientEmail: target?.recipientEmail ?? artist.email,
      forMinor: target?.forMinor ?? false,
    } as any);

    if (!target) {
      // No payout method configured — email artist to set one up.
      sendPayoutSetupNeededEmail({
        artist: { id: artist.id, email: artist.email, firstName: artist.firstName, lastName: artist.lastName },
        artworkTitle: (artwork as any).title || "your artwork",
        amount: amountDollars,
      }).catch(err => console.error("[scheduler] payout-setup-needed email failed:", err));
    } else {
      sendManualPayoutQueuedEmail({
        artist: { id: artist.id, email: artist.email, firstName: artist.firstName, lastName: artist.lastName },
        parentEmail: artist.parentGuardianEmail,
        artworkTitle: (artwork as any).title || "your artwork",
        amount: amountDollars,
        method: target.method,
        handle: target.handle,
        forMinor: target.forMinor,
      }).catch(err => console.error("[scheduler] manual-payout email failed:", err));
    }
  } catch (err) {
    console.error(`[scheduler] failed to queue manual payout for bid ${bid.id}:`, err);
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
