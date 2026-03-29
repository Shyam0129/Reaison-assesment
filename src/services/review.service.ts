import xss from "xss";
import { prisma } from "../config/prisma";
import { NotFoundError } from "../utils/errors";
import { PaginatedResponse } from "../types/api.types";
import { AddReviewBody, GetReviewsQuery } from "../validators/agent.validators";
import type { Review } from "../types/models.types";

export class ReviewService {
  /**
   * Adds a review for an agent.
   * Uses a transaction to ensure the review insert and rating recalculation are atomic.
   */
  async addReview(agentId: string, body: AddReviewBody): Promise<Review> {
    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent || !agent.isActive) {
      throw new NotFoundError(`Agent with ID ${agentId} not found`);
    }

    // Sanitize comment to prevent XSS if ever rendered in a UI
    const sanitizedComment = xss(body.comment);

    const review = await prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: { agentId, rating: body.rating, comment: sanitizedComment },
      });

      // Recalculate aggregate stats inside the transaction for atomicity
      const { _avg, _count } = await tx.review.aggregate({
        where: { agentId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      // Denormalize avg_rating and total_reviews on the agent row to avoid
      // expensive JOIN + aggregate on every read
      await tx.agent.update({
        where: { id: agentId },
        data: {
          avgRating: _avg.rating ?? 0,
          totalReviews: _count.rating,
        },
      });

      return newReview;
    });

    return review as Review;
  }

  /**
   * Returns paginated reviews for an agent, newest first.
   */
  async getReviews(agentId: string, query: GetReviewsQuery): Promise<PaginatedResponse<Review>> {
    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent || !agent.isActive) {
      throw new NotFoundError(`Agent with ID ${agentId} not found`);
    }

    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [items, total] = await prisma.$transaction([
      prisma.review.findMany({
        where: { agentId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { agentId } }),
    ]);

    return {
      items: items as Review[],
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}

export const reviewService = new ReviewService();
