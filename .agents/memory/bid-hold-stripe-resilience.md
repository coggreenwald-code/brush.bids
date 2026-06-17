---
name: Bid-hold Stripe resilience & tax compliance
description: Rules for POST /api/bids Checkout-Session creation — what may fall back and what must fail closed.
---

# Bid-hold Checkout Session (POST /api/bids)

- **Stripe Tax must fail closed.** BrushBids is the marketplace facilitator and is obligated to collect sales tax, so `automatic_tax` stays `{ enabled: true }` always. Never add a fallback that retries with tax disabled — a tax-config error must surface as an actionable error, not silently sell untaxed.
  **Why:** a silent tax-disable fallback was flagged as a compliance regression in code review.

- **Connect destination MAY fall back to manual payout.** A connected account can be invalid in the active mode (classic case: a TEST-mode `acct_…` used with LIVE keys). On a `StripeInvalidRequestError` matching the destination, retry the session WITHOUT `transfer_data`/`application_fee_amount` and flip PI metadata `payoutKind` to `manual`. The auction scheduler/webhook already treat `payoutKind==='manual'` (or absent `transfer_data`) as the manual payout queue, so this stays consistent.

- **Surface real Stripe errors.** The "client disconnected before the request was completed" message buyers saw was a `StripeConnectionError` (transient/cold-start). Mitigations: cached Stripe client + cached credentials (10-min TTL) in `stripeClient.ts`, plus `maxNetworkRetries`/`timeout` on the SDK. The catch block logs `type/code/param/requestId/message` and returns a meaningful message — keep it that way so prod failures are diagnosable.

- **Approval gate:** an artwork can only be approved if its artist has a complete ship-from address, so no biddable listing 422s the buyer's shipping-rate lookup mid-bid.
