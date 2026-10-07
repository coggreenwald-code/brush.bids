import { pgTable, text, serial, integer, boolean, timestamp, decimal, pgEnum, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users, roleEnum, payoutMethodEnum } from "./models/auth";

export * from "./models/auth";
export * from "./models/chat";
export * from "./payoutHelpers";

export const statusEnum = pgEnum("status", ["pending", "approved", "rejected"]);
export const reviewTypeEnum = pgEnum("review_type", ["ai_instant", "human_curator"]);
export const holdStatusEnum = pgEnum("hold_status", ["pending", "authorized", "captured", "canceled", "failed"]);
// Manual-payout queue states. We only insert payout rows for artists who don't
// have Stripe Connect ready — Connect transfers happen automatically inside
// Stripe and don't need their own row.
export const payoutStatusEnum = pgEnum("payout_status", ["pending", "paid", "skipped"]);

export const artworks = pgTable("artworks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  artistId: varchar("artist_id").references(() => users.id).notNull(),
  status: statusEnum("status").default("pending").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  // Optional "Buy It Now" / buyout price. When set (and > reserve price), a
  // collector can purchase the artwork immediately at this price, ending the
  // auction. NULL means no buyout option.
  buyNowPrice: decimal("buy_now_price", { precision: 10, scale: 2 }),
  aiScore: integer("ai_score"),
  aiFeedback: text("ai_feedback"),
  charityId: integer("charity_id"),
  createdAt: timestamp("created_at").defaultNow(),
  endTime: timestamp("end_time"),
  auctionDurationDays: integer("auction_duration_days").default(7).notNull(),
  paidAt: timestamp("paid_at"),
  paidBy: varchar("paid_by").references(() => users.id),
  stripeSessionId: text("stripe_session_id"),
  promotionPercentage: integer("promotion_percentage").default(0),
  reviewType: reviewTypeEnum("review_type").default("ai_instant").notNull(),
  views: integer("views").default(0).notNull(),
  dimensions: text("dimensions"),
  charityNote: text("charity_note"),
  // Weight in ounces — required for live shipping rate quotes via EasyPost.
  weightOz: integer("weight_oz"),
});

export const portfolioItems = pgTable("portfolio_items", {
  id: serial("id").primaryKey(),
  artistId: varchar("artist_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  dimensions: text("dimensions"),
  price: decimal("price", { precision: 10, scale: 2 }),
  listedForSale: boolean("listed_for_sale").default(false).notNull(),
  listedAt: timestamp("listed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bids = pgTable("bids", {
  id: serial("id").primaryKey(),
  artworkId: integer("artwork_id").references(() => artworks.id).notNull(),
  bidderId: varchar("bidder_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  holdStatus: holdStatusEnum("hold_status").default("pending").notNull(),
  stripeCheckoutSessionId: text("stripe_checkout_session_id").unique(),
  stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
  // Sales-tax columns. Populated by the Stripe Tax automatic-tax flow once the
  // buyer completes Checkout (for the persisted shipping address) and finalized
  // when the auction settles. taxJurisdiction stores e.g. "NY-10024" (state +
  // postal). taxRate is the effective combined percent (state + locality).
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }),
  taxRate: decimal("tax_rate", { precision: 6, scale: 4 }),
  taxJurisdiction: text("tax_jurisdiction"),
  taxableAmount: decimal("taxable_amount", { precision: 10, scale: 2 }),
  // Stripe Tax audit reference. Holds the Stripe Tax Transaction id when we
  // can resolve one (created automatically by Checkout's automatic_tax flow).
  // Falls back to the Checkout Session id, which uniquely identifies the same
  // taxable event in the Stripe Tax dashboard.
  stripeTaxTransactionId: text("stripe_tax_transaction_id"),
  // Buyer shipping address (full, captured before checkout for rate calculation)
  shippingStreet: text("shipping_street"),
  shippingCity: text("shipping_city"),
  shippingState: text("shipping_state"),
  shippingPostalCode: text("shipping_postal_code"),
  shippingCountry: text("shipping_country"),
  // Selected shipping option from EasyPost rate quote
  shippingCarrier: text("shipping_carrier"),
  shippingService: text("shipping_service"),
  shippingAmount: decimal("shipping_amount", { precision: 10, scale: 2 }),
  capturedAt: timestamp("captured_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_bids_pi").on(table.stripePaymentIntentId),
  index("idx_bids_session").on(table.stripeCheckoutSessionId),
  index("idx_bids_captured_at").on(table.capturedAt),
]);

// Manual payout queue. One row per won bid where the artist does NOT have
// Stripe Connect ready (so the funds landed on the platform balance and the
// admin needs to send the artist their share off-platform via PayPal/Venmo/
// Zelle). Bid id is unique to keep this idempotent against scheduler retries.
export const payouts = pgTable("payouts", {
  id: serial("id").primaryKey(),
  bidId: integer("bid_id").references(() => bids.id).notNull().unique(),
  artworkId: integer("artwork_id").references(() => artworks.id).notNull(),
  artistId: varchar("artist_id").references(() => users.id).notNull(),
  // Net amount we owe the artist in dollars (bid - platform cut, charity is
  // also paid out manually so it's NOT subtracted here — admin can decide).
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  // Snapshot of the chosen payout method/handle at settlement. NULL when the
  // artist hasn't configured a payout method yet — admin must chase them up
  // before dispersing funds.
  method: payoutMethodEnum("method"),
  handle: text("handle"),
  recipientEmail: text("recipient_email"),
  forMinor: boolean("for_minor").default(false).notNull(),
  status: payoutStatusEnum("status").default("pending").notNull(),
  paidAt: timestamp("paid_at"),
  paidByAdminId: varchar("paid_by_admin_id").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_payouts_status").on(table.status),
  index("idx_payouts_artist").on(table.artistId),
]);

export const offerStatusEnum = pgEnum("offer_status", ["pending", "accepted", "declined", "expired", "withdrawn", "purchased"]);

// Make an Offer. The artist accepts or declines within the offer window; an
// accepted offer then gives the buyer the same window to pay.
export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  artworkId: integer("artwork_id").references(() => artworks.id).notNull(),
  buyerId: varchar("buyer_id").references(() => users.id).notNull(),
  artistId: varchar("artist_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: offerStatusEnum("status").default("pending").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_offers_artwork").on(table.artworkId),
  index("idx_offers_status").on(table.status),
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending_payment", "paid", "shipped", "delivered", "completed", "issue", "cancelled", "refunded",
]);

