import type Stripe from 'stripe';
import { getUncachableStripeClient } from './stripeClient';
import { storage, type BidTaxUpdate } from './storage';

type TaxBreakdownEntry = {
  amount: number;
  rate?: { percentage_decimal?: string; jurisdiction?: string };
};

type ExpandedSession = Stripe.Checkout.Session & {
  total_details?: Stripe.Checkout.Session.TotalDetails & {
    breakdown?: { taxes?: TaxBreakdownEntry[] };
  };
  shipping_details?: { address?: Stripe.Address | null } | null;
};

function pickAddress(session: ExpandedSession): Stripe.Address | null {
  // Newer Stripe API versions return the shipping address under
  // collected_information; older ones under shipping_details.
  return (
    (session as any).collected_information?.shipping_details?.address ??
    session.shipping_details?.address ??
    session.customer_details?.address ??
    null
  );
}

function buildJurisdiction(
  breakdown: TaxBreakdownEntry[] | undefined,
  state: string | null | undefined,
): string {
  const parts: string[] = [];
  if (breakdown?.length) {
    for (const t of breakdown) {
      if (t.rate?.jurisdiction) parts.push(t.rate.jurisdiction);
    }
  }
  if (!parts.length && state) parts.push(`US-${state}`);
  return parts.join(', ');
}

// Looks up the Stripe Tax Transaction created by automatic_tax for the given
// PaymentIntent. Returns null if Stripe Tax isn't enabled or the transaction
// hasn't been generated yet (e.g., test-mode behavior).
async function lookupTaxTransactionId(
  stripe: Stripe,
  paymentIntentId: string,
): Promise<string | null> {
  const tax = (stripe as unknown as { tax?: { transactions?: { list?: (params: Record<string, unknown>) => Promise<{ data: Array<{ id: string }> }> } } }).tax;
  const list = tax?.transactions?.list;
  if (!list) return null;
  try {
    const result = await list({ payment_intent: paymentIntentId, limit: 1 });
    return result?.data?.[0]?.id ?? null;
  } catch (err) {
    console.warn(`[tax] tax.transactions.list failed for ${paymentIntentId}:`, err);
    return null;
  }
}

// Pull tax + ship-to data from a completed Checkout Session and persist it
// onto the matching bid row keyed by paymentIntentId. Idempotent.
export async function persistTaxFromCheckoutSession(
  sessionId: string,
  paymentIntentId: string,
): Promise<BidTaxUpdate | null> {
  const stripe = await getUncachableStripeClient();
  let session: ExpandedSession;
  try {
    session = (await stripe.checkout.sessions.retrieve(sessionId, {
      // shipping_details is no longer expandable (it errors on current API
      // versions, which silently dropped tax records); it's returned inline.
      expand: ['total_details.breakdown'],
    })) as ExpandedSession;
  } catch (err) {
    console.error(`[tax] retrieve session ${sessionId} failed:`, err);
    return null;
  }

  const taxCents = session.total_details?.amount_tax ?? 0;
  const subtotalCents = session.amount_subtotal ?? 0;
  const ship = pickAddress(session);
  const breakdown = session.total_details?.breakdown?.taxes;
  const ratePct =
    subtotalCents > 0 && taxCents > 0 ? (taxCents / subtotalCents) * 100 : 0;
  const jurisdiction = buildJurisdiction(breakdown, ship?.state);
  const taxTxnId = await lookupTaxTransactionId(stripe, paymentIntentId);

  const update: BidTaxUpdate = {
    taxAmount: (taxCents / 100).toFixed(2),
    taxableAmount: (subtotalCents / 100).toFixed(2),
    taxRate: ratePct.toFixed(4),
    taxJurisdiction: jurisdiction || (ship?.state ? `US-${ship.state}` : ''),
    stripeTaxTransactionId: taxTxnId ?? sessionId,
    shippingState: ship?.state ?? undefined,
    shippingCity: ship?.city ?? undefined,
    shippingPostalCode: ship?.postal_code ?? undefined,
  };

  try {
    await storage.updateBidTaxInfo(paymentIntentId, update);
  } catch (err) {
    console.error(`[tax] updateBidTaxInfo ${paymentIntentId} failed:`, err);
    return null;
  }
  return update;
}

// Same as above but only writes if the bid hasn't already been tagged with
// tax data — used by recovery paths (scheduler, payment_intent.succeeded).
export async function persistTaxIfMissing(
  sessionId: string | null | undefined,
  paymentIntentId: string,
): Promise<void> {
  if (!sessionId) return;
  const existing = await storage.getBidByPaymentIntent(paymentIntentId);
  if (existing?.taxAmount != null) return;
  await persistTaxFromCheckoutSession(sessionId, paymentIntentId);
}
