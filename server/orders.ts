// Fixed-price checkout, offers, fulfillment and delayed artist payouts.
//
// Money flow: the buyer pays BrushBids (one Stripe charge for artwork +
// insured shipping + tax). Nothing goes to the artist until the piece is
// delivered and the inspection window passes; then the artist's share moves by
// Stripe Connect transfer (separate charges and transfers) or into the manual
// PayPal/Venmo/Zelle payout queue.
import type { Express, Request } from "express";
import crypto from "crypto";
import { z } from "zod";
import type Stripe from "stripe";
import { storage } from "./storage";
import { orderStorage } from "./orderStorage";
import { getUncachableStripeClient, getAppOrigin } from "./stripeClient";
import { persistTaxFromCheckoutSession } from "./taxPersistence";
import { quoteShipping, buyLabel, createTracker, getTrackerStatus, easypostConfigured, WhiteGloveUnavailableError, type ShipAddress } from "./shipping";
import {
  emailOfferReceived, emailOfferAccepted, emailOfferDeclined, emailOrderConfirmed, emailArtistSold,
  emailOrderShipped, emailOrderIssue, emailArtistPaid,
} from "./orderEmails";
import { askingPrice, minOfferAmount, artistShareCents, needsWhiteGlove } from "@shared/pricing";
import { ageInYears, hasStripeConnectReady, isMinor, resolvePayoutTarget } from "@shared/payoutHelpers";
import { CONTACT_EMAIL, INSPECTION_DAYS, MIN_BUYER_AGE, OFFER_WINDOW_HOURS, WHITE_GLOVE_SHIPPING_TIERS } from "@shared/siteConfig";
import type { Order, Offer, Artwork, User } from "@shared/schema";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function currentUserId(req: Request): string | null {
  const u = req.user as any;
  return u ? (u.claims?.sub || u.id || null) : null;
}

async function isAdmin(req: Request): Promise<boolean> {
  const id = currentUserId(req);
  if (!id) return false;
  const user = await storage.getUser(id);
  return user?.role === "admin";
}

async function buyerAgeError(userId: string, confirmedAdult: unknown): Promise<string | null> {
  if (confirmedAdult !== true) return `Please confirm you are ${MIN_BUYER_AGE} or older to buy or make an offer.`;
  const buyer = await storage.getUser(userId);
  const age = ageInYears(buyer?.dateOfBirth as any);
  if (age !== null && age < MIN_BUYER_AGE) return `You must be ${MIN_BUYER_AGE} or older to buy on BrushBids.`;
  return null;
}

function isAvailable(artwork: Artwork | undefined): artwork is Artwork {
  return !!artwork && artwork.status === "approved" && !artwork.paidAt;
}

// Name shown to buyers: artists under 18 appear as first name + last initial,
// matching the public artist profile.
function publicArtistName(artist: User | undefined): string {
  if (!artist) return "a BrushBids artist";
  const last = artist.lastName && isMinor(artist) ? `${artist.lastName.charAt(0)}.` : artist.lastName;
  return [artist.firstName, last].filter(Boolean).join(" ") || "a BrushBids artist";
}

const cents = (dollars: number | string) => Math.round(Number(dollars) * 100);
const dollars = (c: number) => (c / 100).toFixed(2);

function formatShipTo(o: Order): string {
  return [o.shipName, o.shipStreet1, o.shipStreet2, `${o.shipCity}, ${o.shipState} ${o.shipZip}`].filter(Boolean).join("\n");
}

// What the buyer may see on their order page: no artist contact details.
function publicOrderView(o: Order, artwork: Artwork | undefined, artist: User | undefined) {
  return {
    id: o.id,
    status: o.status,
    artwork: artwork ? { id: artwork.id, title: artwork.title, imageUrl: artwork.imageUrl } : null,
    artistName: artist ? publicArtistName(artist) : null,
    itemAmount: o.itemAmount,
    shippingAmount: o.shippingAmount,
    taxAmount: o.taxAmount,
    totalAmount: o.totalAmount,
    shipName: o.shipName,
    shipCity: o.shipCity,
    shipState: o.shipState,
    carrier: o.carrier,
    trackingNumber: o.trackingNumber,
    trackingUrl: o.trackingUrl,
    whiteGlove: o.whiteGlove,
    paidAt: o.paidAt,
    shippedAt: o.shippedAt,
    deliveredAt: o.deliveredAt,
    payoutReleaseAt: o.payoutReleaseAt,
    issueNote: o.issueNote,
    createdAt: o.createdAt,
  };
}