// One fixed-price sale, from checkout through delivery and artist payout.
// Money stays on the platform until delivery + the inspection window, then
// moves to the artist (Stripe transfer or the manual payout queue).
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  artworkId: integer("artwork_id").references(() => artworks.id).notNull(),
  buyerId: varchar("buyer_id").references(() => users.id).notNull(),
  artistId: varchar("artist_id").references(() => users.id).notNull(),
  offerId: integer("offer_id").references(() => offers.id),
  // Payment record for tax reporting and payout linkage.
  bidId: integer("bid_id").references(() => bids.id),
  status: orderStatusEnum("status").default("pending_payment").notNull(),
  // Private token for the buyer's no-login order status page.
  statusToken: varchar("status_token", { length: 64 }).notNull().unique(),
  itemAmount: decimal("item_amount", { precision: 10, scale: 2 }).notNull(),
  shippingAmount: decimal("shipping_amount", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  stripeCheckoutSessionId: text("stripe_checkout_session_id").unique(),
  stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
  stripeChargeId: text("stripe_charge_id"),
  buyerEmail: text("buyer_email"),
  shipName: text("ship_name"),
  shipStreet1: text("ship_street1"),
  shipStreet2: text("ship_street2"),
  shipCity: text("ship_city"),
  shipState: text("ship_state"),
  shipZip: text("ship_zip"),
  // Shipping: "easypost" (live rate), "flat" (size tier), with whiteGlove set
  // when the piece should go through ARTA instead.
  shippingMethod: text("shipping_method").notNull(),
  shippingLabel: text("shipping_label"),
  whiteGlove: boolean("white_glove").default(false).notNull(),
  insuredValue: decimal("insured_value", { precision: 10, scale: 2 }),
  carrier: text("carrier"),
  trackingNumber: text("tracking_number"),
  trackingUrl: text("tracking_url"),
  labelUrl: text("label_url"),
  easypostShipmentId: text("easypost_shipment_id"),
  easypostTrackerId: text("easypost_tracker_id"),
  // ARTA quote request to book from (white-glove pieces).
  artaRequestId: text("arta_request_id"),
  // True when the artist paid for postage themselves (reimbursed at payout).
  artistPaidShipping: boolean("artist_paid_shipping").default(false).notNull(),
  paidAt: timestamp("paid_at"),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
  payoutReleaseAt: timestamp("payout_release_at"),
  payoutReleasedAt: timestamp("payout_released_at"),
  stripeTransferId: text("stripe_transfer_id"),
  issueNote: text("issue_note"),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_orders_status").on(table.status),
  index("idx_orders_artist").on(table.artistId),
  index("idx_orders_buyer").on(table.buyerId),
]);

export const charities = pgTable("charities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  website: text("website"),
  category: text("category").default("global").notNull(),
  featured: boolean("featured").default(false).notNull(),
});

export const emailLog = pgTable("email_log", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  emailType: text("email_type").notNull(),
  recipientEmail: text("recipient_email").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

export type EmailLog = typeof emailLog.$inferSelect;

// Visitors who asked to be emailed when the next drop goes live.
export const dropSignups = pgTable("drop_signups", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertArtworkSchema = createInsertSchema(artworks).omit({ id: true, createdAt: true, endTime: true, aiScore: true, aiFeedback: true, status: true });
export const insertBidSchema = createInsertSchema(bids).omit({ id: true, createdAt: true, holdStatus: true, stripeCheckoutSessionId: true, stripePaymentIntentId: true });
export const insertCharitySchema = createInsertSchema(charities).omit({ id: true });
export const insertPortfolioItemSchema = createInsertSchema(portfolioItems).omit({ id: true, createdAt: true, listedForSale: true, listedAt: true });
export const insertPayoutSchema = createInsertSchema(payouts).omit({ id: true, createdAt: true, status: true, paidAt: true, paidByAdminId: true });

// Types
export type Artwork = typeof artworks.$inferSelect;
export type InsertArtwork = z.infer<typeof insertArtworkSchema>;
export type Bid = typeof bids.$inferSelect;
export type InsertBid = z.infer<typeof insertBidSchema>;
export type Charity = typeof charities.$inferSelect;
export type InsertCharity = z.infer<typeof insertCharitySchema>;
export type PortfolioItem = typeof portfolioItems.$inferSelect;
export type InsertPortfolioItem = z.infer<typeof insertPortfolioItemSchema>;
export type Payout = typeof payouts.$inferSelect;
export type Offer = typeof offers.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
export type InsertPayout = z.infer<typeof insertPayoutSchema>;
