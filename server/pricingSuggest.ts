// Suggested prices for artists, based on what similar-sized work on BrushBids
// has sold for (falling back to current listings while there are few sales).
import type { Express } from "express";
import { z } from "zod";
import { db } from "./db";
import { artworks } from "@shared/schema";
import { eq, isNotNull } from "drizzle-orm";
import { askingPrice, parseDimensions } from "@shared/pricing";

const MIN_SAMPLES = 3;

function area(dimensions: string | null): number | null {
  const [a, b] = parseDimensions(dimensions);
  return a && b ? a * b : null;
}

function percentile(sorted: number[], p: number): number {
  const i = (sorted.length - 1) * p;
  const lo = Math.floor(i), hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

const roundTo5 = (n: number) => Math.max(5, Math.round(n / 5) * 5);

export async function suggestPrice(width: number, height: number) {
  const targetArea = width * height;
  const sold = await db.select().from(artworks).where(isNotNull(artworks.paidAt));
  let basis: "sold" | "listed" = "sold";
  let pool = sold;
  if (pool.length < MIN_SAMPLES) {
    basis = "listed";
    const listed = await db.select().from(artworks).where(eq(artworks.status, "approved"));
    pool = [...new Map([...sold, ...listed].map((a) => [a.id, a])).values()];
  }
  // Price per square inch, so a small sketch and a large canvas compare fairly.
  const rates = pool
    .map((a) => ({ price: askingPrice(a), area: area(a.dimensions) }))
    .filter((r) => r.area && r.area > 0 && r.price > 0)
    .map((r) => r.price / r.area!)
    .sort((a, b) => a - b);
  if (rates.length === 0) return null;
  // Price grows slower than area for larger pieces; square-root scaling keeps
  // suggestions for big canvases from running away.
  const median = percentile(rates, 0.5);
  const sizeFactor = (rate: number) => {
    const typicalArea = 400; // ~20x20 in
    return rate * typicalArea * Math.sqrt(targetArea / typicalArea);
  };
  return {
    suggested: roundTo5(sizeFactor(median)),
    low: roundTo5(sizeFactor(percentile(rates, 0.25))),
    high: roundTo5(sizeFactor(percentile(rates, 0.75))),
    basedOn: rates.length,
    basis,
  };
}

export function registerPricingRoutes(app: Express) {
  app.get("/api/pricing/suggest", async (req, res) => {
    const parsed = z.object({ width: z.coerce.number().positive().max(500), height: z.coerce.number().positive().max(500) }).safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ message: "Enter the artwork's width and height." });
    res.json(await suggestPrice(parsed.data.width, parsed.data.height));
  });

  // Artists set or change the price of their own unsold listing.
  app.patch("/api/artworks/:id/price", async (req, res) => {
    const userId = (req.user as any)?.claims?.sub || (req.user as any)?.id;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const parsed = z.object({ price: z.coerce.number().min(1, "Price must be at least $1").max(100000) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });
    const [artwork] = await db.select().from(artworks).where(eq(artworks.id, Number(req.params.id)));
    if (!artwork || artwork.artistId !== userId) return res.status(404).json({ message: "Artwork not found" });
    if (artwork.paidAt) return res.status(409).json({ message: "This piece has already sold." });
    // One price going forward: clear the old auction Buy It Now price.
    const [updated] = await db.update(artworks)
      .set({ price: parsed.data.price.toFixed(2), buyNowPrice: null })
      .where(eq(artworks.id, artwork.id)).returning();
    res.json(updated);
  });
}
