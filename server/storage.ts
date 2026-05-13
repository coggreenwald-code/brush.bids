import { db } from "./db";
import {
  users, artworks, bids, charities, portfolioItems, emailLog,
  type User,
  type Artwork, type InsertArtwork,
  type Bid, type InsertBid,
  type Charity, type InsertCharity,
  type PortfolioItem, type InsertPortfolioItem,
  type EmailLog,
} from "@shared/schema";
import { eq, desc, sql, and, lte, isNull, ne, inArray } from "drizzle-orm";

export type HoldStatus = "pending" | "authorized" | "captured" | "canceled" | "failed";

type BidInsertWithStripe = InsertBid & {
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
  holdStatus?: HoldStatus;
};

export type BidTaxUpdate = {
  taxAmount?: string;
  taxRate?: string;
  taxJurisdiction?: string;
  taxableAmount?: string;
  stripeTaxTransactionId?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCity?: string;
};

export type TaxReportRow = {
  month: string;
  state: string;
  taxableAmount: number;
  taxAmount: number;
  saleCount: number;
};

export type TaxReportSaleRow = {
  bidId: number;
  artworkId: number;
  artworkTitle: string;
  bidderId: string;
  capturedAt: Date | null;
  amount: number;
  taxableAmount: number;
  taxAmount: number;
  taxRate: number;
  shippingState: string;
  shippingPostalCode: string;
  shippingCity: string;
  taxJurisdiction: string;
  stripePaymentIntentId: string | null;
  stripeTaxTransactionId: string | null;
};

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  updateUserRole(id: string, role: "artist" | "buyer" | "both" | "admin"): Promise<User>;
  updateUserBio(id: string, bio: string): Promise<User>;
  updateUserName(id: string, firstName: string, lastName: string): Promise<User>;
  updateUserProfileImage(id: string, profileImageUrl: string): Promise<User>;
  completeOnboarding(id: string, role: "artist" | "buyer" | "both", firstName?: string, lastName?: string): Promise<User>;

  setUserStripeAccount(id: string, stripeAccountId: string): Promise<User>;
  updateUserStripeStatus(id: string, opts: { onboardingComplete?: boolean; payoutsEnabled?: boolean }): Promise<User>;
  getUserByStripeAccount(stripeAccountId: string): Promise<User | undefined>;

  getArtworks(status?: "pending" | "approved" | "rejected", artistId?: string): Promise<Artwork[]>;
  getArtwork(id: number): Promise<Artwork | undefined>;
  createArtwork(artwork: InsertArtwork): Promise<Artwork>;
  updateArtworkStatus(id: number, status: "pending" | "approved" | "rejected", feedback?: string, score?: number): Promise<Artwork>;
  setArtworkCheckoutSession(id: number, stripeSessionId: string, expectedPaidBy: string): Promise<Artwork>;
  markArtworkPaid(id: number, paidBy?: string): Promise<Artwork | null>;
  getArtworkBySessionId(sessionId: string): Promise<Artwork | undefined>;
  updateArtworkPromotion(id: number, promotionPercentage: number): Promise<Artwork>;
  getApprovedArtworksSortedByPromotion(): Promise<Artwork[]>;
  getEndedAuctionsAwaitingCapture(): Promise<Artwork[]>;
  incrementArtworkViews(id: number): Promise<void>;
  deleteArtwork(id: number): Promise<void>;
  extendAuctionEndTime(id: number, newEndTime: Date): Promise<Artwork>;

  getBidsForArtwork(artworkId: number): Promise<Bid[]>;
  getBidsForUser(userId: string): Promise<Array<{
    artworkId: number;
    artwork: Artwork | null;
    userHighestBid: number;
    artworkHighestBid: number;
    isHighest: boolean;
    auctionEnded: boolean;
    latestBidAt: Date | null;
    isPaid: boolean;
    holdStatus: HoldStatus;
    taxAmount: number | null;
    taxRate: number | null;
    taxJurisdiction: string | null;
    capturedAt: Date | null;
  }>>;
  createBid(bid: BidInsertWithStripe): Promise<Bid>;
  updateBidByCheckoutSession(sessionId: string, updates: { holdStatus?: HoldStatus; stripePaymentIntentId?: string }): Promise<Bid | undefined>;
  updateBidByPaymentIntent(paymentIntentId: string, updates: { holdStatus?: HoldStatus }): Promise<Bid | undefined>;
  getBidByCheckoutSession(sessionId: string): Promise<Bid | undefined>;
  getBidByPaymentIntent(paymentIntentId: string): Promise<Bid | undefined>;
  getAuthorizedBidsForArtwork(artworkId: number): Promise<Bid[]>;
  getActiveBidsForArtwork(artworkId: number): Promise<Bid[]>;
  getHighestAuthorizedBid(artworkId: number): Promise<Bid | undefined>;
  getOtherAuthorizedBids(artworkId: number, exceptBidId: number): Promise<Bid[]>;
  getAuthorizedBidsOnPaidArtworks(): Promise<Bid[]>;
  updateBidTaxInfo(paymentIntentId: string, info: BidTaxUpdate): Promise<Bid | undefined>;
  markBidCaptured(paymentIntentId: string, taxInfo?: BidTaxUpdate): Promise<Bid | undefined>;
  getTaxReportSummary(opts?: { from?: Date; to?: Date }): Promise<TaxReportRow[]>;
  getTaxReportSales(opts?: { from?: Date; to?: Date }): Promise<TaxReportSaleRow[]>;

  getCharities(): Promise<Charity[]>;

  getPortfolioItems(artistId: string): Promise<PortfolioItem[]>;
  getPortfolioItem(id: number): Promise<PortfolioItem | undefined>;
  createPortfolioItem(item: InsertPortfolioItem): Promise<PortfolioItem>;
  listPortfolioItemForSale(id: number, price: number): Promise<PortfolioItem>;
  deletePortfolioItem(id: number): Promise<void>;

  insertEmailLog(log: { userId: string; emailType: string; recipientEmail: string }): Promise<void>;
  getEmailLogs(limit?: number): Promise<Array<EmailLog & { userFirstName: string | null; userLastName: string | null; username: string | null }>>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateUserRole(id: string, role: "artist" | "buyer" | "both" | "admin"): Promise<User> {
    const [user] = await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return user;
  }

  async completeOnboarding(id: string, role: "artist" | "buyer" | "both", firstName?: string, lastName?: string): Promise<User> {
    const updateData: any = { role, hasCompletedOnboarding: new Date(), updatedAt: new Date() };
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    const [user] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return user;
  }

  async updateUserName(id: string, firstName: string, lastName: string): Promise<User> {
    const [user] = await db.update(users).set({ firstName, lastName, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return user;
  }

  async updateUserProfileImage(id: string, profileImageUrl: string): Promise<User> {
    const [user] = await db.update(users).set({ profileImageUrl, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return user;
  }

  async updateUserBio(id: string, bio: string): Promise<User> {
    const [user] = await db.update(users).set({ bio, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return user;
  }

  async setUserStripeAccount(id: string, stripeAccountId: string): Promise<User> {
    const [user] = await db.update(users)
      .set({ stripeAccountId, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserStripeStatus(id: string, opts: { onboardingComplete?: boolean; payoutsEnabled?: boolean }): Promise<User> {
    const updates: any = { updatedAt: new Date() };
    if (opts.onboardingComplete !== undefined) updates.stripeOnboardingComplete = opts.onboardingComplete;
    if (opts.payoutsEnabled !== undefined) updates.stripePayoutsEnabled = opts.payoutsEnabled;
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async getUserByStripeAccount(stripeAccountId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.stripeAccountId, stripeAccountId));
    return user;
  }

  async getArtworks(status?: "pending" | "approved" | "rejected", artistId?: string): Promise<Artwork[]> {
    let query = db.select().from(artworks);
    if (status) query.where(eq(artworks.status, status));
    if (artistId) query.where(eq(artworks.artistId, artistId));
    return await query.orderBy(desc(artworks.createdAt));
  }

  async getArtwork(id: number): Promise<Artwork | undefined> {
    const [artwork] = await db.select().from(artworks).where(eq(artworks.id, id));
    return artwork;
  }

  async createArtwork(artwork: InsertArtwork): Promise<Artwork> {
    const [newArtwork] = await db.insert(artworks).values(artwork).returning();
    return newArtwork;
  }

  async deleteArtwork(id: number): Promise<void> {
    await db.delete(bids).where(eq(bids.artworkId, id));
    await db.delete(artworks).where(eq(artworks.id, id));
  }

  async updateArtworkStatus(id: number, status: "pending" | "approved" | "rejected", feedback?: string, score?: number): Promise<Artwork> {
    const updates: any = { status };
    if (feedback) updates.aiFeedback = feedback;
    if (score) updates.aiScore = score;
    if (status === "approved") {
      const artwork = await this.getArtwork(id);
      // Use the artwork's stored auction duration verbatim. Submission flow
      // restricts NEW listings to 1/3/5/7 days (Stripe auth holds expire at 7d),
      // but legacy 14/30-day artworks must keep their original duration.
      const durationDays = artwork?.auctionDurationDays || 7;
      const endTime = new Date();
      endTime.setDate(endTime.getDate() + durationDays);
      updates.endTime = endTime;
    }
    const [updated] = await db.update(artworks).set(updates).where(eq(artworks.id, id)).returning();
    return updated;
  }

  async setArtworkCheckoutSession(id: number, stripeSessionId: string, expectedPaidBy: string): Promise<Artwork> {
    const existing = await this.getArtwork(id);
    const updates: { stripeSessionId: string; paidBy?: string } = { stripeSessionId };
    if (!existing?.paidBy) updates.paidBy = expectedPaidBy;
    const [updated] = await db.update(artworks).set(updates).where(eq(artworks.id, id)).returning();
    return updated;
  }

  async markArtworkPaid(id: number, paidBy?: string): Promise<Artwork | null> {
    const updates: any = { paidAt: new Date() };
    if (paidBy) updates.paidBy = paidBy;
    const [updated] = await db.update(artworks)
      .set(updates)
      .where(sql`${artworks.id} = ${id} AND ${artworks.paidAt} IS NULL`)
      .returning();
    if (!updated) return await this.getArtwork(id) || null;
    return updated;
  }

  async getArtworkBySessionId(sessionId: string): Promise<Artwork | undefined> {
    const [artwork] = await db.select().from(artworks).where(eq(artworks.stripeSessionId, sessionId));
    return artwork;
  }

  async getEndedAuctionsAwaitingCapture(): Promise<Artwork[]> {
    return await db.select().from(artworks).where(
      and(
        eq(artworks.status, "approved"),
        isNull(artworks.paidAt),
        lte(artworks.endTime, new Date()),
      ),
    );
  }

  async getBidsForArtwork(artworkId: number): Promise<Bid[]> {
    return await db.select().from(bids).where(eq(bids.artworkId, artworkId)).orderBy(desc(bids.amount));
  }

  async getBidsForUser(userId: string) {
    const userBids = await db.select().from(bids)
      .where(eq(bids.bidderId, userId))
      .orderBy(desc(bids.createdAt));

    type BidMeta = {
      amount: number;
      at: Date | null;
      status: HoldStatus;
      taxAmount: number | null;
      taxRate: number | null;
      taxJurisdiction: string | null;
      capturedAt: Date | null;
    };
    type Entry = {
      bestValid: BidMeta | null;
      latest: BidMeta;
    };
    const map = new Map<number, Entry>();
    for (const bid of userBids) {
      const amount = Number(bid.amount);
      const status = bid.holdStatus as HoldStatus;
      const isValid = status === "authorized" || status === "captured";
      const meta: BidMeta = {
        amount,
        at: bid.createdAt,
        status,
        taxAmount: bid.taxAmount != null ? Number(bid.taxAmount) : null,
        taxRate: bid.taxRate != null ? Number(bid.taxRate) : null,
        taxJurisdiction: bid.taxJurisdiction ?? null,
        capturedAt: bid.capturedAt ?? null,
      };
      const existing = map.get(bid.artworkId);
      if (!existing) {
        map.set(bid.artworkId, {
          bestValid: isValid ? meta : null,
          latest: meta,
        });
        continue;
      }
      if (isValid && (!existing.bestValid || amount > existing.bestValid.amount)) {
        existing.bestValid = meta;
      }
      if (amount > existing.latest.amount) {
        existing.latest = meta;
      }
    }

    return Promise.all(
      Array.from(map.entries()).map(async ([artworkId, info]) => {
        const artwork = await this.getArtwork(artworkId);
        const authorized = await this.getAuthorizedBidsForArtwork(artworkId);
        const artworkHighestBid = authorized.length > 0
          ? Math.max(...authorized.map(b => Number(b.amount)))
          : 0;
        const isHighest = !!info.bestValid && info.bestValid.amount >= artworkHighestBid;
        let auctionEnded = false;
        if (artwork?.endTime) {
          auctionEnded = new Date(artwork.endTime) <= new Date();
        } else {
          const end = new Date(artwork?.createdAt || new Date());
          end.setDate(end.getDate() + (artwork?.auctionDurationDays || 7));
          auctionEnded = end <= new Date();
        }
        // Prefer the user's currently-valid bid for the headline amount and
        // status badge so we never tell them they're winning with a failed
        // higher attempt. Fall back to their latest attempt only when no
        // valid bid exists, so Released/Failed outcomes still surface.
        const headline = info.bestValid ?? info.latest;
        return {
          artworkId,
          artwork: artwork || null,
          userHighestBid: headline.amount,
          artworkHighestBid: artworkHighestBid || headline.amount,
          isHighest,
          auctionEnded,
          latestBidAt: headline.at,
          isPaid: !!artwork?.paidAt,
          holdStatus: headline.status,
          taxAmount: headline.taxAmount,
          taxRate: headline.taxRate,
          taxJurisdiction: headline.taxJurisdiction,
          capturedAt: headline.capturedAt,
        };
      })
    );
  }

  async createBid(bid: BidInsertWithStripe): Promise<Bid> {
    const [newBid] = await db.insert(bids).values(bid).returning();
    return newBid;
  }

  async updateBidByCheckoutSession(sessionId: string, updates: { holdStatus?: HoldStatus; stripePaymentIntentId?: string }): Promise<Bid | undefined> {
    const [updated] = await db.update(bids)
      .set(updates)
      .where(eq(bids.stripeCheckoutSessionId, sessionId))
      .returning();
    return updated;
  }

  async updateBidByPaymentIntent(paymentIntentId: string, updates: { holdStatus?: HoldStatus }): Promise<Bid | undefined> {
    const [updated] = await db.update(bids)
      .set(updates)
      .where(eq(bids.stripePaymentIntentId, paymentIntentId))
      .returning();
    return updated;
  }

  async getBidByCheckoutSession(sessionId: string): Promise<Bid | undefined> {
    const [bid] = await db.select().from(bids).where(eq(bids.stripeCheckoutSessionId, sessionId));
    return bid;
  }

  async getBidByPaymentIntent(paymentIntentId: string): Promise<Bid | undefined> {
    const [bid] = await db.select().from(bids).where(eq(bids.stripePaymentIntentId, paymentIntentId));
    return bid;
  }

  async getAuthorizedBidsForArtwork(artworkId: number): Promise<Bid[]> {
    return await db.select().from(bids)
      .where(and(eq(bids.artworkId, artworkId), eq(bids.holdStatus, "authorized")))
      .orderBy(desc(bids.amount));
  }

  // "Active" = authorized OR captured. Used by the public bids list so the
  // current price (and the winning amount AFTER settlement) stays visible.
  async getActiveBidsForArtwork(artworkId: number): Promise<Bid[]> {
    return await db.select().from(bids)
      .where(and(
        eq(bids.artworkId, artworkId),
        inArray(bids.holdStatus, ["authorized", "captured"]),
      ))
      .orderBy(desc(bids.amount));
  }

  async getHighestAuthorizedBid(artworkId: number): Promise<Bid | undefined> {
    const list = await this.getAuthorizedBidsForArtwork(artworkId);
    return list[0];
  }

  async getOtherAuthorizedBids(artworkId: number, exceptBidId: number): Promise<Bid[]> {
    return await db.select().from(bids)
      .where(and(
        eq(bids.artworkId, artworkId),
        eq(bids.holdStatus, "authorized"),
        ne(bids.id, exceptBidId),
      ));
  }

  // Lingering authorized holds on artworks that already have paidAt set.
  // The scheduler sweeps these every tick so a transient cancel failure on
  // settlement day doesn't leave a buyer's card held forever.
  async getAuthorizedBidsOnPaidArtworks(): Promise<Bid[]> {
    const rows = await db.select()
      .from(bids)
      .innerJoin(artworks, eq(bids.artworkId, artworks.id))
      .where(and(eq(bids.holdStatus, "authorized"), sql`${artworks.paidAt} IS NOT NULL`));
    return rows.map(r => r.bids);
  }

  async updateBidTaxInfo(paymentIntentId: string, info: BidTaxUpdate): Promise<Bid | undefined> {
    if (Object.keys(info).length === 0) return await this.getBidByPaymentIntent(paymentIntentId);
    const [updated] = await db.update(bids)
      .set(info)
      .where(eq(bids.stripePaymentIntentId, paymentIntentId))
      .returning();
    return updated;
  }

  async markBidCaptured(paymentIntentId: string, taxInfo?: BidTaxUpdate): Promise<Bid | undefined> {
    const updates: any = { holdStatus: "captured", capturedAt: new Date() };
    if (taxInfo) Object.assign(updates, taxInfo);
    const [updated] = await db.update(bids)
      .set(updates)
      .where(eq(bids.stripePaymentIntentId, paymentIntentId))
      .returning();
    return updated;
  }

  async getTaxReportSummary(opts?: { from?: Date; to?: Date }): Promise<TaxReportRow[]> {
    const conditions: any[] = [eq(bids.holdStatus, "captured"), sql`${bids.taxAmount} IS NOT NULL`];
    if (opts?.from) conditions.push(sql`${bids.capturedAt} >= ${opts.from}`);
    if (opts?.to) conditions.push(sql`${bids.capturedAt} <= ${opts.to}`);
    const rows = await db.select({
      month: sql<string>`to_char(date_trunc('month', ${bids.capturedAt}), 'YYYY-MM')`,
      state: sql<string>`coalesce(${bids.shippingState}, '')`,
      taxableAmount: sql<string>`sum(${bids.taxableAmount})`,
      taxAmount: sql<string>`sum(${bids.taxAmount})`,
      saleCount: sql<number>`count(*)::int`,
    })
      .from(bids)
      .where(and(...conditions))
      .groupBy(sql`date_trunc('month', ${bids.capturedAt})`, bids.shippingState)
      .orderBy(sql`date_trunc('month', ${bids.capturedAt}) desc`, bids.shippingState);
    return rows.map(r => ({
      month: r.month || "",
      state: r.state || "",
      taxableAmount: Number(r.taxableAmount || 0),
      taxAmount: Number(r.taxAmount || 0),
      saleCount: Number(r.saleCount || 0),
    }));
  }

  async getTaxReportSales(opts?: { from?: Date; to?: Date }): Promise<TaxReportSaleRow[]> {
    const conditions: any[] = [eq(bids.holdStatus, "captured"), sql`${bids.taxAmount} IS NOT NULL`];
    if (opts?.from) conditions.push(sql`${bids.capturedAt} >= ${opts.from}`);
    if (opts?.to) conditions.push(sql`${bids.capturedAt} <= ${opts.to}`);
    const rows = await db.select({
      bidId: bids.id,
      artworkId: bids.artworkId,
      artworkTitle: artworks.title,
      bidderId: bids.bidderId,
      capturedAt: bids.capturedAt,
      amount: bids.amount,
      taxableAmount: bids.taxableAmount,
      taxAmount: bids.taxAmount,
      taxRate: bids.taxRate,
      shippingState: bids.shippingState,
      shippingPostalCode: bids.shippingPostalCode,
      shippingCity: bids.shippingCity,
      taxJurisdiction: bids.taxJurisdiction,
      stripePaymentIntentId: bids.stripePaymentIntentId,
      stripeTaxTransactionId: bids.stripeTaxTransactionId,
    })
      .from(bids)
      .innerJoin(artworks, eq(bids.artworkId, artworks.id))
      .where(and(...conditions))
      .orderBy(desc(bids.capturedAt));
    return rows.map(r => ({
      bidId: r.bidId,
      artworkId: r.artworkId,
      artworkTitle: r.artworkTitle,
      bidderId: r.bidderId,
      capturedAt: r.capturedAt,
      amount: Number(r.amount || 0),
      taxableAmount: Number(r.taxableAmount || 0),
      taxAmount: Number(r.taxAmount || 0),
      taxRate: Number(r.taxRate || 0),
      shippingState: r.shippingState || "",
      shippingPostalCode: r.shippingPostalCode || "",
      shippingCity: r.shippingCity || "",
      taxJurisdiction: r.taxJurisdiction || "",
      stripePaymentIntentId: r.stripePaymentIntentId,
      stripeTaxTransactionId: r.stripeTaxTransactionId,
    }));
  }

  async getCharities(): Promise<Charity[]> {
    return await db.select().from(charities);
  }

  async updateArtworkPromotion(id: number, promotionPercentage: number): Promise<Artwork> {
    const [updated] = await db.update(artworks).set({ promotionPercentage }).where(eq(artworks.id, id)).returning();
    return updated;
  }

  async incrementArtworkViews(id: number): Promise<void> {
    await db.update(artworks).set({ views: sql`${artworks.views} + 1` }).where(eq(artworks.id, id));
  }

  async extendAuctionEndTime(id: number, newEndTime: Date): Promise<Artwork> {
    const [updated] = await db.update(artworks).set({ endTime: newEndTime }).where(eq(artworks.id, id)).returning();
    return updated;
  }

  async getApprovedArtworksSortedByPromotion(): Promise<Artwork[]> {
    return await db.select().from(artworks)
      .where(eq(artworks.status, "approved"))
      .orderBy(desc(artworks.promotionPercentage), desc(artworks.createdAt));
  }

  async getPortfolioItems(artistId: string): Promise<PortfolioItem[]> {
    return await db.select().from(portfolioItems)
      .where(eq(portfolioItems.artistId, artistId))
      .orderBy(desc(portfolioItems.createdAt));
  }

  async getPortfolioItem(id: number): Promise<PortfolioItem | undefined> {
    const [item] = await db.select().from(portfolioItems).where(eq(portfolioItems.id, id));
    return item;
  }

  async createPortfolioItem(item: InsertPortfolioItem): Promise<PortfolioItem> {
    const [newItem] = await db.insert(portfolioItems).values(item).returning();
    return newItem;
  }

  async listPortfolioItemForSale(id: number, price: number): Promise<PortfolioItem> {
    const [updated] = await db.update(portfolioItems)
      .set({ listedForSale: true, listedAt: new Date(), price: price.toString() })
      .where(eq(portfolioItems.id, id))
      .returning();
    return updated;
  }

  async deletePortfolioItem(id: number): Promise<void> {
    await db.delete(portfolioItems).where(eq(portfolioItems.id, id));
  }

  async insertEmailLog(log: { userId: string; emailType: string; recipientEmail: string }): Promise<void> {
    await db.insert(emailLog).values(log);
  }

  async getEmailLogs(limit = 200): Promise<Array<EmailLog & { userFirstName: string | null; userLastName: string | null; username: string | null }>> {
    const rows = await db
      .select({
        id: emailLog.id,
        userId: emailLog.userId,
        emailType: emailLog.emailType,
        recipientEmail: emailLog.recipientEmail,
        sentAt: emailLog.sentAt,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        username: users.username,
      })
      .from(emailLog)
      .leftJoin(users, eq(emailLog.userId, users.id))
      .orderBy(desc(emailLog.sentAt))
      .limit(limit);
    return rows;
  }
}

export const storage = new DatabaseStorage();