const shipToSchema = z.object({
  name: z.string().trim().min(2, "Enter the recipient's name").max(100),
  street1: z.string().trim().min(3, "Enter a street address").max(120),
  street2: z.string().trim().max(120).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Enter a city").max(80),
  state: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, "Use a 2-letter state code, e.g. NY"),
  zip: z.string().trim().regex(/^\d{5}(-\d{4})?$/, "Enter a valid US ZIP code"),
});

// Price the buyer pays for the artwork itself: an accepted, unexpired offer
// from this buyer, or the asking price.
async function resolveItemPrice(artwork: Artwork, buyerId: string, offerId?: number): Promise<{ amount: number; offer: Offer | null } | { error: string }> {
  if (!offerId) return { amount: askingPrice(artwork), offer: null };
  const offer = await orderStorage.getOffer(offerId);
  if (!offer || offer.buyerId !== buyerId || offer.artworkId !== artwork.id) return { error: "Offer not found" };
  if (offer.status !== "accepted") return { error: "This offer hasn't been accepted" };
  if (offer.expiresAt <= new Date()) return { error: "This accepted offer has expired" };
  return { amount: Number(offer.amount), offer };
}

export function registerOrderRoutes(app: Express) {
  // Shipping estimate shown on the artwork page (by ZIP).
  app.get("/api/shipping/estimate", async (req, res) => {
    const parsed = z.object({ artworkId: z.coerce.number(), zip: z.string().trim().regex(/^\d{5}$/) }).safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ message: "Enter a 5-digit ZIP code." });
    const artwork = await storage.getArtwork(parsed.data.artworkId);
    if (!artwork) return res.status(404).json({ message: "Artwork not found" });
    const artist = await storage.getUser(artwork.artistId);
    if (!artist) return res.status(404).json({ message: "Artist not found" });
    try {
      const quote = await quoteShipping(artwork as any, artist, { zip: parsed.data.zip });
      res.json({ amount: dollars(quote.amountCents), label: quote.label, insured: true, whiteGlove: quote.whiteGlove });
    } catch (err) {
      if (err instanceof WhiteGloveUnavailableError) return res.status(409).json({ message: err.message, contactToBuy: true });
      throw err;
    }
  });

  // Start checkout: quote shipping on the server, create the order, and open
  // a Stripe Checkout Session charging artwork + shipping (+ tax).
  app.post("/api/checkout", async (req, res) => {
    const buyerId = currentUserId(req);
    if (!buyerId) return res.status(401).json({ message: "Please sign in to buy." });
    const parsed = z.object({
      artworkId: z.number(),
      offerId: z.number().optional(),
      confirmedAdult: z.boolean().optional(),
      shipTo: shipToSchema,
    }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });
    const { artworkId, offerId, confirmedAdult, shipTo } = parsed.data;

    const ageError = await buyerAgeError(buyerId, confirmedAdult);
    if (ageError) return res.status(403).json({ message: ageError });

    const artwork = await storage.getArtwork(artworkId);
    if (!isAvailable(artwork)) return res.status(409).json({ message: "This artwork is no longer available." });
    if (artwork.artistId === buyerId) return res.status(400).json({ message: "You can't buy your own artwork." });
    const artist = await storage.getUser(artwork.artistId);
    if (!artist) return res.status(404).json({ message: "Artist not found" });

    const price = await resolveItemPrice(artwork, buyerId, offerId);
    if ("error" in price) return res.status(400).json({ message: price.error });

    let quote;
    try {
      quote = await quoteShipping(artwork as any, artist, shipTo as ShipAddress);
    } catch (err) {
      if (err instanceof WhiteGloveUnavailableError) return res.status(409).json({ message: err.message });
      throw err;
    }
    const buyer = await storage.getUser(buyerId);

    const order = await orderStorage.createOrder({
      artworkId,
      buyerId,
      artistId: artist.id,
      offerId: price.offer?.id ?? null,
      statusToken: crypto.randomBytes(24).toString("hex"),
      itemAmount: price.amount.toFixed(2),
      shippingAmount: dollars(quote.amountCents),
      buyerEmail: buyer?.email ?? null,
      shipName: shipTo.name,
      shipStreet1: shipTo.street1,
      shipStreet2: shipTo.street2 || null,
      shipCity: shipTo.city,
      shipState: shipTo.state,
      shipZip: shipTo.zip,
      shippingMethod: quote.method,
      shippingLabel: quote.label,
      whiteGlove: quote.whiteGlove,
      insuredValue: quote.insuredValue.toFixed(2),
      carrier: quote.carrier,
      easypostShipmentId: quote.easypostShipmentId,
    });

    try {
      const stripe = await getUncachableStripeClient();
      const address = { line1: shipTo.street1, line2: shipTo.street2 || undefined, city: shipTo.city, state: shipTo.state, postal_code: shipTo.zip, country: "US" };
      const customer = await stripe.customers.create({
        email: buyer?.email || undefined,
        name: shipTo.name,
        shipping: { name: shipTo.name, address },
        metadata: { brushbidsUserId: buyerId },
      });
      const origin = getAppOrigin();
      const metadata = { kind: "order", orderId: String(order.id), artworkId: String(artworkId), buyerId };
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer: customer.id,
        customer_update: { shipping: "auto", address: "auto" },
        shipping_address_collection: { allowed_countries: ["US"] },
        billing_address_collection: "auto",
        automatic_tax: { enabled: true },
        line_items: [{
          price_data: {
            currency: "usd",
            unit_amount: cents(price.amount),
            tax_behavior: "exclusive",
            product_data: {
              name: artwork.title,
              description: `Original artwork by ${publicArtistName(artist)}`,
              tax_code: "txcd_99999999",
              ...(artwork.imageUrl && /^https?:\/\//.test(artwork.imageUrl) && artwork.imageUrl.length <= 2048 ? { images: [artwork.imageUrl] } : {}),
            },
          },
          quantity: 1,
        }],
        shipping_options: [{
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: `Insured shipping (${quote.label})`,
            fixed_amount: { amount: quote.amountCents, currency: "usd" },
            tax_behavior: "exclusive",
            tax_code: "txcd_92010001",
          },
        }],
        payment_intent_data: { transfer_group: `order_${order.id}`, metadata },
        metadata,
        expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
        success_url: `${origin}/order/${order.statusToken}?paid=1`,
        cancel_url: `${origin}/artwork/${artworkId}`,
      });
      await orderStorage.updateOrder(order.id, { stripeCheckoutSessionId: session.id });
      res.json({ checkoutUrl: session.url });
    } catch (err: any) {
      console.error("[checkout] failed to create session:", err);
      await orderStorage.updateOrder(order.id, { status: "cancelled", adminNote: `Checkout setup failed: ${err.message}` });
      res.status(502).json({ message: "We couldn't start checkout. Please try again." });
    }
  });

  // Buyer's no-login order page.
  app.get("/api/order-status/:token", async (req, res) => {
    const order = await orderStorage.getOrderByToken(String(req.params.token));
    if (!order || order.status === "pending_payment" && !order.stripeCheckoutSessionId) return res.status(404).json({ message: "Order not found" });
    const [artwork, artist] = await Promise.all([storage.getArtwork(order.artworkId), storage.getUser(order.artistId)]);
    res.json({ ...publicOrderView(order, artwork, artist), inspectionDays: INSPECTION_DAYS });
  });

  app.post("/api/order-status/:token/received", async (req, res) => {
    const order = await orderStorage.getOrderByToken(String(req.params.token));
    if (!order) return res.status(404).json({ message: "Order not found" });
    const updated = await markDelivered(order, new Date());
    if (!updated) return res.status(409).json({ message: "This order can't be marked received right now." });
    res.json({ ok: true });
  });

  app.post("/api/order-status/:token/issue", async (req, res) => {
    const parsed = z.object({ note: z.string().trim().min(5, "Tell us what went wrong.").max(2000) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });
    const order = await orderStorage.getOrderByToken(String(req.params.token));
    if (!order) return res.status(404).json({ message: "Order not found" });
    const updated = await orderStorage.transitionOrder(order.id, ["paid", "shipped", "delivered"], {
      status: "issue", issueNote: parsed.data.note,
    });
    if (!updated) return res.status(409).json({ message: "This order can no longer be disputed here. Please email us." });
    await emailOrderIssue(CONTACT_EMAIL, order.id, parsed.data.note);
    res.json({ ok: true });
  });

  // Buyer's purchases and offers.
  app.get("/api/my/orders", async (req, res) => {
    const userId = currentUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const rows = await orderStorage.ordersForBuyer(userId);
    const views = await Promise.all(rows.map(async (o) => ({
      ...publicOrderView(o, await storage.getArtwork(o.artworkId), await storage.getUser(o.artistId)),
      statusToken: o.statusToken,
    })));
    res.json(views);
  });

  // Artist's sales, including where to ship.
  app.get("/api/selling/orders", async (req, res) => {
    const userId = currentUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const rows = await orderStorage.ordersForArtist(userId);
    const views = await Promise.all(rows.map(async (o) => {
      const artwork = await storage.getArtwork(o.artworkId);
      return {
        id: o.id, status: o.status, artwork: artwork ? { id: artwork.id, title: artwork.title, imageUrl: artwork.imageUrl } : null,
        itemAmount: o.itemAmount, artistEarnings: dollars(artistShareCents(cents(o.itemAmount), artwork?.promotionPercentage)),
        shipTo: ["paid", "shipped", "issue"].includes(o.status) ? formatShipTo(o) : null,
        whiteGlove: o.whiteGlove, canBuyLabel: easypostConfigured() && !o.whiteGlove,
        carrier: o.carrier, trackingNumber: o.trackingNumber, trackingUrl: o.trackingUrl, labelUrl: o.labelUrl,
        paidAt: o.paidAt, shippedAt: o.shippedAt, deliveredAt: o.deliveredAt,
        payoutReleaseAt: o.payoutReleaseAt, payoutReleasedAt: o.payoutReleasedAt,
      };
    }));
    res.json(views);
  });

  // Artist buys the prepaid, insured label.
  app.post("/api/selling/orders/:id/label", async (req, res) => {
    const userId = currentUserId(req);
    const order = await orderStorage.getOrder(Number(req.params.id));
    if (!userId || !order || order.artistId !== userId) return res.status(404).json({ message: "Order not found" });
    if (order.status !== "paid") return res.status(409).json({ message: "A label can only be bought for a paid order that hasn't shipped." });
    if (order.whiteGlove) return res.status(409).json({ message: "This piece ships white-glove. BrushBids will arrange pickup." });
    if (!easypostConfigured()) return res.status(503).json({ message: "Label printing isn't available yet. Add your tracking number instead." });
    try {
      // Re-quote at label time so the shipment has the final address and
      // sender details (the checkout-time shipment may be stale).
      let shipmentId: string | null = null;
      {
        const artwork = await storage.getArtwork(order.artworkId);
        const artist = await storage.getUser(order.artistId);
        const quote = await quoteShipping(artwork as any, artist!, {
          name: order.shipName ?? undefined, street1: order.shipStreet1 ?? undefined, street2: order.shipStreet2 ?? undefined,
          city: order.shipCity ?? undefined, state: order.shipState ?? undefined, zip: order.shipZip ?? "",
        });
        shipmentId = quote.easypostShipmentId;
        if (!shipmentId) return res.status(422).json({ message: "Add your ship-from address on the Dashboard before buying a label." });
      }
      const label = await buyLabel({ shipmentId, carrier: order.carrier, service: null, insuredValue: Number(order.insuredValue ?? order.itemAmount) });
      const updated = await orderStorage.transitionOrder(order.id, ["paid"], {
        status: "shipped", shippedAt: new Date(), carrier: label.carrier, trackingNumber: label.trackingNumber,
        trackingUrl: label.trackingUrl, labelUrl: label.labelUrl, easypostShipmentId: shipmentId, easypostTrackerId: label.trackerId,
      });
      if (updated) await emailOrderShipped({ userId: order.buyerId, email: order.buyerEmail }, (await storage.getArtwork(order.artworkId))?.title ?? "your artwork", label.trackingUrl, order.statusToken);
      res.json({ labelUrl: label.labelUrl, trackingNumber: label.trackingNumber });
    } catch (err: any) {
      console.error(`[label] order ${order.id}:`, err.message);
      res.status(502).json({ message: `Couldn't buy the label: ${err.message}` });
    }
  });

  // Artist shipped with their own postage and enters the tracking number.
  app.post("/api/selling/orders/:id/tracking", async (req, res) => {
    const userId = currentUserId(req);
    const order = await orderStorage.getOrder(Number(req.params.id));
    if (!userId || !order || order.artistId !== userId) return res.status(404).json({ message: "Order not found" });
    const parsed = z.object({
      carrier: z.enum(["USPS", "UPS", "FedEx", "DHL"]),
      trackingNumber: z.string().trim().min(8, "Enter the full tracking number").max(40),
    }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });
    let trackerId: string | null = null;
    let trackingUrl: string | null = null;
    if (easypostConfigured()) {
      try {
        const tracker = await createTracker(parsed.data.trackingNumber, parsed.data.carrier);
        trackerId = tracker.id;
        trackingUrl = tracker.publicUrl;
      } catch (err: any) {
        return res.status(400).json({ message: `That tracking number wasn't recognized: ${err.message}` });
      }
    }
    const updated = await orderStorage.transitionOrder(order.id, ["paid"], {
      status: "shipped", shippedAt: new Date(), carrier: parsed.data.carrier, trackingNumber: parsed.data.trackingNumber,
      trackingUrl, easypostTrackerId: trackerId, artistPaidShipping: true,
    });
    if (!updated) return res.status(409).json({ message: "This order isn't waiting to be shipped." });
    await emailOrderShipped({ userId: order.buyerId, email: order.buyerEmail }, (await storage.getArtwork(order.artworkId))?.title ?? "your artwork", trackingUrl, order.statusToken);
    res.json({ ok: true });
  });

  // Offers
  app.post("/api/offers", async (req, res) => {
    const buyerId = currentUserId(req);
    if (!buyerId) return res.status(401).json({ message: "Please sign in to make an offer." });
    const parsed = z.object({ artworkId: z.number(), amount: z.coerce.number().positive(), confirmedAdult: z.boolean().optional() }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Enter an offer amount." });
    const ageError = await buyerAgeError(buyerId, parsed.data.confirmedAdult);
    if (ageError) return res.status(403).json({ message: ageError });
    const artwork = await storage.getArtwork(parsed.data.artworkId);
    if (!isAvailable(artwork)) return res.status(409).json({ message: "This artwork is no longer available." });
    if (artwork.artistId === buyerId) return res.status(400).json({ message: "You can't make an offer on your own artwork." });
    if (needsWhiteGlove(artwork as any) && WHITE_GLOVE_SHIPPING_TIERS.length === 0) {
      return res.status(409).json({ message: new WhiteGloveUnavailableError().message });
    }
    const amount = Math.round(parsed.data.amount * 100) / 100;
    const min = minOfferAmount(artwork);
    const asking = askingPrice(artwork);
    if (amount < min) return res.status(400).json({ message: `Offers must be at least $${min.toFixed(2)}.` });
    if (amount >= asking) return res.status(400).json({ message: "That's at or above the asking price. Just use Buy Now." });
    if (await orderStorage.openOfferFromBuyer(artwork.id, buyerId)) {
      return res.status(409).json({ message: "You already have an open offer on this piece." });
    }
    const offer = await orderStorage.createOffer({
      artworkId: artwork.id, buyerId, artistId: artwork.artistId, amount: amount.toFixed(2),
      expiresAt: new Date(Date.now() + OFFER_WINDOW_HOURS * HOUR),
    });
    const artist = await storage.getUser(artwork.artistId);
    await emailOfferReceived({ userId: artwork.artistId, email: artist?.email }, artwork.title, offer.amount);
    res.status(201).json(offer);
  });

  app.get("/api/my/offers", async (req, res) => {
    const userId = currentUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const rows = await orderStorage.offersForBuyer(userId);
    res.json(await Promise.all(rows.map(async (o) => {
      const a = await storage.getArtwork(o.artworkId);
      return { ...o, artwork: a ? { id: a.id, title: a.title, imageUrl: a.imageUrl, askingPrice: askingPrice(a) } : null };
    })));
  });

  app.get("/api/selling/offers", async (req, res) => {
    const userId = currentUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const rows = await orderStorage.offersForArtist(userId);
    res.json(await Promise.all(rows.map(async (o) => {
      const a = await storage.getArtwork(o.artworkId);
      return { id: o.id, amount: o.amount, status: o.status, expiresAt: o.expiresAt, createdAt: o.createdAt,
        artwork: a ? { id: a.id, title: a.title, imageUrl: a.imageUrl, askingPrice: askingPrice(a) } : null };
    })));
  });

  app.post("/api/selling/offers/:id/:action", async (req, res) => {
    const userId = currentUserId(req);
    const action = String(req.params.action);
    if (action !== "accept" && action !== "decline") return res.status(404).json({ message: "Not found" });
    const offer = await orderStorage.getOffer(Number(req.params.id));
    if (!userId || !offer || offer.artistId !== userId) return res.status(404).json({ message: "Offer not found" });
    if (offer.expiresAt <= new Date()) return res.status(409).json({ message: "This offer has expired." });
    const artwork = await storage.getArtwork(offer.artworkId);
    if (action === "accept" && !isAvailable(artwork)) return res.status(409).json({ message: "This artwork has already sold." });
    const updated = await orderStorage.transitionOffer(offer.id, ["pending"], action === "accept"
      ? { status: "accepted", respondedAt: new Date(), expiresAt: new Date(Date.now() + OFFER_WINDOW_HOURS * HOUR) }
      : { status: "declined", respondedAt: new Date() });
    if (!updated) return res.status(409).json({ message: "This offer was already answered." });
    const buyer = await storage.getUser(offer.buyerId);
    const title = artwork?.title ?? "the artwork";
    if (action === "accept") await emailOfferAccepted({ userId: offer.buyerId, email: buyer?.email }, title, offer.amount, offer.artworkId);
    else await emailOfferDeclined({ userId: offer.buyerId, email: buyer?.email }, title, offer.artworkId);
    res.json(updated);
  });

  app.post("/api/my/offers/:id/withdraw", async (req, res) => {
    const userId = currentUserId(req);
    const offer = await orderStorage.getOffer(Number(req.params.id));
    if (!userId || !offer || offer.buyerId !== userId) return res.status(404).json({ message: "Offer not found" });
    const updated = await orderStorage.transitionOffer(offer.id, ["pending", "accepted"], { status: "withdrawn", respondedAt: new Date() });
    if (!updated) return res.status(409).json({ message: "This offer is already closed." });
    res.json(updated);
  });

  // Admin
  app.get("/api/admin/orders", async (req, res) => {
    if (!(await isAdmin(req))) return res.status(403).json({ message: "Forbidden" });
    const rows = await orderStorage.allOrders();
    res.json(await Promise.all(rows.map(async (o) => {
      const [a, artist, buyer] = await Promise.all([storage.getArtwork(o.artworkId), storage.getUser(o.artistId), storage.getUser(o.buyerId)]);
      return {
        ...o,
        artworkTitle: a?.title ?? null,
        artistName: [artist?.firstName, artist?.lastName].filter(Boolean).join(" ") || artist?.email || o.artistId,
        buyerName: o.shipName || buyer?.email || o.buyerId,
        shipTo: formatShipTo(o),
      };
    })));
  });

  app.post("/api/admin/orders/:id/:action", async (req, res) => {
    if (!(await isAdmin(req))) return res.status(403).json({ message: "Forbidden" });
    const order = await orderStorage.getOrder(Number(req.params.id));
    if (!order) return res.status(404).json({ message: "Order not found" });
    const action = String(req.params.action);
    try {
      if (action === "mark-delivered") {
        const updated = await markDelivered(order, new Date());
        if (!updated) return res.status(409).json({ message: "Only paid or shipped orders can be marked delivered." });
        return res.json(updated);
      }
      if (action === "release-now") {
        if (!["delivered", "issue"].includes(order.status)) return res.status(409).json({ message: "Only delivered or disputed orders can be released." });
        if (order.status === "issue") await orderStorage.updateOrder(order.id, { status: "delivered", deliveredAt: order.deliveredAt ?? new Date() });
        const done = await releasePayout((await orderStorage.getOrder(order.id))!);
        return done ? res.json({ ok: true }) : res.status(409).json({ message: "Payout could not be released; see server logs." });
      }
      if (action === "refund") {
        if (!order.stripePaymentIntentId || order.payoutReleasedAt) return res.status(409).json({ message: "This order can't be refunded here (already paid out or not paid)." });
        const stripe = await getUncachableStripeClient();
        await stripe.refunds.create({ payment_intent: order.stripePaymentIntentId }, { idempotencyKey: `order-${order.id}-refund` });
        await orderStorage.updateOrder(order.id, { status: "refunded" });
        await storage.reopenArtworkForSale(order.artworkId);
        return res.json({ ok: true });
      }
      return res.status(404).json({ message: "Unknown action" });
    } catch (err: any) {
      console.error(`[admin orders] ${action} on ${order.id}:`, err.message);
      return res.status(502).json({ message: err.message });
    }
  });
}

