// Server-side shipping quotes, labels and tracking. Prices are always computed
// here, never taken from the browser, so the amount charged at checkout is the
// amount BrushBids actually pays to ship.
import { FLAT_SHIPPING_TIERS, INSURANCE_MIN_USD, INSURANCE_RATE, WHITE_GLOVE_SHIPPING_TIERS } from "@shared/siteConfig";
import { askingPrice, needsWhiteGlove, parseDimensions } from "@shared/pricing";

export type ShipAddress = {
  name?: string;
  street1?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip: string;
};

type ShippableArtwork = {
  price: string | number;
  buyNowPrice?: string | number | null;
  dimensions?: string | null;
  weightOz?: number | null;
};

type ShipFrom = {
  firstName?: string | null;
  lastName?: string | null;
  shipFromStreet: string | null;
  shipFromCity: string | null;
  shipFromState: string | null;
  shipFromZip: string | null;
};

export type ShippingQuote = {
  amountCents: number;         // postage + insurance, what the buyer pays
  insuranceCents: number;
  method: "easypost" | "flat";
  label: string;               // e.g. "USPS Priority" or "Medium parcel"
  carrier: string | null;
  service: string | null;
  easypostShipmentId: string | null;
  whiteGlove: boolean;
  insuredValue: number;        // dollars
};

const DEFAULT_WEIGHT_OZ = 32;

function easypostKey(): string | null {
  const key = process.env.EASYPOST_API_KEY || null;
  // Local testing must never buy real postage.
  if (key && process.env.LOCAL_DEV_AUTH === "1" && !key.startsWith("EZTK")) return null;
  return key;
}

