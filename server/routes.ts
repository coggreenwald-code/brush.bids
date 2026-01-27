import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import OpenAI from "openai";

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
    const { status, feedback } = req.body;
    const artwork = await storage.updateArtworkStatus(Number(req.params.id), status, feedback);
    res.json(artwork);
  });

  // AI Review Endpoint
  app.post(api.artworks.aiReview.path, async (req, res) => {
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

  // My Bids (user's bids)
  app.get("/api/my-bids", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const bids = await storage.getBidsForUser(req.user.id);
    res.json(bids);
  });

  return httpServer;
}
