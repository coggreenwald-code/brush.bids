import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import OpenAI from "openai";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
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
    
    if (status === "approved" && !artistId) {
      const artworks = await storage.getApprovedArtworksSortedByPromotion();
      return res.json(artworks);
    }
    
    const artworks = await storage.getArtworks(status, artistId);
    res.json(artworks);
  });

  app.get(api.artworks.get.path, async (req, res) => {
    const artwork = await storage.getArtwork(Number(req.params.id));
    if (!artwork) {
      return res.status(404).json({ message: "Artwork not found" });
    }
    res.json(artwork);
  });

  app.post(api.artworks.create.path, async (req, res) => {
    try {
      const input = api.artworks.create.input.parse(req.body);
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

  // Bids
  app.get(api.bids.list.path, async (req, res) => {
    const bids = await storage.getBidsForArtwork(Number(req.params.artworkId));
    res.json(bids);
  });

  app.post(api.bids.create.path, async (req, res) => {
    try {
      const input = api.bids.create.input.parse(req.body);
      const bid = await storage.createBid(input);
      res.status(201).json(bid);
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

  // Stripe Payment Routes
  app.get("/api/stripe/publishable-key", async (req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Error getting Stripe publishable key:", error);
      res.status(500).json({ message: "Failed to get Stripe configuration" });
    }
  });

  app.post("/api/checkout/artwork/:artworkId", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const artworkId = Number(req.params.artworkId);
      const artwork = await storage.getArtwork(artworkId);
      
      if (!artwork) {
        return res.status(404).json({ message: "Artwork not found" });
      }

      // Check if already paid
      if (artwork.paidAt) {
        return res.status(400).json({ message: "This artwork has already been paid for" });
      }

      // Allow re-checkout if previous session didn't complete (no paidAt means not paid)
      // This handles abandoned checkouts

      // Check if auction has ended (createdAt + 7 days)
      const auctionEndDate = new Date(artwork.createdAt || new Date());
      auctionEndDate.setDate(auctionEndDate.getDate() + 7);
      if (auctionEndDate > new Date()) {
        return res.status(400).json({ message: "Auction has not ended yet" });
      }

      // Get bids ordered by amount descending (highest first)
      const bids = await storage.getBidsForArtwork(artworkId);
      if (bids.length === 0) {
        return res.status(400).json({ message: "No bids found for this artwork" });
      }

      // bids[0] is the highest bid (ordered by amount desc in storage)
      const highestBid = bids[0];
      if (highestBid.bidderId !== (req.user as any).id) {
        return res.status(403).json({ message: "Only the winning bidder can purchase" });
      }

      const stripe = await getUncachableStripeClient();
      const amount = Number(highestBid.amount);

      const promotionPercentage = artwork.promotionPercentage || 0;
      const promotionFee = amount * (promotionPercentage / 100);
      const baseArtistShare = amount * 0.75;
      const artistShare = baseArtistShare - promotionFee;
      const platformShare = amount * 0.15 + promotionFee;
      const charityShare = amount * 0.10;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: artwork.title,
              description: `Artwork by ${artwork.artistId} - Winning bid`,
              images: artwork.imageUrl ? [artwork.imageUrl] : [],
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${req.protocol}://${req.get('host')}/my-bids?payment=success&artwork=${artworkId}`,
        cancel_url: `${req.protocol}://${req.get('host')}/my-bids?payment=cancelled`,
        metadata: {
          artworkId: artworkId.toString(),
          bidderId: (req.user as any).id,
          artistId: artwork.artistId,
          charityId: artwork.charityId?.toString() || '',
          totalAmount: amount.toString(),
          artistShare: artistShare.toFixed(2),
          platformShare: platformShare.toFixed(2),
          charityShare: charityShare.toFixed(2),
          promotionPercentage: promotionPercentage.toString(),
          promotionFee: promotionFee.toFixed(2),
        },
      });

      // Store session ID and expected payer for tracking (payment confirmation comes via webhook)
      await storage.setArtworkCheckoutSession(artworkId, session.id, (req.user as any).id);
      
      res.json({ url: session.url });
    } catch (error) {
      console.error("Checkout error:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
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

  return httpServer;
}
