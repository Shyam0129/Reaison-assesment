import { z } from "zod";

export const searchAgentsSchema = z.object({
  query: z.object({
    lat: z.coerce.number().min(-90).max(90, "Latitude must be between -90 and 90"),
    lng: z.coerce.number().min(-180).max(180, "Longitude must be between -180 and 180"),
    radius: z.coerce.number().min(0.1).max(5000, "Radius must be between 0.1 and 5000 km"),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(500).default(20),
  }),
});

export const agentIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid agent ID format"),
  }),
});

export const addReviewSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid agent ID format"),
  }),
  body: z.object({
    rating: z.number().int().min(1).max(5, "Rating must be between 1 and 5"),
    comment: z.string().min(1).max(1000, "Comment must be under 1000 characters").trim(),
  }),
});

export const getReviewsSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid agent ID format"),
  }),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

// Inferred types from schemas
export type SearchAgentsQuery = z.infer<typeof searchAgentsSchema>["query"];
export type AddReviewBody = z.infer<typeof addReviewSchema>["body"];
export type GetReviewsQuery = z.infer<typeof getReviewsSchema>["query"];
