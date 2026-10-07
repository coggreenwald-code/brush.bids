import { db } from "./db";
import { orders, offers, artworks, type Order, type InsertOrder, type Offer } from "@shared/schema";
import { and, desc, eq, inArray, isNull, lte, sql } from "drizzle-orm";

export const orderStorage = {
  async createOrder(values: InsertOrder): Promise<Order> {
    const [row] = await db.insert(orders).values(values).returning();
    return row;
  },

  async getOrder(id: number): Promise<Order | undefined> {
    const [row] = await db.select().from(orders).where(eq(orders.id, id));
    return row;
  },

  async getOrderByToken(token: string): Promise<Order | undefined> {
    const [row] = await db.select().from(orders).where(eq(orders.statusToken, token));
    return row;
  },

  async getOrderBySession(sessionId: string): Promise<Order | undefined> {
    const [row] = await db.select().from(orders).where(eq(orders.stripeCheckoutSessionId, sessionId));
    return row;
  },

  async updateOrder(id: number, values: Partial<InsertOrder>): Promise<Order> {
    const [row] = await db.update(orders).set({ ...values, updatedAt: new Date() }).where(eq(orders.id, id)).returning();
    return row;
  },

  // Move an order between statuses only if it is still in an expected one, so
  // concurrent webhook deliveries and scheduler runs can't double-apply.
  async transitionOrder(id: number, from: Order["status"][], values: Partial<InsertOrder>): Promise<Order | undefined> {
    const [row] = await db.update(orders)
      .set({ ...values, updatedAt: new Date() })
      .where(and(eq(orders.id, id), inArray(orders.status, from)))
      .returning();
    return row;
  },

  async ordersForBuyer(buyerId: string): Promise<Order[]> {
    return db.select().from(orders)
      .where(and(eq(orders.buyerId, buyerId), sql`${orders.status} <> 'pending_payment'`))
      .orderBy(desc(orders.createdAt));
  },

  async ordersForArtist(artistId: string): Promise<Order[]> {
    return db.select().from(orders)
      .where(and(eq(orders.artistId, artistId), sql`${orders.status} not in ('pending_payment', 'cancelled')`))
      .orderBy(desc(orders.createdAt));
  },

  async allOrders(): Promise<Order[]> {
    return db.select().from(orders).where(sql`${orders.status} <> 'pending_payment'`).orderBy(desc(orders.createdAt));
  },

  async ordersByStatus(status: Order["status"]): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.status, status));
  },

  async ordersReadyForPayout(now: Date): Promise<Order[]> {
    return db.select().from(orders).where(and(
      eq(orders.status, "delivered"),
      lte(orders.payoutReleaseAt, now),
      isNull(orders.payoutReleasedAt),
    ));
  },

  async stalePendingOrders(before: Date): Promise<Order[]> {
    return db.select().from(orders).where(and(eq(orders.status, "pending_payment"), lte(orders.createdAt, before)));
  },

  // Offers
  async createOffer(values: typeof offers.$inferInsert): Promise<Offer> {
    const [row] = await db.insert(offers).values(values).returning();
    return row;
  },

  async getOffer(id: number): Promise<Offer | undefined> {
    const [row] = await db.select().from(offers).where(eq(offers.id, id));
    return row;
  },

  async transitionOffer(id: number, from: Offer["status"][], values: Partial<typeof offers.$inferInsert>): Promise<Offer | undefined> {
    const [row] = await db.update(offers).set(values)
      .where(and(eq(offers.id, id), inArray(offers.status, from)))
      .returning();
    return row;
  },

  async openOfferFromBuyer(artworkId: number, buyerId: string): Promise<Offer | undefined> {
    const [row] = await db.select().from(offers).where(and(
      eq(offers.artworkId, artworkId), eq(offers.buyerId, buyerId), inArray(offers.status, ["pending", "accepted"]),
    ));
    return row;
  },

  async offersForBuyer(buyerId: string): Promise<Offer[]> {
    return db.select().from(offers).where(eq(offers.buyerId, buyerId)).orderBy(desc(offers.createdAt));
  },

  async offersForArtist(artistId: string): Promise<Offer[]> {
    return db.select().from(offers).where(eq(offers.artistId, artistId)).orderBy(desc(offers.createdAt));
  },

  async expireOffers(now: Date): Promise<Offer[]> {
    return db.update(offers).set({ status: "expired" })
      .where(and(inArray(offers.status, ["pending", "accepted"]), lte(offers.expiresAt, now)))
      .returning();
  },

  // Once a piece sells, every other open offer on it is closed.
  async closeOtherOffers(artworkId: number, exceptOfferId: number | null): Promise<void> {
    const rows = await db.select().from(offers).where(and(eq(offers.artworkId, artworkId), inArray(offers.status, ["pending", "accepted"])));
    for (const o of rows) {
      if (o.id === exceptOfferId) continue;
      await db.update(offers).set({ status: "declined", respondedAt: new Date() }).where(eq(offers.id, o.id));
    }
  },

  async isArtworkSold(artworkId: number): Promise<boolean> {
    const [row] = await db.select({ paidAt: artworks.paidAt }).from(artworks).where(eq(artworks.id, artworkId));
    return !!row?.paidAt;
  },
};
