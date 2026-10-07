// Single source of truth for business terms shown on the site. Change a value
// here and every page, email and meta tag that quotes it updates together.

// Revenue split, in percent of the sale price.
export const ARTIST_PERCENT = 75;
export const PLATFORM_PERCENT = 20;
export const CHARITY_PERCENT = 5;

// Named charities may only appear publicly once BrushBids has a signed
// agreement with each one (NY Executive Law 173-a). Until then, public pages
// say "charity" without naming an organization.
export const SHOW_CHARITY_NAMES = false;

// When artists are paid, in plain language. No fixed number of days: payout
// timing depends on delivery and the payout provider, so we don't promise one.
export const PAYOUT_TIMING = "after the buyer receives the artwork";

// Buyers must be adults: purchases and bids are binding contracts.
export const MIN_BUYER_AGE = 18;

// Offers: lowest allowed offer as a share of the asking price, and how long an
// offer (or an accepted offer awaiting payment) stays open.
export const MIN_OFFER_PERCENT = 75;
export const OFFER_WINDOW_HOURS = 48;

// Buyers get this many days after delivery to report a problem before the
// artist is paid.
export const INSPECTION_DAYS = 3;

// Orders at or above this price, or larger/heavier than these limits, are
// flagged for white-glove shipping (ARTA) instead of a standard parcel.
export const WHITE_GLOVE_MIN_PRICE = 1000;
export const WHITE_GLOVE_MAX_SIDE_IN = 48;
export const WHITE_GLOVE_MAX_WEIGHT_OZ = 50 * 16;

// White-glove (ARTA) shipping. With an ARTA_API_KEY set, buyers pay ARTA's
// live quote. Without one, they pay these estimates by the artwork's longest
// side. They're deliberately on the high side; replace them with real ARTA
// quotes once you have a few. Pieces longer than the last tier are "email us
// to buy".
export const WHITE_GLOVE_SHIPPING_TIERS: { maxSideIn: number; priceUsd: number }[] = [
  { maxSideIn: 60, priceUsd: 295 },
  { maxSideIn: 96, priceUsd: 495 },
];

// Shipping charged when live EasyPost rates are unavailable, by package size.
// Insurance is added on top. Adjust these to match real costs.
export const FLAT_SHIPPING_TIERS = [
  { maxSideIn: 16, maxWeightOz: 2 * 16, priceUsd: 15, label: "Small parcel" },
  { maxSideIn: 30, maxWeightOz: 10 * 16, priceUsd: 35, label: "Medium parcel" },
  { maxSideIn: Infinity, maxWeightOz: Infinity, priceUsd: 75, label: "Large parcel" },
];

// Shipping insurance cost as a share of the insured value (EasyPost charges
// about 0.5%; confirm against your EasyPost pricing).
export const INSURANCE_RATE = 0.005;
export const INSURANCE_MIN_USD = 1;

export const CONTACT_EMAIL = "charlie@brushbids.com";

// BrushBids profile URLs. Leave a value empty to hide that icon.
export const SOCIAL_URLS = {
  instagram: "https://www.instagram.com/brushbids/",
  x: "",
  linkedin: "https://www.linkedin.com/company/brushbids/",
  facebook: "",
};
