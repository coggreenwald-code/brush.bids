import { pgTable, text, serial, integer, boolean, timestamp, decimal, pgEnum, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users, roleEnum } from "./models/auth";

export * from "./models/auth";
export * from "./models/chat";

export const statusEnum = pgEnum("status", ["pending", "approved", "rejected"]);
export const reviewTypeEnum = pgEnum("review_type", ["ai_instant", "human_curator"]);
export const holdStatusEnum = pgEnum("hold_status", ["pending", "authorized", "captured", "canceled", "failed"]);

export const artworks = pgTable("artworks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  artistId: varchar("artist_id").references(() => users.id).notNull(),
  status: statusEnum("status").default("pending").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
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
  shippingState: text("shipping_state"),
  shippingPostalCode: text("shipping_postal_code"),
  shippingCity: text("shipping_city"),
  capturedAt: timestamp("captured_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_bids_pi").on(table.stripePaymentIntentId),
  index("idx_bids_session").on(table.stripeCheckoutSessionId),
  index("idx_bids_captured_at").on(table.capturedAt),
]);

export const charities = pgTable("charities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  website: text("website"),
  category: text("category").default("global").notNull(),
  featured: boolean("featured").default(false).notNull(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertArtworkSchema = createInsertSchema(artworks).omit({ id: true, createdAt: true, endTime: true, aiScore: true, aiFeedback: true, status: true });
export const insertBidSchema = createInsertSchema(bids).omit({ id: true, createdAt: true, holdStatus: true, stripeCheckoutSessionId: true, stripePaymentIntentId: true });
export const insertCharitySchema = createInsertSchema(charities).omit({ id: true });
export const insertPortfolioItemSchema = createInsertSchema(portfolioItems).omit({ id: true, createdAt: true, listedForSale: true, listedAt: true });

// Types
export type Artwork = typeof artworks.$inferSelect;
export type InsertArtwork = z.infer<typeof insertArtworkSchema>;
export type Bid = typeof bids.$inferSelect;
export type InsertBid = z.infer<typeof insertBidSchema>;
export type Charity = typeof charities.$inferSelect;
export type InsertCharity = z.infer<typeof insertCharitySchema>;
export type PortfolioItem = typeof portfolioItems.$inferSelect;
export type InsertPortfolioItem = z.infer<typeof insertPortfolioItemSchema>;
