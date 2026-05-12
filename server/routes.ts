import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import OpenAI from "openai";
import { getUncachableStripeClient, getStripePublishableKey, getAppOrigin } from "./stripeClient";
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
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
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
      // Stripe card-authorization holds expire after 7 days, so we refuse any
      // NEW listing whose duration would outlive the hold. Existing legacy
      // 14/30-day artworks are unaffected (they were created before this gate).
      if ((input.auctionDurationDays ?? 7) > 7) {
        return res.status(400).json({
          message: "Auction duration cannot exceed 7 days.",
          field: "auctionDurationDays",
        });
      }
      // Server-side payout-readiness gate: a listing can't go live unless the
      // artist has finished Connect onboarding AND payouts are enabled, otherwise
      // we'd accept bid holds we couldn't actually pay out on.
      const artist = await storage.getUser(userId);
      if (!artist?.stripeAccountId || !artist.stripeOnboardingComplete || !artist.stripePayoutsEnabled) {
        return res.status(403).json({
          message: "Please finish Stripe payout setup on your Dashboard before submitting artwork.",
        });
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

  // Bids — creates a Stripe Checkout Session that places a CARD AUTHORIZATION HOLD.
  // The bid is recorded immediately as `pending`; the webhook flips it to `authorized` once
  // Stripe confirms the hold. Auction end auto-captures the winning hold and releases losers.
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

      // Highest active (authorized) bid sets the floor — we ignore canceled/failed/pending holds
      const existingBids = await storage.getAuthorizedBidsForArtwork(input.artworkId);
      const currentHighest = existingBids.length > 0
        ? Math.max(...existingBids.map(b => Number(b.amount)))
        : Number(artwork.price);
      if (Number(input.amount) <= currentHighest) {
        return res.status(400).json({ message: `Bid must be higher than the current price of $${currentHighest}` });
      }

      // Verify the artist has finished Stripe Connect onboarding AND that
      // payouts are currently enabled — Stripe can temporarily disable
      // payouts (e.g., needs more verification) on an otherwise-onboarded
      // account, and we shouldn't accept holds we can't pay out on.
      const artist = await storage.getUser(artwork.artistId);
      if (!artist?.stripeAccountId || !artist.stripeOnboardingComplete || !artist.stripePayoutsEnabled) {
        return res.status(400).json({
          message: "This artist has not completed payout setup yet. Please try again later.",
        });
      }

      const stripe = await getUncachableStripeClient();
      const amountCents = Math.round(Number(input.amount) * 100);
      // Base split: 75% artist / 20% platform / 5% charity (charity paid manually
      // from the platform's 25% pool). With a Boost, the artist gives up
      // `promotionPercentage` to the platform, so the application fee grows by
      // that amount. We clamp to keep the artist share non-negative.
      const boostPct = Math.max(0, Math.min(75, artwork.promotionPercentage || 0));
      const appFeePct = 0.25 + boostPct / 100;
      const appFeeCents = Math.min(amountCents, Math.round(amountCents * appFeePct));

      const origin = getAppOrigin();
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: (req.user as any).email || undefined,
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Bid hold: ${artwork.title}`,
              description: `Card authorization for your bid on "${artwork.title}". Your card will only be charged if you win the auction.`,
              images: artwork.imageUrl ? [artwork.imageUrl] : [],
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        }],
        payment_intent_data: {
          capture_method: 'manual',
          application_fee_amount: appFeeCents,
          transfer_data: { destination: artist.stripeAccountId },
          metadata: {
            kind: 'bid_hold',
            artworkId: String(artwork.id),
            bidderId,
            bidAmount: String(input.amount),
          },
        },
        metadata: {
          kind: 'bid_hold',
          artworkId: String(artwork.id),
          bidderId,
        },
        // Bound the Checkout session lifetime so a bidder can't sit on the
        // page forever and complete payment after the auction ends.
        // Target = min(auctionEnd, now + 24h [Stripe's max]); clamp to Stripe's
        // 30-minute minimum. Webhook revalidation is the real safety net, but
        // this gives Stripe an accurate hint and short-auction sessions die
        // close to (or right at) the deadline.
        expires_at: Math.max(
          Math.floor(Date.now() / 1000) + 30 * 60,
          Math.floor(Math.min(auctionEndTime.getTime(), Date.now() + 24 * 60 * 60 * 1000) / 1000),
        ),
        success_url: `${origin}/artwork/${artwork.id}?bid=success&amount=${input.amount}`,
        cancel_url: `${origin}/artwork/${artwork.id}?bid=cancelled`,
      });

      // The bid row itself is NOT inserted here — we record it only after the
      // Stripe webhook confirms the card authorization. All the data we need
      // to do that insert (artworkId, bidderId, amount) lives in the checkout
      // session metadata, which Stripe propagates to the PaymentIntent too.
      // This way an abandoned checkout never leaves a phantom bid row behind.

      res.status(200).json({
        artworkId: input.artworkId,
        amount: input.amount,
        checkoutUrl: session.url,
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      console.error("Bid hold creation failed:", err);
      res.status(500).json({ message: err.message || "Failed to create bid hold" });
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

  app.post(api.artworks.upload.path, (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    next();
  }, upload.single("image"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  });

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
      const { role, firstName, lastName } = api.users.completeOnboarding.input.parse(req.body);
      const user = await storage.completeOnboarding(userId, role, firstName, lastName);
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

  // My Bids (user's bids)
  app.get("/api/my-bids", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const bids = await storage.getBidsForUser((req.user as any).id);
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
      const { auctionDurationDays, charityId, reviewType } = api.portfolio.convertToAuction.input.parse(req.body);
      // Same payout-readiness gate as POST /api/artworks: a portfolio item
      // can't be converted into a live auction unless the artist has finished
      // Stripe Connect onboarding AND payouts are enabled — we'd otherwise be
      // accepting card-authorization holds with no way to actually pay out.
      const artist = await storage.getUser(currentUserId);
      if (!artist?.stripeAccountId || !artist.stripeOnboardingComplete || !artist.stripePayoutsEnabled) {
        return res.status(403).json({
          message: "Please finish Stripe payout setup on your Dashboard before listing this artwork.",
        });
      }
      const artwork = await storage.createArtwork({
        title: item.title,
        description: item.description || "",
        imageUrl: item.imageUrl,
        artistId: item.artistId,
        price: item.price || "0",
        auctionDurationDays,
        charityId,
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

    // If the artist has a Connect account, fetch the live state from Stripe on
    // every dashboard load so the UI never shows stale onboarding/payout flags
    // (we still keep the DB cache in sync for places that don't need a live read).
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
        // Fall through to cached values below
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

    try {
      const stripe = await getUncachableStripeClient();
      let accountId = user.stripeAccountId;

      if (!accountId) {
        const account = await stripe.accounts.create({
          type: 'standard',
          email: user.email || undefined,
          metadata: { userId: user.id },
        });
        accountId = account.id;
        await storage.setUserStripeAccount(user.id, accountId);
      }

      const origin = getAppOrigin();
      const link = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${origin}/dashboard?stripe=refresh`,
        return_url: `${origin}/dashboard?stripe=return`,
        type: 'account_onboarding',
      });
      res.json({ url: link.url });
    } catch (err: any) {
      console.error("Stripe Connect onboarding failed:", err);
      res.status(500).json({ message: err.message || "Failed to start onboarding" });
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
