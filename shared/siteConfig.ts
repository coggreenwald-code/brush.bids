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

// When artists are paid, in plain language.
export const PAYOUT_TIMING = "within 5 business days after the buyer receives the artwork";

// Buyers must be adults: purchases and bids are binding contracts.
export const MIN_BUYER_AGE = 18;

export const CONTACT_EMAIL = "charlie@brushbids.com";

// BrushBids profile URLs. Leave a value empty to hide that icon.
export const SOCIAL_URLS = {
  instagram: "",
  x: "",
  linkedin: "",
  facebook: "",
};
