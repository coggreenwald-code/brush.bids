import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { storage } from "../../storage";
import { ageInYears } from "@shared/payoutHelpers";
import { sendAdultUpgradeEmail } from "../../emailService";

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await authStorage.getUser(userId);
      // Adult-upgrade hook: the first time an artist logs in after crossing
      // their 18th birthday — and they originally onboarded as a minor with
      // a parent payout target — send a one-time prompt email and stamp
      // adultUpgradeNotifiedAt so we don't re-send.
      if (user && user.dateOfBirth && user.parentTermsAcceptedAt && !user.adultUpgradeNotifiedAt) {
        const age = ageInYears(user.dateOfBirth as any);
        if (age !== null && age >= 18) {
          await storage.markAdultUpgradeNotified(user.id);
          sendAdultUpgradeEmail({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          }).catch(err => console.error("[auth] adult-upgrade email failed:", err));
        }
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}