async function markDelivered(order: Order, deliveredAt: Date): Promise<Order | undefined> {
  // The buyer always gets the full inspection window, counted from when we
  // learn of the delivery if tracking reports it late.
  const windowStart = Math.max(deliveredAt.getTime(), Date.now());
  return orderStorage.transitionOrder(order.id, ["paid", "shipped"], {
    status: "delivered",
    deliveredAt,
    payoutReleaseAt: new Date(windowStart + INSPECTION_DAYS * DAY),
  });
}

// Payment confirmed by Stripe: mark the artwork sold (refunding if someone
// else bought it first), save the address and tax, and notify both sides.
export async function handleOrderCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  if (session.payment_status !== "paid") return;
  const order = (await orderStorage.getOrderBySession(session.id))
    ?? (session.metadata?.orderId ? await orderStorage.getOrder(Number(session.metadata.orderId)) : undefined);
  if (!order) {
    console.error(`[order] no order for session ${session.id}`);
    return;
  }
  if (order.status !== "pending_payment" && order.status !== "cancelled") return; // already handled

  const stripe = await getUncachableStripeClient();
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  if (!paymentIntentId) return;

  const claimed = await storage.tryClaimArtworkSale(order.artworkId, order.buyerId);
  if (!claimed) {
    const fresh = await storage.getArtwork(order.artworkId);
    if (fresh?.paidBy !== order.buyerId || (await orderStorage.ordersForBuyer(order.buyerId)).some((o) => o.artworkId === order.artworkId && o.id !== order.id && o.status !== "refunded")) {
      console.warn(`[order] artwork ${order.artworkId} already sold; refunding order ${order.id}`);
      await stripe.refunds.create({ payment_intent: paymentIntentId }, { idempotencyKey: `order-${order.id}-refund` }).catch((e) => console.error(e));
      await orderStorage.updateOrder(order.id, { status: "refunded", stripePaymentIntentId: paymentIntentId, adminNote: "Refunded automatically: artwork already sold." });
      return;
    }
  }

  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  const chargeId = typeof pi.latest_charge === "string" ? pi.latest_charge : pi.latest_charge?.id ?? null;
  const full = await stripe.checkout.sessions.retrieve(session.id);
  const ship = (full as any).collected_information?.shipping_details ?? (full as any).shipping_details;
  const addr = ship?.address;
  const addressChanged = addr?.postal_code && order.shipZip && addr.postal_code.slice(0, 5) !== order.shipZip.slice(0, 5);

  // Payment record (tax reporting + manual payout linkage).
  let bid = await storage.getBidByCheckoutSession(session.id);
  if (!bid) {
    bid = await storage.createBid({
      artworkId: order.artworkId,
      bidderId: order.buyerId,
      amount: order.itemAmount,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
      holdStatus: "captured",
      capturedAt: new Date(),
      shippingStreet: addr?.line1 ?? order.shipStreet1,
      shippingCity: addr?.city ?? order.shipCity,
      shippingState: addr?.state ?? order.shipState,
      shippingPostalCode: addr?.postal_code ?? order.shipZip,
      shippingCountry: "US",
      shippingCarrier: order.carrier ?? undefined,
      shippingService: order.shippingLabel ?? undefined,
      shippingAmount: order.shippingAmount,
    } as any);
  }
  await persistTaxFromCheckoutSession(session.id, paymentIntentId);

  const paid = await orderStorage.transitionOrder(order.id, ["pending_payment", "cancelled"], {
    status: "paid",
    paidAt: new Date(),
    stripePaymentIntentId: paymentIntentId,
    stripeChargeId: chargeId,
    bidId: bid.id,
    taxAmount: dollars(full.total_details?.amount_tax ?? 0),
    totalAmount: dollars(full.amount_total ?? 0),
    buyerEmail: full.customer_details?.email ?? order.buyerEmail,
    shipName: ship?.name ?? order.shipName,
    shipStreet1: addr?.line1 ?? order.shipStreet1,
    shipStreet2: addr?.line2 ?? order.shipStreet2,
    shipCity: addr?.city ?? order.shipCity,
    shipState: addr?.state ?? order.shipState,
    shipZip: addr?.postal_code ?? order.shipZip,
    // A new address may need a new label quote; the saved shipment is stale.
    ...(addressChanged ? { easypostShipmentId: null, adminNote: `Buyer changed ZIP at checkout (quoted ${order.shipZip}).` } : {}),
  });
  if (!paid) return;

  if (order.offerId) await orderStorage.transitionOffer(order.offerId, ["accepted"], { status: "purchased" });
  await orderStorage.closeOtherOffers(order.artworkId, order.offerId ?? null);

  const [artwork, artist] = await Promise.all([storage.getArtwork(order.artworkId), storage.getUser(order.artistId)]);
  const title = artwork?.title ?? "your artwork";
  await emailOrderConfirmed({ userId: order.buyerId, email: paid.buyerEmail }, title, paid.totalAmount ?? paid.itemAmount, paid.statusToken);
  await emailArtistSold({ userId: order.artistId, email: artist?.email }, title, formatShipTo(paid), paid.whiteGlove);
  console.log(`[order] ${order.id} paid: artwork ${order.artworkId} sold to ${order.buyerId}`);
}

