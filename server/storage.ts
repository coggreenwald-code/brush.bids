import { db } from "./db";
import {
  users, artworks, bids, charities,
  type User,
  type Artwork, type InsertArtwork,
  type Bid, type InsertBid,
  type Charity, type InsertCharity
} from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Users (Basic ops, Auth handles most)
  getUser(id: string): Promise<User | undefined>;
  updateUserRole(id: string, role: "artist" | "buyer" | "admin"): Promise<User>;

  // Artworks
  getArtworks(status?: "pending" | "approved" | "rejected", artistId?: string): Promise<Artwork[]>;
  getArtwork(id: number): Promise<Artwork | undefined>;
  createArtwork(artwork: InsertArtwork): Promise<Artwork>;
  updateArtworkStatus(id: number, status: "pending" | "approved" | "rejected", feedback?: string, score?: number): Promise<Artwork>;
  setArtworkCheckoutSession(id: number, stripeSessionId: string, expectedPaidBy: string): Promise<Artwork>;
  markArtworkPaid(id: number): Promise<Artwork | null>;
  getArtworkBySessionId(sessionId: string): Promise<Artwork | undefined>;
  updateArtworkPromotion(id: number, promotionPercentage: number): Promise<Artwork>;
  getApprovedArtworksSortedByPromotion(): Promise<Artwork[]>;

  // Bids
  getBidsForArtwork(artworkId: number): Promise<Bid[]>;
  getBidsForUser(userId: string): Promise<{ 
    artworkId: number;
    artwork: Artwork | null;
    userHighestBid: number;
    artworkHighestBid: number;
    isHighest: boolean;
    auctionEnded: boolean;
    latestBidAt: Date | null;
    isPaid: boolean;
  }[]>;
  createBid(bid: InsertBid): Promise<Bid>;

  // Charities
  getCharities(): Promise<Charity[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateUserRole(id: string, role: "artist" | "buyer" | "admin"): Promise<User> {
    const [user] = await db.update(users)
      .set({ role })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getArtworks(status?: "pending" | "approved" | "rejected", artistId?: string): Promise<Artwork[]> {
    let query = db.select().from(artworks);
    if (status) {
      query.where(eq(artworks.status, status));
    }
    if (artistId) {
      query.where(eq(artworks.artistId, artistId));
    }
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

  async updateArtworkStatus(id: number, status: "pending" | "approved" | "rejected", feedback?: string, score?: number): Promise<Artwork> {
    const updates: any = { status };
    if (feedback) updates.aiFeedback = feedback;
    if (score) updates.aiScore = score;
    
    const [updated] = await db.update(artworks)
      .set(updates)
      .where(eq(artworks.id, id))
      .returning();
    return updated;
  }

  async setArtworkCheckoutSession(id: number, stripeSessionId: string, expectedPaidBy: string): Promise<Artwork> {
    // Only set paidBy if not already set (don't overwrite on re-checkout)
    const existing = await this.getArtwork(id);
    const updates: { stripeSessionId: string; paidBy?: string } = { stripeSessionId };
    
    if (!existing?.paidBy) {
      updates.paidBy = expectedPaidBy;
    }
    
    const [updated] = await db.update(artworks)
      .set(updates)
      .where(eq(artworks.id, id))
      .returning();
    return updated;
  }

  async markArtworkPaid(id: number): Promise<Artwork | null> {
    // Idempotent at DB level: only update where paidAt IS NULL
    const [updated] = await db.update(artworks)
      .set({ paidAt: new Date() })
      .where(sql`${artworks.id} = ${id} AND ${artworks.paidAt} IS NULL`)
      .returning();
    
    // Return the artwork even if already paid (for idempotency)
    if (!updated) {
      return await this.getArtwork(id) || null;
    }
    return updated;
  }

  async getArtworkBySessionId(sessionId: string): Promise<Artwork | undefined> {
    const [artwork] = await db.select().from(artworks)
      .where(eq(artworks.stripeSessionId, sessionId));
    return artwork;
  }

  async getBidsForArtwork(artworkId: number): Promise<Bid[]> {
    return await db.select().from(bids)
      .where(eq(bids.artworkId, artworkId))
      .orderBy(desc(bids.amount));
  }

  async getBidsForUser(userId: string): Promise<{ 
    artworkId: number;
    artwork: Artwork | null;
    userHighestBid: number;
    artworkHighestBid: number;
    isHighest: boolean;
    auctionEnded: boolean;
    latestBidAt: Date | null;
    isPaid: boolean;
  }[]> {
    const userBids = await db.select().from(bids)
      .where(eq(bids.bidderId, userId))
      .orderBy(desc(bids.createdAt));
    
    const artworkBidsMap = new Map<number, { userHighestBid: number; latestBidAt: Date | null }>();
    
    for (const bid of userBids) {
      const existing = artworkBidsMap.get(bid.artworkId);
      const bidAmount = Number(bid.amount);
      if (!existing || bidAmount > existing.userHighestBid) {
        artworkBidsMap.set(bid.artworkId, { 
          userHighestBid: bidAmount,
          latestBidAt: bid.createdAt
        });
      }
    }
    
    const results = await Promise.all(
      Array.from(artworkBidsMap.entries()).map(async ([artworkId, { userHighestBid, latestBidAt }]) => {
        const artwork = await this.getArtwork(artworkId);
        const artworkBids = await this.getBidsForArtwork(artworkId);
        const artworkHighestBid = artworkBids.length > 0 ? Math.max(...artworkBids.map(b => Number(b.amount))) : userHighestBid;
        const isHighest = userHighestBid >= artworkHighestBid;
        
        const auctionEndDate = new Date(artwork?.createdAt || new Date());
        auctionEndDate.setDate(auctionEndDate.getDate() + 7);
        const auctionEnded = auctionEndDate <= new Date();
        const isPaid = !!artwork?.paidAt;
        
        return {
          artworkId,
          artwork: artwork || null,
          userHighestBid,
          artworkHighestBid,
          isHighest,
          auctionEnded,
          latestBidAt,
          isPaid
        };
      })
    );
    
    return results;
  }

  async createBid(bid: InsertBid): Promise<Bid> {
    const [newBid] = await db.insert(bids).values(bid).returning();
    return newBid;
  }

  async getCharities(): Promise<Charity[]> {
    return await db.select().from(charities);
  }

  async updateArtworkPromotion(id: number, promotionPercentage: number): Promise<Artwork> {
    const [updated] = await db.update(artworks)
      .set({ promotionPercentage })
      .where(eq(artworks.id, id))
      .returning();
    return updated;
  }

  async getApprovedArtworksSortedByPromotion(): Promise<Artwork[]> {
    return await db.select().from(artworks)
      .where(eq(artworks.status, "approved"))
      .orderBy(desc(artworks.promotionPercentage), desc(artworks.createdAt));
  }
}

export const storage = new DatabaseStorage();
