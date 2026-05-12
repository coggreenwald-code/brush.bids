import { z } from 'zod';
import { insertArtworkSchema, insertBidSchema, insertPortfolioItemSchema, artworks, bids, users, charities, portfolioItems } from './schema';

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
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        403: z.object({ message: z.string() }),
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
        auctionDurationDays: z.coerce.number().min(1).max(7).default(7),
        charityId: z.coerce.number().optional(),
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
