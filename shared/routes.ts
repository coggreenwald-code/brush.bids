import { z } from 'zod';
import { insertArtworkSchema, insertBidSchema, insertPortfolioItemSchema, artworks, bids, users, charities, portfolioItems, payouts } from './schema';

// Hybrid-payout reusable schemas. Re-used by completeOnboarding (initial sign-
// up) and the dedicated PATCH endpoint (later edits from the dashboard).
const payoutMethodValues = ["paypal", "venmo", "zelle"] as const;
// Strict calendar validation: reject regex-valid but impossible dates like
// 2026-99-99 so an attacker can't bypass minor checks by sending garbage that
// makes ageInYears() return null.
const dateOfBirthSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").refine((s) => {
  const [y, m, d] = s.split("-").map(Number);
  if (y < 1900 || y > 2100) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
    && dt.getTime() <= Date.now();
}, "Enter a valid date of birth.");
export const payoutSettingsInputSchema = z.object({
  // YYYY-MM-DD; required so we can compute minor status reliably.
  dateOfBirth: dateOfBirthSchema.optional(),
  payoutMethod: z.enum(payoutMethodValues).nullable().optional(),
  payoutHandle: z.string().min(1).max(120).nullable().optional(),
  parentGuardianEmail: z.string().email().nullable().optional(),
  parentPayoutMethod: z.enum(payoutMethodValues).nullable().optional(),
  parentPayoutHandle: z.string().min(1).max(120).nullable().optional(),
  parentTermsAccepted: z.boolean().optional(),
});

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  // Artworks
  artworks: {
    list: {
      method: 'GET' as const,
      path: '/api/artworks',
      input: z.object({
        status: z.enum(['pending', 'approved', 'rejected']).optional(),
        artistId: z.coerce.number().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof artworks.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/artworks/:id',
      responses: {
        200: z.custom<typeof artworks.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/artworks',
      input: insertArtworkSchema,
      responses: {
        201: z.custom<typeof artworks.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/artworks/:id/status',
      input: z.object({
        status: z.enum(['approved', 'rejected']),
        feedback: z.string().optional(),
      }),
      responses: {
        200: z.custom<typeof artworks.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    aiReview: {
      method: 'POST' as const,
      path: '/api/artworks/:id/ai-review',
      responses: {
        200: z.object({ score: z.number(), feedback: z.string() }),
        404: errorSchemas.notFound,
      },
    },
    updateFeedback: {
      method: 'PATCH' as const,
      path: '/api/artworks/:id/feedback',
      input: z.object({
        feedback: z.string(),
      }),
      responses: {
        200: z.custom<typeof artworks.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    updatePromotion: {
      method: 'PATCH' as const,
      path: '/api/artworks/:id/promotion',
      input: z.object({
        promotionPercentage: z.number().min(0).max(70),
      }),
      responses: {
        200: z.custom<typeof artworks.$inferSelect>(),
        404: errorSchemas.notFound,
        403: z.object({ message: z.string() }),
      },
    },
    generateDescription: {
      method: 'POST' as const,
      path: '/api/artworks/generate-description',
      input: z.object({
        title: z.string(),
        medium: z.string().optional(),
      }),
      responses: {
        200: z.object({ description: z.string() }),
        400: errorSchemas.validation,
      },
    },
    upload: {
      method: 'POST' as const,
      path: '/api/artworks/upload-image',
      responses: {
        200: z.object({ imageUrl: z.string() }),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/artworks/:id',
      responses: {
        200: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
        404: errorSchemas.notFound,
      },
    },
  },
  // Users/Artists
  users: {
    get: {
      method: 'GET' as const,
      path: '/api/users/:id',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    updateBio: {
      method: 'PATCH' as const,
      path: '/api/users/:id/bio',
      input: z.object({
        bio: z.string().max(500),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        403: z.object({ message: z.string() }),
      },
    },
    updateRole: {
      method: 'PATCH' as const,
      path: '/api/users/:id/role',
      input: z.object({
        role: z.enum(["artist", "buyer", "both"]),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        403: z.object({ message: z.string() }),
      },
    },
    completeOnboarding: {
      method: 'POST' as const,
      path: '/api/users/:id/complete-onboarding',
      input: z.object({
        role: z.enum(["artist", "buyer", "both"]),
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
      }).merge(payoutSettingsInputSchema),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        403: z.object({ message: z.string() }),
      },
    },
    updatePayoutSettings: {
      method: 'PATCH' as const,
      path: '/api/users/:id/payout-settings',
      input: payoutSettingsInputSchema,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
        403: z.object({ message: z.string() }),
      },
    },
    payoutStatus: {
      method: 'GET' as const,
      path: '/api/users/me/payout-status',
      responses: {
        200: z.object({
          ready: z.boolean(),
          isMinor: z.boolean(),
          method: z.enum(["stripe", "paypal", "venmo", "zelle"]).nullable(),
          handle: z.string().nullable(),
          forMinor: z.boolean(),
          adultUpgradeAvailable: z.boolean(),
        }),
      },
    },
    updateName: {
      method: 'PATCH' as const,
      path: '/api/users/:id/name',
      input: z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        403: z.object({ message: z.string() }),
      },
    },
    updateProfileImage: {
      method: 'PATCH' as const,
      path: '/api/users/:id/profile-image',
      input: z.object({
        profileImageUrl: z.string().refine(
          (val) => val.startsWith("/uploads/") || val.startsWith("initial:#"),
          { message: "Invalid profile image URL" }
        ),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        403: z.object({ message: z.string() }),
      },
    },
  },
  // Bids
  bids: {
    list: {
      method: 'GET' as const,
      path: '/api/artworks/:artworkId/bids',
      responses: {
        200: z.array(z.custom<typeof bids.$inferSelect & { bidder: typeof users.$inferSelect }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/bids',
      input: insertBidSchema,
      // The bid row is NOT created synchronously — we return a Stripe Checkout
      // URL so the bidder can authorize a card hold; the bid row itself is
      // inserted by the webhook once Stripe confirms the authorization.
      responses: {
        200: z.object({
          checkoutUrl: z.string().url(),
          artworkId: z.number(),
          amount: z.string(),
        }),
        400: errorSchemas.validation,
      },
    },
  },
  // Charities
  charities: {
    list: {
      method: 'GET' as const,
      path: '/api/charities',
      responses: {
        200: z.array(z.custom<typeof charities.$inferSelect>()),
      },
    },
  },
  // Portfolio
  portfolio: {
    list: {
      method: 'GET' as const,
      path: '/api/portfolio/:artistId',
      responses: {
        200: z.array(z.custom<typeof portfolioItems.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/portfolio',
      input: insertPortfolioItemSchema,
      responses: {
        201: z.custom<typeof portfolioItems.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    listForSale: {
      method: 'PATCH' as const,
      path: '/api/portfolio/:id/list-for-sale',
      input: z.object({
        price: z.coerce.number().min(1, "Price must be positive"),
      }),
      responses: {
        200: z.custom<typeof portfolioItems.$inferSelect>(),
        404: errorSchemas.notFound,
        403: z.object({ message: z.string() }),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/portfolio/:id',
      responses: {
        200: z.object({ message: z.string() }),
        404: errorSchemas.notFound,
        403: z.object({ message: z.string() }),
      },
    },
    convertToAuction: {
      method: 'POST' as const,
      path: '/api/portfolio/:id/convert-to-auction',
      input: z.object({
        auctionDurationDays: z.coerce.number().refine(v => [1, 3, 5, 7].includes(v), { message: "Auction duration must be 1, 3, 5, or 7 days" }).default(7),
        charityId: z.coerce.number().optional(),
        charityNote: z.string().min(1).max(200).optional(),
        reviewType: z.enum(["ai_instant", "human_curator"]).default("ai_instant"),
      }),
      responses: {
        201: z.custom<typeof artworks.$inferSelect>(),
        404: errorSchemas.notFound,
        403: z.object({ message: z.string() }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
