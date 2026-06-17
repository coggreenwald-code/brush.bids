import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";
import { hasStripeConnectReady, hasReadyPayout, isMinor, resolvePayoutTarget, ageInYears } from "@shared/payoutHelpers";
import { getEasyPostRates } from "./easypost";
import { sendAdultUpgradeEmail } from "./emailService";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import OpenAI from "openai";
import type Stripe from "stripe";
import { getUncachableStripeClient, getStripeClient, getStripePublishableKey, getAppOrigin } from "./stripeClient";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedMimeTypes = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp", "image/tiff",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const extAllowed = /\.(jpg|jpeg|png|gif|webp|bmp|tiff)$/i;
    if (!extAllowed.test(path.extname(file.originalname))) {
      return cb(new Error("Only image files are allowed"));
    }
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(new Error("Invalid image file type"));
    }
    cb(null, true);
  },
});

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // Artworks
  app.get(api.artworks.list.path, async (req, res) => {
    const status = req.query.status as "pending" | "approved" | "rejected" | undefined;
    const artistId = req.query.artistId as string | undefined;
    const sortBy = req.query.sortBy as "views" | undefined;
    
    let artworkList;
    if (status === "approved" && !artistId) {
      artworkList = await storage.getApprovedArtworksSortedByPromotion();
    } else {
      artworkList = await storage.getArtworks(status, artistId);
    }

    if (sortBy === "views") {
      artworkList = [...artworkList].sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
    }
    
    const artistIds = Array.from(new Set(artworkList.map(a => a.artistId)));
    const artists = await Promise.all(artistIds.map(id => storage.getUser(id)));
    const artistMap = Object.fromEntries(artists.filter(Boolean).map(a => [a!.id, a]));
    const enriched = artworkList.map(a => ({ ...a, artist: artistMap[a.artistId] || null }));
    res.json(enriched);
  });

  app.get(api.artworks.get.path, async (req, res) => {
    const artwork = await storage.getArtwork(Number(req.params.id));
    if (!artwork) {
      return res.status(404).json({ message: "Artwork not found" });
    }
    storage.incrementArtworkViews(artwork.id).catch(() => {});
    const artist = await storage.getUser(artwork.artistId);
    res.json({ ...artwork, artist: artist || null });
  });

  app.post(api.artworks.create.path, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const userId = (req.user as any).id || (req.user as any).claims?.sub;
    try {
      const input = api.artworks.create.input.parse(req.body);
      // Authorization: artist must be the logged-in user
      if (input.artistId !== userId) {
        return res.status(403).json({ message: "You can only submit artwork as yourself" });
      }
      // Card-authorization holds expire at 7 days, so new listings can't
      // outlive that. Existing 14/30-day artworks are unaffected.
      if (![1, 3, 5, 7].includes(input.auctionDurationDays ?? 7)) {
        return res.status(400).json({
          message: "Auction duration must be 1, 3, 5, or 7 days.",
          field: "auctionDurationDays",
        });
      }
      // Buy It Now price, when provided, must exceed the reserve/starting price.
      if (input.buyNowPrice != null && input.buyNowPrice !== "") {
        if (Number(input.buyNowPrice) <= Number(input.price)) {
          return res.status(400).json({
            message: "Buy It Now price must be higher than the reserve price.",
            field: "buyNowPrice",
          });
        }
      }
      const artwork = await storage.createArtwork(input);
      res.status(201).json(artwork);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.patch(api.artworks.updateStatus.path, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const adminUser = await storage.getUser((req.user as any).claims?.sub);
    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    try {
      const { status, feedback } = api.artworks.updateStatus.input.parse(req.body);
      // Gate approval on the artist having a complete ship-from address, so no
      // biddable artwork ever goes live missing one (which would 422 the
      // buyer's shipping-rate lookup mid-bid).
      if (status === "approved") {
        const target = await storage.getArtwork(Number(req.params.id));
        if (target) {
          const seller = await storage.getUser(target.artistId);
          if (!seller?.shipFromStreet || !seller?.shipFromCity || !seller?.shipFromState || !seller?.shipFromZip) {
            return res.status(400).json({
              message: "This artist hasn't set a complete ship-from address yet. Ask them to add it in Dashboard → Shipping before this artwork can be approved.",
            });
          }
        }
      }
      const artwork = await storage.updateArtworkStatus(Number(req.params.id), status, feedback);
      res.json(artwork);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.patch(api.artworks.updateFeedback.path, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const feedbackAdmin = await storage.getUser((req.user as any).claims?.sub);
    if (!feedbackAdmin || feedbackAdmin.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    try {
      const { feedback } = api.artworks.updateFeedback.input.parse(req.body);
      const id = Number(req.params.id);
      const artwork = await storage.getArtwork(id);
      if (!artwork) {
        return res.status(404).json({ message: "Artwork not found" });
      }
      const updated = await storage.updateArtworkStatus(id, artwork.status as any, feedback);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.artworks.delete.path, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const deleteAdminUser = await storage.getUser((req.user as any).claims?.sub);
    if (!deleteAdminUser || deleteAdminUser.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const id = Number(req.params.id);
    const artwork = await storage.getArtwork(id);
    if (!artwork) {
      return res.status(404).json({ message: "Artwork not found" });
    }
    await storage.deleteArtwork(id);
    res.json({ message: "Artwork deleted successfully" });
  });

  app.patch(api.artworks.updatePromotion.path, async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const id = Number(req.params.id);
    const artwork = await storage.getArtwork(id);
    
    if (!artwork) {
      return res.status(404).json({ message: "Artwork not found" });
    }

    if (artwork.artistId !== (req.user as any).id) {
      return res.status(403).json({ message: "Only the artist can promote their artwork" });
    }

    if (artwork.status !== "approved") {
      return res.status(400).json({ message: "Only approved artworks can be promoted" });
    }

    if (artwork.paidAt) {
      return res.status(400).json({ message: "Cannot promote artwork that has already been sold" });
    }

    try {
      const { promotionPercentage } = api.artworks.updatePromotion.input.parse(req.body);
      
      if (promotionPercentage > 70) {
        return res.status(400).json({ message: "Promotion percentage cannot exceed 70%" });
      }
      
      const updated = await storage.updateArtworkPromotion(id, promotionPercentage);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // AI Review Endpoint (Admin only)
  app.post(api.artworks.aiReview.path, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const aiReviewAdminUser = await storage.getUser((req.user as any).claims?.sub);
    if (!aiReviewAdminUser || aiReviewAdminUser.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    const id = Number(req.params.id);
    const artwork = await storage.getArtwork(id);
    if (!artwork) return res.status(404).json({ message: "Artwork not found" });

    // Mocking AI review process using OpenAI
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          { role: "system", content: "You are an expert art curator. Analyze the artwork description and provide a score (1-100) and constructive feedback." },
          { role: "user", content: `Title: ${artwork.title}\nDescription: ${artwork.description}` }
        ],
        response_format: { type: "json_object" }
      });

      const content = JSON.parse(response.choices[0].message.content || "{}");
      const score = content.score || 75;
      const feedback = content.feedback || "Good effort, but needs more detail.";

      // Update artwork with AI feedback
      await storage.updateArtworkStatus(id, "pending", feedback, score);
      
      res.json({ score, feedback });
    } catch (error) {
      console.error("AI Review failed:", error);
      res.status(500).json({ message: "AI Review failed" });
    }
  });

  // Bids — public listing returns ONLY active (authorized or captured) bids.
  // Canceled/failed/pending holds must not affect the displayed current price
  // or the bid floor in the UI. Captured bids are included so the winning
  // amount remains visible AFTER settlement.
  app.get(api.bids.list.path, async (req, res) => {
    const bids = await storage.getActiveBidsForArtwork(Number(req.params.artworkId));
    res.json(bids);
  });

  // Bids — opens a Stripe Checkout Session in manual-capture mode for a card
  // authorization hold. The bid row is inserted by the webhook once Stripe
  // confirms authorization; the scheduler captures the winner at auction end.
  app.post(api.bids.create.path, async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "You must be signed in to bid" });
    }
    try {
      const input = api.bids.create.input.parse(req.body);
      const bidderId = (req.user as any).id || (req.user as any).claims?.sub;
      if (input.bidderId !== bidderId) {
        return res.status(403).json({ message: "Bid bidder mismatch" });
      }

      const artwork = await storage.getArtwork(input.artworkId);
      if (!artwork) return res.status(404).json({ message: "Artwork not found" });
      if (artwork.status !== "approved") return res.status(400).json({ message: "Bidding is not open for this artwork" });
      if (artwork.paidAt) return res.status(400).json({ message: "This artwork has already been sold" });
      if (artwork.artistId === bidderId) return res.status(400).json({ message: "You cannot bid on your own artwork" });

      const now = new Date();
      let auctionEndTime: Date;
      if (artwork.endTime) {
        auctionEndTime = new Date(artwork.endTime);
      } else {
        auctionEndTime = new Date(artwork.createdAt || now);
        auctionEndTime.setDate(auctionEndTime.getDate() + (artwork.auctionDurationDays || 7));
      }
      if (now >= auctionEndTime) return res.status(400).json({ message: "This auction has ended" });

      // Floor uses authorized bids only; canceled/failed/pending don't count.
      const existingBids = await storage.getAuthorizedBidsForArtwork(input.artworkId);
      const currentHighest = existingBids.length > 0
        ? Math.max(...existingBids.map(b => Number(b.amount)))
        : Number(artwork.price);
      if (Number(input.amount) <= currentHighest) {
        return res.status(400).json({ message: `Bid must be higher than the current price of $${currentHighest}` });
      }

      // Look up the artist to decide whether to use Stripe Connect (automatic
      // transfer) or the manual payout queue. No gate here — artists can list
      // and receive bids before setting up a payout method; funds are held on
      // the platform balance and paid out once they configure their handle.
      const artist = await storage.getUser(artwork.artistId);
      if (!artist) return res.status(404).json({ message: "Artist not found" });
      const useConnect = hasStripeConnectReady(artist);

      // --- Timing instrumentation (see "client disconnected" 500s on the live
      // autoscale deployment). Logs elapsed ms for the two suspected-slow steps:
      // resolving the Stripe client (which may fetch Replit-connector creds on a
      // cold instance) and creating the Checkout Session (Stripe Tax adds RTTs).
      const t0 = Date.now();
      console.log(`[bids][timing] artwork=${input.artworkId} bidder=${bidderId} — resolving Stripe client...`);
      const stripe = await getStripeClient();
      const tClient = Date.now();
      console.log(`[bids][timing] getStripeClient() took ${tClient - t0}ms`);
      const amountCents = Math.round(Number(input.amount) * 100);
      // Split: 75% artist / 20% platform / 5% charity (charity paid manually
      // off-Stripe). Boost shifts that much from artist to platform.
      const boostPct = Math.max(0, Math.min(75, artwork.promotionPercentage || 0));
      const appFeeCents = Math.min(amountCents, Math.round(amountCents * (0.25 + boostPct / 100)));

      const origin = getAppOrigin();

      // Build the Checkout Session params. `useConnectFlag` toggles the direct
      // transfer to the artist's connected account; it can be turned off as a
      // fallback if Stripe rejects the connected account (e.g. a stale/test-mode
      // account used with live keys) so a bid never hard-fails the buyer with a
      // 500. Stripe Tax stays ON — BrushBids is the marketplace facilitator and
      // must collect tax, so a tax-config failure fails closed (surfaced as an
      // actionable error) rather than silently selling untaxed.
      const buildSessionParams = (
        useConnectFlag: boolean,
      ): Stripe.Checkout.SessionCreateParams => {
        const sharedMetadata = {
          kind: 'bid_hold',
          artworkId: String(artwork.id),
          bidderId,
          bidAmount: String(input.amount),
          baseAppFeeCents: String(appFeeCents),
          payoutKind: useConnectFlag ? 'connect' : 'manual',
        };
        return {
          payment_method_types: ['card'],
          mode: 'payment',
          customer_email: (req.user as any).email || undefined,
          // Stripe Tax requires a customer record for address-based calculation.
          customer_creation: 'always',
          // Buyer must enter a US ship-to address before paying so Stripe Tax
          // can determine sales-tax obligation per the marketplace facilitator
          // rules. Tax registrations are configured in the Stripe Dashboard;
          // jurisdictions with no registration return $0 tax.
          billing_address_collection: 'required',
          shipping_address_collection: { allowed_countries: ['US'] },
          automatic_tax: { enabled: true },
          line_items: [{
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Bid hold: ${artwork.title}`,
                description: `Card authorization for your bid on "${artwork.title}". Your card will only be charged if you win the auction. Sales tax shown below is collected by BrushBids as the marketplace facilitator.`,
                images: artwork.imageUrl ? [artwork.imageUrl] : [],
                // General tangible goods. Stripe Tax matches this to state-level
                // sales-tax rules. Override per artwork later if we add digital
                // or service categories.
                tax_code: 'txcd_99999999',
              },
              unit_amount: amountCents,
              // Tax is added on top of the bid (exclusive). The bid amount the
              // artist sees, the application fee, and the transfer split are all
              // computed against the pre-tax bid.
              tax_behavior: 'exclusive',
            },
            quantity: 1,
          }],
          payment_intent_data: {
            capture_method: 'manual',
            // For Connect artists: appFeeCents is ONLY the platform's pre-tax
            // cut, and the scheduler bumps application_fee_amount at capture
            // time to also retain the collected tax (artist payout stays based
            // on the pre-tax bid).
            //
            // For manual-payout (non-Connect) artists: we omit transfer_data
            // entirely so the full charge lands on the platform balance, and
            // the admin pays the artist their share off-Stripe. We still
            // remember baseAppFeeCents so the scheduler can compute their
            // queued payout amount.
            ...(useConnectFlag
              ? {
                  application_fee_amount: appFeeCents,
                  transfer_data: { destination: artist.stripeAccountId! },
                }
              : {}),
            metadata: sharedMetadata,
          },
          metadata: sharedMetadata,
          // Bound to min(auctionEnd, now+24h), clamped to Stripe's 30-min min.
          expires_at: Math.max(
            Math.floor(Date.now() / 1000) + 30 * 60,
            Math.floor(Math.min(auctionEndTime.getTime(), Date.now() + 24 * 60 * 60 * 1000) / 1000),
          ),
          success_url: `${origin}/artwork/${artwork.id}?bid=success&amount=${input.amount}`,
          cancel_url: `${origin}/artwork/${artwork.id}?bid=cancelled`,
        };
      };

      // The one recoverable Stripe failure we downgrade-and-retry instead of
      // 500ing: the connected account is invalid in this mode (e.g. a TEST-mode
      // account used with LIVE keys). We then retry without transfer_data and
      // queue the artist's payout manually. Tax errors are NOT swallowed.
      const isInvalidDestinationError = (e: any) =>
        e?.type === 'StripeInvalidRequestError' &&
        (/destination/i.test(e?.param || '') ||
          /no such destination|test mode|live mode|does not have access|destination account|connected account/i.test(e?.message || ''));

      let useConnectEff = useConnect;
      let session: Stripe.Checkout.Session | undefined;
      for (let attempt = 0; attempt < 2 && !session; attempt++) {
        const tCreate = Date.now();
        console.log(`[bids][timing] calling stripe.checkout.sessions.create() (attempt ${attempt + 1}, connect=${useConnectEff})...`);
        try {
          session = await stripe.checkout.sessions.create(
            buildSessionParams(useConnectEff),
          );
          console.log(`[bids][timing] sessions.create() took ${Date.now() - tCreate}ms; total since handler start ${Date.now() - t0}ms`);
        } catch (stripeErr: any) {
          console.log(`[bids][timing] sessions.create() FAILED after ${Date.now() - tCreate}ms (attempt ${attempt + 1})`);
          if (useConnectEff && isInvalidDestinationError(stripeErr)) {
            console.error(
              `[bids] Connect destination ${artist.stripeAccountId} rejected by Stripe (${stripeErr?.message}); ` +
                `falling back to the manual payout queue for artwork ${artwork.id}.`,
            );
            useConnectEff = false;
            continue;
          }
          throw stripeErr;
        }
      }
      if (!session) throw new Error('Could not create bid hold checkout session');

      // No bid row is written here — the webhook inserts it once Stripe
      // confirms the authorization, so abandoned checkouts leave no rows.
      res.status(200).json({
        artworkId: input.artworkId,
        amount: input.amount,
        checkoutUrl: session.url,
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      // Log the REAL error server-side (type/code/param/requestId + FULL stack)
      // so the true cause is visible in deployment logs, and surface a meaningful
      // message to the client instead of a vague "client disconnected".
      console.error("[bids] Bid hold creation failed:", {
        name: err?.name,
        type: err?.type,
        code: err?.code,
        param: err?.param,
        statusCode: err?.statusCode,
        requestId: err?.requestId,
        message: err?.message,
      });
      console.error("[bids] Full error stack:", err?.stack || err);
      const clientMessage =
        typeof err?.type === 'string' && err.type.startsWith('Stripe')
          ? `Payment setup failed: ${err.message}`
          : err?.message || "Failed to create bid hold";
      res.status(500).json({ message: clientMessage });
    }
  });

  // Buy It Now — immediate purchase at the artwork's buyNowPrice. Unlike the
  // bid flow (manual capture / card hold), this charges the buyer's card
  // RIGHT AWAY (automatic capture). On success the webhook marks the artwork
  // sold, ends the auction, releases other bidders' holds, and routes payout.
  app.post(api.buyout.create.path, async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "You must be signed in to buy" });
    }
    try {
      const input = api.buyout.create.input.parse(req.body);
      const bidderId = (req.user as any).id || (req.user as any).claims?.sub;
      if (input.bidderId !== bidderId) {
        return res.status(403).json({ message: "Buyer mismatch" });
      }

      const artwork = await storage.getArtwork(input.artworkId);
      if (!artwork) return res.status(404).json({ message: "Artwork not found" });
      if (artwork.status !== "approved") return res.status(400).json({ message: "This artwork is not available for purchase" });
      if (artwork.paidAt) return res.status(400).json({ message: "This artwork has already been sold" });
      if (artwork.artistId === bidderId) return res.status(400).json({ message: "You cannot buy your own artwork" });
      if (artwork.buyNowPrice == null) return res.status(400).json({ message: "This artwork doesn't have a Buy It Now price" });

      const now = new Date();
      let auctionEndTime: Date;
      if (artwork.endTime) {
        auctionEndTime = new Date(artwork.endTime);
      } else {
        auctionEndTime = new Date(artwork.createdAt || now);
        auctionEndTime.setDate(auctionEndTime.getDate() + (artwork.auctionDurationDays || 7));
      }
      if (now >= auctionEndTime) return res.status(400).json({ message: "This auction has ended" });

      const artist = await storage.getUser(artwork.artistId);
      if (!artist) return res.status(404).json({ message: "Artist not found" });
      const useConnect = hasStripeConnectReady(artist);

      const stripe = await getStripeClient();
      const buyNowAmount = Number(artwork.buyNowPrice);
      const amountCents = Math.round(buyNowAmount * 100);
      // Same split as bids: 75% artist / 20% platform / 5% charity, with boost
      // shifting from artist to platform.
      const boostPct = Math.max(0, Math.min(75, artwork.promotionPercentage || 0));
      const appFeeCents = Math.min(amountCents, Math.round(amountCents * (0.25 + boostPct / 100)));

      const origin = getAppOrigin();

      const buildSessionParams = (
        useConnectFlag: boolean,
      ): Stripe.Checkout.SessionCreateParams => {
        const sharedMetadata: Record<string, string> = {
          kind: 'buyout',
          artworkId: String(artwork.id),
          bidderId,
          bidAmount: String(buyNowAmount),
          baseAppFeeCents: String(appFeeCents),
          payoutKind: useConnectFlag ? 'connect' : 'manual',
        };
        if (input.shippingCarrier) sharedMetadata.shippingCarrier = input.shippingCarrier;
        if (input.shippingService) sharedMetadata.shippingService = input.shippingService;
        if (input.shippingAmount) sharedMetadata.shippingAmount = input.shippingAmount;
        return {
          payment_method_types: ['card'],
          mode: 'payment',
          customer_email: (req.user as any).email || undefined,
          customer_creation: 'always',
          billing_address_collection: 'required',
          shipping_address_collection: { allowed_countries: ['US'] },
          automatic_tax: { enabled: true },
          line_items: [{
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Buy It Now: ${artwork.title}`,
                description: `Immediate purchase of "${artwork.title}". Your card is charged now and the auction ends. Sales tax shown below is collected by BrushBids as the marketplace facilitator.`,
                images: artwork.imageUrl ? [artwork.imageUrl] : [],
                tax_code: 'txcd_99999999',
              },
              unit_amount: amountCents,
              tax_behavior: 'exclusive',
            },
            quantity: 1,
          }],
          payment_intent_data: {
            // Immediate charge (no manual hold) — buyout pays right away.
            // For Connect artists, bump the application_fee at session time so
            // platform retains its cut + collected tax; artist payout stays
            // based on the pre-tax buyout price.
            ...(useConnectFlag
              ? {
                  application_fee_amount: appFeeCents,
                  transfer_data: { destination: artist.stripeAccountId! },
                }
              : {}),
            metadata: sharedMetadata,
          },
          metadata: sharedMetadata,
          expires_at: Math.max(
            Math.floor(Date.now() / 1000) + 30 * 60,
            Math.floor(Math.min(auctionEndTime.getTime(), Date.now() + 24 * 60 * 60 * 1000) / 1000),
          ),
          success_url: `${origin}/artwork/${artwork.id}?buyout=success&amount=${buyNowAmount}`,
          cancel_url: `${origin}/artwork/${artwork.id}?buyout=cancelled`,
        };
      };

      const isInvalidDestinationError = (e: any) =>
        e?.type === 'StripeInvalidRequestError' &&
        (/destination/i.test(e?.param || '') ||
          /no such destination|test mode|live mode|does not have access|destination account|connected account/i.test(e?.message || ''));

      let useConnectEff = useConnect;
      let session: Stripe.Checkout.Session | undefined;
      for (let attempt = 0; attempt < 2 && !session; attempt++) {
        try {
          session = await stripe.checkout.sessions.create(
            buildSessionParams(useConnectEff),
          );
        } catch (stripeErr: any) {
          if (useConnectEff && isInvalidDestinationError(stripeErr)) {
            console.error(
              `[buyout] Connect destination ${artist.stripeAccountId} rejected by Stripe (${stripeErr?.message}); ` +
                `falling back to the manual payout queue for artwork ${artwork.id}.`,
            );
            useConnectEff = false;
            continue;
          }
          throw stripeErr;
        }
      }
      if (!session) throw new Error('Could not create buyout checkout session');

      res.status(200).json({
        artworkId: input.artworkId,
        amount: String(buyNowAmount),
        checkoutUrl: session.url,
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      console.error("[buyout] Buyout checkout creation failed:", {
        type: err?.type,
        code: err?.code,
        param: err?.param,
        requestId: err?.requestId,
        message: err?.message,
      });
      const clientMessage =
        typeof err?.type === 'string' && err.type.startsWith('Stripe')
          ? `Payment setup failed: ${err.message}`
          : err?.message || "Failed to start checkout";
      res.status(500).json({ message: clientMessage });
    }
  });

  // Charities
  app.get(api.charities.list.path, async (req, res) => {
    const charities = await storage.getCharities();
    res.json(charities);
  });

  // AI Description Generator
  app.post(api.artworks.generateDescription.path, async (req, res) => {
    try {
      const { title, medium } = api.artworks.generateDescription.input.parse(req.body);
      
      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          { 
            role: "system", 
            content: "You are a creative writing assistant helping student artists write compelling descriptions for their artwork. Write engaging, personal descriptions that tell a story and connect emotionally with potential buyers. Keep descriptions between 2-4 sentences. Be authentic and avoid overly formal language." 
          },
          { 
            role: "user", 
            content: `Write a compelling description for an artwork titled "${title}"${medium ? ` created using ${medium}` : ''}. Focus on the emotional impact and creative process.` 
          }
        ],
        max_completion_tokens: 200
      });

      const description = response.choices[0].message.content || "Unable to generate description";
      res.json({ description });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("AI description generation failed:", err);
      res.status(500).json({ message: "Failed to generate description" });
    }
  });

  app.patch(api.artworks.updateImage.path, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    try {
      const { imageUrl } = api.artworks.updateImage.input.parse(req.body);
      const id = Number(req.params.id);
      const artwork = await storage.getArtwork(id);
      if (!artwork) return res.status(404).json({ message: "Artwork not found" });
      const userId = (req.user as any).claims?.sub || (req.user as any).id;
      const requester = await storage.getUser(userId);
      const isOwner = artwork.artistId === userId;
      const isAdmin = requester?.role === "admin";
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "Only the artist or an admin can replace this image" });
      }
      const updated = await storage.updateArtworkImage(id, imageUrl);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.post(api.artworks.upload.path, (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    next();
  }, upload.single("image"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }
    const base64 = req.file.buffer.toString("base64");
    const imageUrl = `data:${req.file.mimetype};base64,${base64}`;
    res.json({ imageUrl });
  });

  // Serve any legacy on-disk uploads so old artwork images still load
  app.use("/uploads", (await import("express")).default.static(uploadDir));

  // Users
  app.get(api.users.get.path, async (req, res) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = await storage.getUser(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  });

  app.patch(api.users.updateBio.path, async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const currentUserId = (req.user as any).claims?.sub || (req.user as any).id;
    if (currentUserId !== userId) {
      return res.status(403).json({ message: "You can only update your own profile" });
    }

    try {
      const { bio } = api.users.updateBio.input.parse(req.body);
      const user = await storage.updateUserBio(userId, bio);
      res.json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Update user name
  app.patch(api.users.updateName.path, async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const currentUserId = (req.user as any).claims?.sub || (req.user as any).id;
    if (currentUserId !== userId) {
      return res.status(403).json({ message: "You can only update your own profile" });
    }

    try {
      const { firstName, lastName } = api.users.updateName.input.parse(req.body);
      const user = await storage.updateUserName(userId, firstName, lastName);
      res.json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.patch(api.users.updateProfileImage.path, async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const currentUserId = (req.user as any).claims?.sub || (req.user as any).id;
    if (currentUserId !== userId) {
      return res.status(403).json({ message: "You can only update your own profile" });
    }
    try {
      const { profileImageUrl } = api.users.updateProfileImage.input.parse(req.body);
      const user = await storage.updateUserProfileImage(userId, profileImageUrl);
      res.json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  // Update user role
  app.patch(api.users.updateRole.path, async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const currentUserId = (req.user as any).claims?.sub || (req.user as any).id;
    if (currentUserId !== userId) {
      return res.status(403).json({ message: "You can only update your own role" });
    }

    try {
      const { role } = api.users.updateRole.input.parse(req.body);
      const user = await storage.updateUserRole(userId, role);
      res.json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Complete onboarding (first-time role selection)
  app.post(api.users.completeOnboarding.path, async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const currentUserId = (req.user as any).claims?.sub || (req.user as any).id;
    if (currentUserId !== userId) {
      return res.status(403).json({ message: "You can only complete your own onboarding" });
    }

    try {
      const parsed = api.users.completeOnboarding.input.parse(req.body);
      const { role, firstName, lastName, ...payoutFields } = parsed;
      // Apply the same payout invariants as PATCH (artists need DOB; minors
      // need parent path only; adults need own or parent). Onboarding usually
      // sends only DOB so most calls pass through unchanged, but this closes
      // the bypass where a client posts a fully-formed minor with their own
      // payoutHandle to the onboarding endpoint.
      const wantsArtist = role === "artist" || role === "both";
      if (wantsArtist) {
        if (!payoutFields.dateOfBirth) {
          return res.status(400).json({ message: "Date of birth is required for artists.", field: "dateOfBirth" });
        }
        const age = ageInYears(payoutFields.dateOfBirth);
        const minorEff = age !== null && age < 18;
        if (minorEff && (payoutFields.payoutMethod || payoutFields.payoutHandle)) {
          return res.status(400).json({ message: "Under-18 artists must route payouts through a parent or guardian.", field: "payoutMethod" });
        }
      }
      const user = await storage.completeOnboarding(userId, role, firstName, lastName, payoutFields);
      res.json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Update payout settings (manual handle, parent details, DOB) any time.
  // Server-side cross-field invariants (don't trust the UI):
  //   - dateOfBirth, once set, can't be cleared.
  //   - Minors (resolved from the merged DOB) must have parent email + method
  //     + handle + accepted terms; their own method/handle is rejected.
  //   - Adults can clear the parent path only if they have their own handle.
  app.patch(api.users.updatePayoutSettings.path, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const userId = (req.user as any).claims?.sub || (req.user as any).id;
    if (req.params.id !== userId) {
      return res.status(403).json({ message: "You can only update your own payout settings" });
    }
    try {
      const input = api.users.updatePayoutSettings.input.parse(req.body);
      const existing = await storage.getUser(userId);
      if (!existing) return res.status(404).json({ message: "User not found" });

      // Effective field values after the patch is applied (ignoring undefined).
      const eff = {
        dateOfBirth: (input.dateOfBirth !== undefined ? input.dateOfBirth : (existing.dateOfBirth as any)) || null,
        payoutMethod: input.payoutMethod !== undefined ? input.payoutMethod : existing.payoutMethod,
        payoutHandle: input.payoutHandle !== undefined ? input.payoutHandle : existing.payoutHandle,
        parentGuardianEmail: input.parentGuardianEmail !== undefined ? input.parentGuardianEmail : existing.parentGuardianEmail,
        parentPayoutMethod: input.parentPayoutMethod !== undefined ? input.parentPayoutMethod : existing.parentPayoutMethod,
        parentPayoutHandle: input.parentPayoutHandle !== undefined ? input.parentPayoutHandle : existing.parentPayoutHandle,
        parentTermsAcceptedAt: input.parentTermsAccepted !== undefined
          ? (input.parentTermsAccepted ? new Date() : null)
          : existing.parentTermsAcceptedAt,
      };

      // Don't let an artist clear a previously-known DOB. (Schema only allows
      // string|undefined so this is mostly defensive against future changes.)
      if (existing.dateOfBirth && (input.dateOfBirth as any) === null) {
        return res.status(400).json({ message: "Date of birth cannot be cleared once set." });
      }

      const isArtist = existing.role === "artist" || existing.role === "both";
      if (isArtist) {
        if (!eff.dateOfBirth) {
          return res.status(400).json({ message: "Date of birth is required for artists.", field: "dateOfBirth" });
        }
        const age = ageInYears(eff.dateOfBirth as any);
        const minorEff = age !== null && age < 18;
        const parentReady = !!(eff.parentGuardianEmail && eff.parentPayoutMethod && eff.parentPayoutHandle && eff.parentTermsAcceptedAt);
        const ownReady = !!(eff.payoutMethod && eff.payoutHandle);

        if (minorEff) {
          // Minors must use the parent path. Reject their own handle outright
          // so a 16-year-old can't simply patch payoutHandle and bypass.
          if (eff.payoutMethod || eff.payoutHandle) {
            return res.status(400).json({ message: "Under-18 artists must route payouts through a parent or guardian.", field: "payoutMethod" });
          }
          if (!parentReady) {
            return res.status(400).json({
              message: "Parent or guardian email, payout method, handle, and accepted terms are all required for under-18 artists.",
              field: "parentPayoutHandle",
            });
          }
        } else {
          // Adults can clear the parent path only if their own handle is set.
          if (!ownReady && !parentReady) {
            return res.status(400).json({ message: "Provide a payout method and handle.", field: "payoutHandle" });
          }
          // If they ARE clearing the parent path, require own handle.
          const clearingParent = (input.parentPayoutHandle === null) || (input.parentPayoutMethod === null) || (input.parentGuardianEmail === null) || (input.parentTermsAccepted === false);
          if (clearingParent && !ownReady) {
            return res.status(400).json({ message: "Add your own payout method before removing the parent payout.", field: "payoutHandle" });
          }
        }
      }

      const user = await storage.updateUserPayoutSettings(userId, input);
      res.json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  // Lightweight payout-readiness probe used by the frontend (gallery submit
  // page, dashboard banner) so we don't have to recompute hasReadyPayout in
  // multiple places.
  app.get(api.users.payoutStatus.path, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const userId = (req.user as any).claims?.sub || (req.user as any).id;
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    const target = resolvePayoutTarget(user);
    const minor = isMinor(user);
    const age = ageInYears(user.dateOfBirth as any);
    res.json({
      ready: hasReadyPayout(user),
      isMinor: minor,
      method: target?.kind === "stripe" ? "stripe" : (target?.kind === "manual" ? target.method : null),
      handle: target?.kind === "manual" ? target.handle : null,
      forMinor: target?.kind === "manual" ? target.forMinor : false,
      // Show "you just turned 18, want your own payout?" prompt to artists who
      // currently route through a parent. The auth-route hook handles the
      // one-time email; this flag drives the dashboard banner.
      adultUpgradeAvailable: !!(age !== null && age >= 18 && user.parentTermsAcceptedAt && !user.payoutHandle),
    });
  });

  // Admin Pending Payouts queue (for non-Connect artists). Lists won bids
  // whose funds are sitting on the platform balance and awaits the admin
  // sending PayPal/Venmo/Zelle off-platform.
  app.get("/api/admin/payouts", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const adminId = (req.user as any).claims?.sub || (req.user as any).id;
    const admin = await storage.getUser(adminId);
    if (!admin || admin.role !== "admin") return res.status(403).json({ message: "Admin access required" });
    const status = (req.query.status as "pending" | "paid" | "skipped" | undefined);
    const rows = await storage.getPayouts(status ?? "pending");
    res.json(rows);
  });

  app.post("/api/admin/payouts/:id/mark-paid", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const adminId = (req.user as any).claims?.sub || (req.user as any).id;
    const admin = await storage.getUser(adminId);
    if (!admin || admin.role !== "admin") return res.status(403).json({ message: "Admin access required" });
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid payout id" });
    // mark-paid is only valid from "pending" — replays return 409 so we don't
    // overwrite the original paidAt/paidByAdminId stamps.
    const current = await storage.getPayout(id);
    if (!current) return res.status(404).json({ message: "Payout not found" });
    if (current.status !== "pending") {
      return res.status(409).json({ message: `Payout is already ${current.status}.` });
    }
    const notes = typeof req.body?.notes === "string" ? req.body.notes : undefined;
    const updated = await storage.markPayoutPaid(id, adminId, notes);
    if (!updated) return res.status(404).json({ message: "Payout not found" });
    res.json(updated);
  });

  // Ship-from address — artists set their origin address on the Dashboard so
  // we can quote live EasyPost rates for their artworks.
  app.patch("/api/users/me/ship-from", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const userId = (req.user as any).claims?.sub || (req.user as any).id;
    const schema = z.object({
      shipFromStreet: z.string().min(3),
      shipFromCity: z.string().min(2),
      shipFromState: z.string().length(2, "Use 2-letter state code, e.g. NY"),
      shipFromZip: z.string().min(5),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });
    const user = await storage.updateUserShipFrom(userId, parsed.data);
    res.json(user);
  });

  // Live shipping rate quotes via EasyPost. Called from the bidding UI before
  // Stripe Checkout is created so the buyer can pick carrier and speed.
  app.get("/api/shipping/rates", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const schema = z.object({
      artworkId: z.coerce.number(),
      toStreet: z.string().min(3),
      toCity: z.string().min(2),
      toState: z.string().length(2),
      toZip: z.string().min(5),
    });
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });
    const { artworkId, toStreet, toCity, toState, toZip } = parsed.data;

    const artwork = await storage.getArtwork(artworkId);
    if (!artwork) return res.status(404).json({ message: "Artwork not found" });

    const artist = await storage.getUser(artwork.artistId);
    if (!artist?.shipFromStreet || !artist?.shipFromCity || !artist?.shipFromState || !artist?.shipFromZip) {
      return res.status(422).json({ message: "Artist has not set up a shipping address yet. Shipping rates unavailable." });
    }

    const weightOz = (artwork as any).weightOz || 32;

    try {
      const rates = await getEasyPostRates({
        fromStreet: artist.shipFromStreet,
        fromCity: artist.shipFromCity,
        fromState: artist.shipFromState,
        fromZip: artist.shipFromZip,
        toStreet,
        toCity,
        toState,
        toZip,
        weightOz,
      });
      res.json(rates);
    } catch (err: any) {
      console.error("[easypost] rate fetch failed:", err.message);
      res.status(502).json({ message: err.message });
    }
  });

  // My Bids (user's bids)
  app.get("/api/my-bids", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const userId = (req.user as any).id || (req.user as any).claims?.sub;
    const bids = await storage.getBidsForUser(userId);
    res.json(bids);
  });

  // Portfolio Routes
  app.get(api.portfolio.list.path, async (req, res) => {
    const artistId = req.params.artistId as string;
    const items = await storage.getPortfolioItems(artistId);
    const enriched = items.map(item => {
      let expired = false;
      if (item.listedForSale && item.listedAt) {
        const expiresAt = new Date(item.listedAt).getTime() + 14 * 24 * 60 * 60 * 1000;
        expired = Date.now() > expiresAt;
      }
      return { ...item, expired };
    });
    res.json(enriched);
  });

  app.post(api.portfolio.create.path, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    try {
      const input = api.portfolio.create.input.parse(req.body);
      const item = await storage.createPortfolioItem(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.patch(api.portfolio.listForSale.path, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const id = Number(req.params.id);
    const item = await storage.getPortfolioItem(id);
    if (!item) return res.status(404).json({ message: "Portfolio item not found" });
    const currentUserId = (req.user as any).claims?.sub || (req.user as any).id;
    if (item.artistId !== currentUserId) return res.status(403).json({ message: "Not your portfolio item" });
    try {
      const { price } = api.portfolio.listForSale.input.parse(req.body);
      const updated = await storage.listPortfolioItemForSale(id, price);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.delete(api.portfolio.delete.path, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const id = Number(req.params.id);
    const item = await storage.getPortfolioItem(id);
    if (!item) return res.status(404).json({ message: "Portfolio item not found" });
    const currentUserId = (req.user as any).claims?.sub || (req.user as any).id;
    if (item.artistId !== currentUserId) return res.status(403).json({ message: "Not your portfolio item" });
    await storage.deletePortfolioItem(id);
    res.json({ message: "Portfolio item deleted" });
  });

  app.post(api.portfolio.convertToAuction.path, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const id = Number(req.params.id);
    const item = await storage.getPortfolioItem(id);
    if (!item) return res.status(404).json({ message: "Portfolio item not found" });
    const currentUserId = (req.user as any).claims?.sub || (req.user as any).id;
    if (item.artistId !== currentUserId) return res.status(403).json({ message: "Not your portfolio item" });
    if (item.listedForSale && item.listedAt) {
      const expiresAt = new Date(item.listedAt).getTime() + 14 * 24 * 60 * 60 * 1000;
      if (Date.now() > expiresAt) {
        return res.status(400).json({ message: "This listing has expired. Remove it and re-list or add a new portfolio item." });
      }
    }
    try {
      const { auctionDurationDays, charityId, charityNote, reviewType } = api.portfolio.convertToAuction.input.parse(req.body);
      const artwork = await storage.createArtwork({
        title: item.title,
        description: item.description || "",
        imageUrl: item.imageUrl,
        artistId: item.artistId,
        price: item.price || "0",
        auctionDurationDays,
        charityId,
        charityNote: charityNote ?? null,
        reviewType,
        dimensions: item.dimensions,
      });
      await storage.deletePortfolioItem(id);
      res.status(201).json(artwork);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  // ─── Stripe Connect (artist payout onboarding) ───────────────────────────
  app.get("/api/stripe/connect/status", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const userId = (req.user as any).id || (req.user as any).claims?.sub;
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Fetch live state from Stripe on every load and resync the cached flags.
    if (user.stripeAccountId) {
      try {
        const stripe = await getUncachableStripeClient();
        const account = await stripe.accounts.retrieve(user.stripeAccountId);
        const onboardingComplete = !!account.details_submitted;
        const payoutsEnabled = !!account.payouts_enabled;
        if (onboardingComplete !== !!user.stripeOnboardingComplete ||
            payoutsEnabled !== !!user.stripePayoutsEnabled) {
          await storage.updateUserStripeStatus(user.id, { onboardingComplete, payoutsEnabled });
        }
        return res.json({ hasAccount: true, onboardingComplete, payoutsEnabled });
      } catch (err) {
        console.error("Live Stripe status fetch failed, falling back to cached:", err);
      }
    }
    res.json({
      hasAccount: !!user.stripeAccountId,
      onboardingComplete: !!user.stripeOnboardingComplete,
      payoutsEnabled: !!user.stripePayoutsEnabled,
    });
  });

  app.post("/api/stripe/connect/onboard", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const userId = (req.user as any).id || (req.user as any).claims?.sub;
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role !== "artist" && user.role !== "both") {
      return res.status(403).json({ message: "Only artist accounts can connect for payouts." });
    }

    try {
      const stripe = await getUncachableStripeClient();
      let accountId = user.stripeAccountId;

      if (!accountId) {
        const account = await stripe.accounts.create({
          type: 'express',
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          email: user.email || undefined,
          metadata: { userId: user.id },
        });
        accountId = account.id;
        await storage.setUserStripeAccount(user.id, accountId);
      }

      const origin = getAppOrigin();
      const isLocalDev = origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1');
      if (!origin.startsWith('https://') && !isLocalDev) {
        return res.status(500).json({ message: "Could not determine a valid app URL for Stripe onboarding. Please contact support." });
      }

      const link = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${origin}/dashboard?stripe=refresh`,
        return_url: `${origin}/dashboard?stripe=return`,
        type: 'account_onboarding',
      });
      res.json({ url: link.url });
    } catch (err: any) {
      console.error("Stripe Connect onboarding failed:", err);
      // Detect platform profile incomplete error from Stripe
      const stripeCode = err?.code;
      const stripeMessage = err?.message || "";
      let userMessage = stripeMessage || "Failed to start onboarding";
      if (stripeCode === 'platform_api_key_expired' || stripeCode === 'api_key_expired') {
        userMessage = "Stripe API key has expired. Please update the Stripe connection.";
      } else if (stripeCode === 'account_invalid' || stripeMessage.includes('platform profile')) {
        userMessage = "Stripe Connect is not fully configured for this platform. The platform owner needs to complete the Stripe business profile and Connect settings in the Stripe Dashboard.";
      } else if (stripeCode === 'live_mode_not_enabled' || stripeMessage.includes('live mode')) {
        userMessage = "Stripe Connect is not yet enabled for live mode. The platform owner must activate the Stripe account and complete the business profile in the Stripe Dashboard.";
      }
      res.status(500).json({ message: userMessage, stripeCode: stripeCode || null });
    }
  });

  // Refresh status from Stripe — called when user returns from onboarding
  app.post("/api/stripe/connect/refresh-status", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const userId = (req.user as any).id || (req.user as any).claims?.sub;
    const user = await storage.getUser(userId);
    if (!user?.stripeAccountId) return res.status(400).json({ message: "No Stripe account" });

    try {
      const stripe = await getUncachableStripeClient();
      const account = await stripe.accounts.retrieve(user.stripeAccountId);
      const onboardingComplete = !!account.details_submitted;
      const payoutsEnabled = !!account.payouts_enabled;
      await storage.updateUserStripeStatus(user.id, { onboardingComplete, payoutsEnabled });
      res.json({ onboardingComplete, payoutsEnabled });
    } catch (err: any) {
      console.error("Stripe status refresh failed:", err);
      res.status(500).json({ message: err.message || "Failed to refresh status" });
    }
  });

  // Manual trigger to settle ended auctions (also runs on a 60s interval).
  // Admin-only — buyers/artists must never be able to trigger Stripe API churn.
  app.post("/api/auctions/settle", async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const userId = (req.user as any).id || (req.user as any).claims?.sub;
    const user = await storage.getUser(userId);
    if (user?.role !== "admin") return res.status(403).json({ message: "Admin only" });
    try {
      const { settleEndedAuctions } = await import("./auctionScheduler");
      const result = await settleEndedAuctions();
      res.json(result);
    } catch (err: any) {
      console.error("Auction settle failed:", err);
      res.status(500).json({ message: err.message });
    }
  });

  // ─── Admin: Sales-tax reporting ──────────────────────────────────────────
  // Returns aggregated tax collected (by state and month) for captured bids,
  // plus an optional CSV export. Used by the admin Tax Collected tab to back
  // marketplace-facilitator filings.
  async function requireAdmin(req: any, res: any): Promise<boolean> {
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated" });
      return false;
    }
    const userId = (req.user as any).id || (req.user as any).claims?.sub;
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      res.status(403).json({ message: "Admin only" });
      return false;
    }
    return true;
  }

  function parseTaxRange(req: any): { from?: Date; to?: Date } {
    const out: { from?: Date; to?: Date } = {};
    if (req.query.from) {
      const d = new Date(String(req.query.from));
      if (!isNaN(d.getTime())) out.from = d;
    }
    if (req.query.to) {
      const raw = String(req.query.to);
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        // Treat YYYY-MM-DD as inclusive end-of-day so same-day sales aren't
        // dropped from the report when the user picks today's date.
        if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
          d.setUTCHours(23, 59, 59, 999);
        }
        out.to = d;
      }
    }
    return out;
  }

  app.get("/api/admin/tax-report", async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    const range = parseTaxRange(req);
    try {
      const [summary, sales] = await Promise.all([
        storage.getTaxReportSummary(range),
        storage.getTaxReportSales(range),
      ]);
      const totals = sales.reduce(
        (acc, s) => {
          acc.taxableAmount += s.taxableAmount;
          acc.taxAmount += s.taxAmount;
          acc.saleCount += 1;
          return acc;
        },
        { taxableAmount: 0, taxAmount: 0, saleCount: 0 },
      );
      res.json({ summary, sales, totals });
    } catch (err: any) {
      console.error("Tax report failed:", err);
      res.status(500).json({ message: err.message || "Failed to load tax report" });
    }
  });

  app.get("/api/admin/tax-report.csv", async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    const range = parseTaxRange(req);
    try {
      const sales = await storage.getTaxReportSales(range);
      const header = [
        "captured_at",
        "bid_id",
        "artwork_id",
        "artwork_title",
        "bidder_id",
        "shipping_state",
        "shipping_city",
        "shipping_postal_code",
        "tax_jurisdiction",
        "taxable_amount",
        "tax_amount",
        "tax_rate_percent",
        "stripe_payment_intent_id",
        "stripe_tax_transaction_id",
      ];
      const escape = (v: unknown) => {
        const s = v == null ? "" : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const lines = [header.join(",")];
      for (const s of sales) {
        lines.push([
          s.capturedAt ? s.capturedAt.toISOString() : "",
          s.bidId,
          s.artworkId,
          s.artworkTitle,
          s.bidderId,
          s.shippingState,
          s.shippingCity,
          s.shippingPostalCode,
          s.taxJurisdiction,
          s.taxableAmount.toFixed(2),
          s.taxAmount.toFixed(2),
          s.taxRate.toFixed(4),
          s.stripePaymentIntentId || "",
          s.stripeTaxTransactionId || "",
        ].map(escape).join(","));
      }
      const filename = `brushbids-tax-${new Date().toISOString().slice(0, 10)}.csv`;
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(lines.join("\n"));
    } catch (err: any) {
      console.error("Tax CSV export failed:", err);
      res.status(500).json({ message: err.message || "Failed to export tax CSV" });
    }
  });

  // ─── Admin: Account-health email log ─────────────────────────────────────
  app.get("/api/admin/email-logs", async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    try {
      const logs = await storage.getEmailLogs(200);
      res.json(logs);
    } catch (err: any) {
      console.error("Email log fetch failed:", err);
      res.status(500).json({ message: err.message || "Failed to load email log" });
    }
  });

  // ─── Stripe Payment Routes ───────────────────────────────────────────────
  app.get("/api/stripe/publishable-key", async (req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Error getting Stripe publishable key:", error);
      res.status(500).json({ message: "Failed to get Stripe configuration" });
    }
  });

  // DEPRECATED: legacy "Pay Now after auction ends" flow. Bids are now
  // pre-authorized via the bid hold flow and captured automatically by the
  // scheduler when the auction ends, so this endpoint is permanently disabled
  // to avoid double-charging or bypassing the hold/capture model.
  app.post("/api/checkout/artwork/:artworkId", (_req, res) => {
    res.status(410).json({
      message: "This payment flow has been replaced. Winning bids are now charged automatically when the auction ends.",
    });
  });

  // Get payment status for an artwork
  app.get("/api/artwork/:artworkId/payment-status", async (req, res) => {
    const artworkId = Number(req.params.artworkId);
    const artwork = await storage.getArtwork(artworkId);
    
    if (!artwork) {
      return res.status(404).json({ message: "Artwork not found" });
    }

    res.json({
      isPaid: !!artwork.paidAt,
      paidAt: artwork.paidAt,
      paidBy: artwork.paidBy,
    });
  });

  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain").send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Disallow: /dashboard

Sitemap: https://brushbids.com/sitemap.xml
`);
  });

  app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.setHeader("X-Robots-Tag", "index, follow");
    next();
  });

  app.get("/sitemap.xml", async (_req, res) => {
    const approvedArtworks = await storage.getArtworks("approved");
    const staticPages = [
      { url: "/", priority: "1.0", changefreq: "daily" },
      { url: "/gallery", priority: "0.9", changefreq: "daily" },
      { url: "/about", priority: "0.8", changefreq: "monthly" },
      { url: "/faq", priority: "0.6", changefreq: "monthly" },
      { url: "/contact", priority: "0.6", changefreq: "monthly" },
      { url: "/terms", priority: "0.4", changefreq: "yearly" },
    ];

    const artworkPages = approvedArtworks.map(a => ({
      url: `/artwork/${a.id}`,
      priority: "0.7",
      changefreq: "weekly",
    }));

    const allPages = [...staticPages, ...artworkPages];
    const baseUrl = "https://brushbids.com";

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(p => `  <url>
    <loc>${baseUrl}${p.url}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

    res.type("application/xml").send(xml);
  });

  return httpServer;
}
