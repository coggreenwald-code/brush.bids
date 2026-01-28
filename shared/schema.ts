import { pgTable, text, serial, integer, boolean, timestamp, decimal, pgEnum, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users, roleEnum } from "./models/auth";

export * from "./models/auth";
export * from "./models/chat";

export const statusEnum = pgEnum("status", ["pending", "approved", "rejected"]);

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
  paidAt: timestamp("paid_at"),
  paidBy: varchar("paid_by").references(() => users.id),
  stripeSessionId: text("stripe_session_id"),
  promotionPercentage: integer("promotion_percentage").default(0),
});

export const bids = pgTable("bids", {
  id: serial("id").primaryKey(),
  artworkId: integer("artwork_id").references(() => artworks.id).notNull(),
  bidderId: varchar("bidder_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const charities = pgTable("charities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  website: text("website"),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertArtworkSchema = createInsertSchema(artworks).omit({ id: true, createdAt: true, aiScore: true, aiFeedback: true, status: true });
export const insertBidSchema = createInsertSchema(bids).omit({ id: true, createdAt: true });
export const insertCharitySchema = createInsertSchema(charities).omit({ id: true });

// Types
export type Artwork = typeof artworks.$inferSelect;
export type InsertArtwork = z.infer<typeof insertArtworkSchema>;
export type Bid = typeof bids.$inferSelect;
export type InsertBid = z.infer<typeof insertBidSchema>;
export type Charity = typeof charities.$inferSelect;
export type InsertCharity = z.infer<typeof insertCharitySchema>;
