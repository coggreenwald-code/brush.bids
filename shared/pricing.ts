import {
  MIN_OFFER_PERCENT, ARTIST_PERCENT, WHITE_GLOVE_MIN_PRICE, WHITE_GLOVE_MAX_SIDE_IN, WHITE_GLOVE_MAX_WEIGHT_OZ,
} from "./siteConfig";

type Priced = { price: string | number; buyNowPrice?: string | number | null };

// Fixed asking price. Older listings were auctions with a starting price and
// an optional Buy It Now; the Buy It Now price (when set) is the asking price.
export function askingPrice(artwork: Priced): number {
  const buyNow = artwork.buyNowPrice != null ? Number(artwork.buyNowPrice) : NaN;
  return Number.isFinite(buyNow) && buyNow > 0 ? buyNow : Number(artwork.price);
}

export function minOfferAmount(artwork: Priced): number {
  return Math.ceil(askingPrice(artwork) * MIN_OFFER_PERCENT) / 100;
}

// Parse "30 x 24 inches" / "16x20 in" / "24 x 18 x 2" into inch sides.
export function parseDimensions(dimensions: string | null | undefined): number[] {
  if (!dimensions) return [];
  const nums = (dimensions.match(/\d+(\.\d+)?/g) || []).map(Number).filter((n) => n > 0);
  const inCm = /\bcm\b/i.test(dimensions);
  return nums.slice(0, 3).map((n) => (inCm ? n / 2.54 : n));
}

export function needsWhiteGlove(artwork: Priced & { dimensions?: string | null; weightOz?: number | null }): boolean {
  if (askingPrice(artwork) >= WHITE_GLOVE_MIN_PRICE) return true;
  const longest = Math.max(0, ...parseDimensions(artwork.dimensions));
  if (longest > WHITE_GLOVE_MAX_SIDE_IN) return true;
  return (artwork.weightOz ?? 0) > WHITE_GLOVE_MAX_WEIGHT_OZ;
}

// Artist's share of the item price in cents. A visibility boost is paid out of
// the artist's share, matching the existing payout rules.
export function artistShareCents(itemCents: number, promotionPercentage: number | string | null | undefined): number {
  const boost = Number(promotionPercentage || 0);
  return Math.round((itemCents * Math.max(0, ARTIST_PERCENT - boost)) / 100);
}
