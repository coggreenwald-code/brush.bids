import { sql } from "drizzle-orm";
import { boolean, date, index, jsonb, pgTable, timestamp, varchar, text, pgEnum } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["artist", "buyer", "both", "admin"]);

// Manual-payout method an artist (or their guardian) chose at signup. Stripe
// Connect lives in its own dedicated columns and is treated as an *additional*
// optional path; "stripe" is intentionally NOT in this enum.
export const payoutMethodEnum = pgEnum("payout_method", ["paypal", "venmo", "zelle"]);

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  username: text("username").unique(),
  role: roleEnum("role").default("artist").notNull(),
  bio: text("bio"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  hasCompletedOnboarding: timestamp("has_completed_onboarding"),
  // Optional Stripe Connect path. Artists may upgrade to direct payouts after
  // their first sale or whenever they like; until then we use the manual
  // payoutMethod/payoutHandle below.
  stripeAccountId: varchar("stripe_account_id"),
  stripeOnboardingComplete: boolean("stripe_onboarding_complete").default(false).notNull(),
  stripePayoutsEnabled: boolean("stripe_payouts_enabled").default(false).notNull(),
  // Hybrid payout fields. We default new artists to a manual handle (PayPal /
  // Venmo / Zelle) so a Stripe Connect account isn't required to list.
  dateOfBirth: date("date_of_birth"),
  payoutMethod: payoutMethodEnum("payout_method"),
  payoutHandle: text("payout_handle"),
  // Minor (under 18) protection. Earnings get sent to the parent/guardian's
  // payout method until the artist turns 18 and either upgrades to Stripe or
  // sets their own handle.
  parentGuardianEmail: text("parent_guardian_email"),
  parentPayoutMethod: payoutMethodEnum("parent_payout_method"),
  parentPayoutHandle: text("parent_payout_handle"),
  parentTermsAcceptedAt: timestamp("parent_terms_accepted_at"),
  // Set when we email the artist after they cross their 18th birthday so we
  // don't spam them on every login.
  adultUpgradeNotifiedAt: timestamp("adult_upgrade_notified_at"),
  // Ship-from address for EasyPost rate calculation. Artists set this on the
  // Dashboard; without it we can't quote live carrier rates for their artwork.
  shipFromStreet: text("ship_from_street"),
  shipFromCity: text("ship_from_city"),
  shipFromState: varchar("ship_from_state", { length: 2 }),
  shipFromZip: varchar("ship_from_zip", { length: 10 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
