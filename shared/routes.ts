import { z } from 'zod';
import { insertArtworkSchema, insertBidSchema, artworks, bids, users, charities } from './schema';

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
    }
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
      responses: {
        201: z.custom<typeof bids.$inferSelect>(),
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
  }
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