async function easypost(path: string, init: { method: string; body?: unknown }): Promise<any> {
  const key = easypostKey();
  if (!key) throw new Error("EasyPost is not configured");
  const resp = await fetch(`https://api.easypost.com/v2${path}`, {
    method: init.method,
    headers: {
      Authorization: `Basic ${Buffer.from(key + ":").toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const text = await resp.text();
  let data: any = null;
  try { data = JSON.parse(text); } catch { /* keep raw */ }
  if (!resp.ok) {
    const msg = data?.error?.message || text || `HTTP ${resp.status}`;
    throw new Error(`EasyPost ${resp.status}: ${typeof msg === "string" ? msg : JSON.stringify(msg)}`);
  }
  return data;
}

// Packed parcel size: artwork sides plus padding, minimum 3" deep.
function parcelFor(artwork: ShippableArtwork) {
  const sides = parseDimensions(artwork.dimensions).sort((a, b) => b - a);
  const length = Math.ceil((sides[0] ?? 16) + 4);
  const width = Math.ceil((sides[1] ?? 12) + 4);
  const height = Math.ceil(Math.max(3, (sides[2] ?? 1) + 2));
  const weight = Math.max(1, artwork.weightOz ?? DEFAULT_WEIGHT_OZ);
  return { length, width, height, weight };
}

export function insuranceCentsFor(valueUsd: number): number {
  return Math.round(Math.max(INSURANCE_MIN_USD, valueUsd * INSURANCE_RATE) * 100);
}

function flatQuote(artwork: ShippableArtwork, insuredValue: number, whiteGlove: boolean): ShippingQuote {
  const parcel = parcelFor(artwork);
  const tier = FLAT_SHIPPING_TIERS.find((t) => parcel.length <= t.maxSideIn && parcel.weight <= t.maxWeightOz)
    ?? FLAT_SHIPPING_TIERS[FLAT_SHIPPING_TIERS.length - 1];
  const insuranceCents = insuranceCentsFor(insuredValue);
  return {
    amountCents: Math.round(tier.priceUsd * 100) + insuranceCents,
    insuranceCents,
    method: "flat",
    label: tier.label,
    carrier: null,
    service: null,
    easypostShipmentId: null,
    whiteGlove,
    insuredValue,
  };
}

export class WhiteGloveUnavailableError extends Error {
  constructor() {
    super("This piece needs specialist art shipping. Email us to buy it and we'll arrange a quote.");
  }
}

// White-glove price from the configured tiers, or null if none apply yet.
function whiteGloveQuote(artwork: ShippableArtwork, insuredValue: number): ShippingQuote | null {
  const longest = Math.max(0, ...parseDimensions(artwork.dimensions));
  const tier = WHITE_GLOVE_SHIPPING_TIERS.find((t) => longest <= t.maxSideIn);
  if (!tier) return null;
  const insuranceCents = insuranceCentsFor(insuredValue);
  return {
    amountCents: Math.round(tier.priceUsd * 100) + insuranceCents,
    insuranceCents, method: "flat", label: "White-glove art shipping",
    carrier: "ARTA", service: null, easypostShipmentId: null, whiteGlove: true, insuredValue,
  };
}

// Quote shipping for an artwork. White-glove pieces use the configured ARTA
// tiers (and can't be quoted without them); everything else uses live EasyPost
// rates when available, otherwise the flat parcel tiers.
export async function quoteShipping(artwork: ShippableArtwork, artist: ShipFrom, to: ShipAddress): Promise<ShippingQuote> {
  const insuredValue = askingPrice(artwork);
  const whiteGlove = needsWhiteGlove(artwork);
  if (whiteGlove) {
    const quote = whiteGloveQuote(artwork, insuredValue);
    if (!quote) throw new WhiteGloveUnavailableError();
    return quote;
  }
  const hasFrom = artist.shipFromStreet && artist.shipFromCity && artist.shipFromState && artist.shipFromZip;
  if (!easypostKey() || !hasFrom) return flatQuote(artwork, insuredValue, whiteGlove);

  try {
    const shipment = await easypost("/shipments", {
      method: "POST",
      body: {
        shipment: {
          // Carriers require a sender name/company on the return address.
          from_address: {
            name: [artist.firstName, artist.lastName].filter(Boolean).join(" ") || "BrushBids Artist",
            company: "BrushBids",
            street1: artist.shipFromStreet, city: artist.shipFromCity,
            state: artist.shipFromState, zip: artist.shipFromZip, country: "US",
          },
          to_address: {
            name: to.name, street1: to.street1, street2: to.street2,
            city: to.city, state: to.state, zip: to.zip, country: "US",
          },
          parcel: parcelFor(artwork),
        },
      },
    });
    const rates = (shipment.rates || [])
      .map((r: any) => ({ ...r, cents: Math.round(parseFloat(r.rate) * 100) }))
      .filter((r: any) => Number.isFinite(r.cents))
      .sort((a: any, b: any) => a.cents - b.cents);
    if (rates.length === 0) return flatQuote(artwork, insuredValue, whiteGlove);
    const best = rates[0];
    const insuranceCents = insuranceCentsFor(insuredValue);
    return {
      amountCents: best.cents + insuranceCents,
      insuranceCents,
      method: "easypost",
      label: `${best.carrier} ${best.service}`,
      carrier: best.carrier,
      service: best.service,
      easypostShipmentId: shipment.id,
      whiteGlove,
      insuredValue,
    };
  } catch (err: any) {
    console.error("[shipping] EasyPost quote failed, using flat rate:", err.message);
    return flatQuote(artwork, insuredValue, whiteGlove);
  }
}

export function easypostConfigured(): boolean {
  return !!easypostKey();
}

// Buy the cheapest rate (matching the quoted carrier/service when possible)
// on a saved shipment, with insurance for the artwork's value.
export async function buyLabel(opts: {
  shipmentId: string;
  carrier: string | null;
  service: string | null;
  insuredValue: number;
}): Promise<{ trackingNumber: string; trackingUrl: string | null; labelUrl: string; carrier: string; trackerId: string | null }> {
  const shipment = await easypost(`/shipments/${opts.shipmentId}`, { method: "GET" });
  const rates = (shipment.rates || []).sort((a: any, b: any) => parseFloat(a.rate) - parseFloat(b.rate));
  const rate = rates.find((r: any) => r.carrier === opts.carrier && r.service === opts.service) ?? rates[0];
  if (!rate) throw new Error("No shipping rates available for this shipment");
  const bought = await easypost(`/shipments/${opts.shipmentId}/buy`, {
    method: "POST",
    body: { rate: { id: rate.id }, insurance: opts.insuredValue.toFixed(2) },
  });
  return {
    trackingNumber: bought.tracking_code,
    trackingUrl: bought.tracker?.public_url ?? null,
    labelUrl: bought.postage_label?.label_url,
    carrier: rate.carrier,
    trackerId: bought.tracker?.id ?? null,
  };
}

// Track a package the artist shipped themselves.
export async function createTracker(trackingNumber: string, carrier?: string): Promise<{ id: string; publicUrl: string | null }> {
  const tracker = await easypost("/trackers", {
    method: "POST",
    body: { tracker: { tracking_code: trackingNumber, ...(carrier ? { carrier } : {}) } },
  });
  return { id: tracker.id, publicUrl: tracker.public_url ?? null };
}

export async function getTrackerStatus(trackerId: string): Promise<{ status: string; deliveredAt: Date | null }> {
  const tracker = await easypost(`/trackers/${trackerId}`, { method: "GET" });
  const deliveredEvent = (tracker.tracking_details || []).find((d: any) => d.status === "delivered");
  return {
    status: tracker.status,
    deliveredAt: tracker.status === "delivered" ? new Date(deliveredEvent?.datetime || Date.now()) : null,
  };
}