export async function handleOrderCheckoutExpired(session: Stripe.Checkout.Session): Promise<void> {
  const order = await orderStorage.getOrderBySession(session.id);
  if (order) await orderStorage.transitionOrder(order.id, ["pending_payment"], { status: "cancelled" });
}

// Pay the artist once delivery + inspection window has passed without a
// reported problem.
async function releasePayout(order: Order): Promise<boolean> {
  if (order.status !== "delivered" || order.payoutReleasedAt) return false;
  const [artwork, artist] = await Promise.all([storage.getArtwork(order.artworkId), storage.getUser(order.artistId)]);
  if (!artwork || !artist) return false;

  const reimbursement = order.artistPaidShipping ? cents(order.shippingAmount) : 0;
  const amountCents = artistShareCents(cents(order.itemAmount), artwork.promotionPercentage) + reimbursement;
  const target = resolvePayoutTarget(artist);
  let transferId: string | null = null;

  if (target?.kind === "stripe" && hasStripeConnectReady(artist)) {
    const stripe = await getUncachableStripeClient();
    const transfer = await stripe.transfers.create({
      amount: amountCents,
      currency: "usd",
      destination: artist.stripeAccountId!,
      transfer_group: `order_${order.id}`,
      ...(order.stripeChargeId ? { source_transaction: order.stripeChargeId } : {}),
      metadata: { orderId: String(order.id), artworkId: String(order.artworkId) },
    }, { idempotencyKey: `order-${order.id}-payout` });
    transferId = transfer.id;
  } else {
    if (!order.bidId) {
      console.error(`[payout] order ${order.id} has no payment record; cannot queue manual payout`);
      return false;
    }
    const existing = await storage.getPayoutByBidId(order.bidId);
    if (!existing) {
      await storage.createPayout({
        bidId: order.bidId,
        artworkId: order.artworkId,
        artistId: artist.id,
        amount: dollars(amountCents),
        method: target && target.kind === "manual" ? target.method : null,
        handle: target && target.kind === "manual" ? target.handle : null,
        recipientEmail: target && target.kind === "manual" ? (target.recipientEmail ?? artist.email ?? null) : artist.email ?? null,
        forMinor: target && target.kind === "manual" ? target.forMinor : false,
      } as any);
    }
  }

  const done = await orderStorage.transitionOrder(order.id, ["delivered"], {
    status: "completed", payoutReleasedAt: new Date(), stripeTransferId: transferId,
  });
  if (done) await emailArtistPaid({ userId: artist.id, email: artist.email }, artwork.title, dollars(amountCents), !transferId);
  return !!done;
}

