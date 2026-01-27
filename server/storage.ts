import { db } from "./db";
import {
  users, artworks, bids, charities,
  type User, type InsertUser,
  type Artwork, type InsertArtwork,
  type Bid, type InsertBid,
  type Charity, type InsertCharity
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Users (Basic ops, Auth handles most)
  getUser(id: string): Promise<User | undefined>;
  updateUserRole(id: string, role: "artist" | "buyer" | "admin"): Promise<User>;

  // Artworks
  getArtworks(status?: "pending" | "approved" | "rejected", artistId?: string): Promise<Artwork[]>;
  getArtwork(id: number): Promise<Artwork | undefined>;
  createArtwork(artwork: InsertArtwork): Promise<Artwork>;
  updateArtworkStatus(id: number, status: "approved" | "rejected", feedback?: string, score?: number): Promise<Artwork>;

  // Bids
  getBidsForArtwork(artworkId: number): Promise<Bid[]>;
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

  async updateArtworkStatus(id: number, status: "approved" | "rejected", feedback?: string, score?: number): Promise<Artwork> {
    const updates: any = { status };
    if (feedback) updates.aiFeedback = feedback;
    if (score) updates.aiScore = score;
    
    const [updated] = await db.update(artworks)
      .set(updates)
      .where(eq(artworks.id, id))
      .returning();
    return updated;
  }

  async getBidsForArtwork(artworkId: number): Promise<Bid[]> {
    return await db.select().from(bids)
      .where(eq(bids.artworkId, artworkId))
      .orderBy(desc(bids.amount));
  }

  async createBid(bid: InsertBid): Promise<Bid> {
    const [newBid] = await db.insert(bids).values(bid).returning();
    return newBid;
  }

  async getCharities(): Promise<Charity[]> {
    return await db.select().from(charities);
  }
}

export const storage = new DatabaseStorage();
