---
name: BrushBids buyout & auction settlement
description: How Buy It Now, the double-sale guard, shipping charging, and scheduler settlement interact — non-obvious money-flow constraints.
---

## Shipping is NOT charged via Stripe
The bid checkout charges **bid + tax only**. Shipping is collected as a US ship-to
address (for Stripe Tax) but never added as a line item or `shipping_options`, and
bid PI metadata doesn't even store shipping. Buyout intentionally mirrors this
(charges `buyNowPrice` + tax; shipping carrier/service/amount stored in PI metadata
only for record-keeping).
**Why:** Winning bids are captured at PI amount (bid + tax) — no shipping. Charging
shipping on buyout but not on winning bids would make buyers pay inconsistently.
**How to apply:** If you ever add shipping charging, do it to BOTH bid capture and
buyout together, or buyers get charged differently for the same artwork.

## Double-sale guard = `tryClaimArtworkSale` (atomic UPDATE WHERE paidAt IS NULL)
Both the buyout webhook and the scheduler capture path call it. Whoever sets `paidAt`
first wins; the loser **refunds its already-captured charge** and cancels its bid.
The scheduler claims *after* capturing (so the refund-on-loss path is clean), not before.

## Scheduler never retries a claimed artwork
`getEndedAuctionsAwaitingCapture` filters `paidAt IS NULL`. Once `tryClaimArtworkSale`
sets `paidAt`, that artwork is gone from the scheduler forever.
**Why:** A throw in post-claim steps (tax persist, mark captured, queue payout) would
permanently strand settlement — money captured, no payout row.
**How to apply:** After the claim, run money-critical steps first (markBidCaptured,
queueManualPayoutForBid) and keep auxiliary bookkeeping (persistTaxIfMissing)
best-effort with `.catch`. `queueManualPayoutForBid` is idempotent on `payouts.bidId`
(NOT NULL UNIQUE), which requires a real captured bid row to exist first. The buyout
*webhook* path is naturally recoverable because Stripe retries failed webhooks; the
scheduler is the one that needs the best-effort ordering.