// Runs every few minutes: expire offers, drop abandoned checkouts, pick up
// deliveries from tracking, and release payouts whose inspection window ended.
export function startOrderScheduler(intervalMs = 5 * 60 * 1000) {
  const tick = async () => {
    const now = new Date();
    try {
      await orderStorage.expireOffers(now);
      for (const o of await orderStorage.stalePendingOrders(new Date(now.getTime() - 2 * HOUR))) {
        await orderStorage.transitionOrder(o.id, ["pending_payment"], { status: "cancelled" });
      }
      if (easypostConfigured()) {
        for (const o of await orderStorage.ordersByStatus("shipped")) {
          if (!o.easypostTrackerId) continue;
          try {
            const t = await getTrackerStatus(o.easypostTrackerId);
            if (t.deliveredAt) await markDelivered(o, t.deliveredAt);
          } catch (err: any) {
            console.error(`[orders] tracker ${o.easypostTrackerId}:`, err.message);
          }
        }
      }
      for (const o of await orderStorage.ordersReadyForPayout(now)) {
        try {
          await releasePayout(o);
        } catch (err: any) {
          console.error(`[orders] payout for order ${o.id} failed:`, err.message);
        }
      }
    } catch (err: any) {
      console.error("[orders] scheduler tick failed:", err.message);
    }
  };
  setTimeout(tick, 10_000);
  return setInterval(tick, intervalMs);
}
