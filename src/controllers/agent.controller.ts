import { Request, Response } from "express";
import { agentService } from "../services/agent.service";
import { reviewService } from "../services/review.service";
import { sendSuccess, sendPaginated } from "../utils/response";
import { SearchAgentsQuery, AddReviewBody, GetReviewsQuery } from "../validators/agent.validators";

export const agentController = {
  searchAgents: async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as SearchAgentsQuery;
    const result = await agentService.searchNearby(query);
    sendPaginated(res, result);
  },

  getAgentById: async (req: Request, res: Response): Promise<void> => {
    // req.params is Record<string, string> — id is always a string here
    const agent = await agentService.getById(req.params["id"] as string);
    sendSuccess(res, agent);
  },

  addReview: async (req: Request, res: Response): Promise<void> => {
    const review = await reviewService.addReview(req.params["id"] as string, req.body as AddReviewBody);
    sendSuccess(res, review, 201);
  },

  getReviews: async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as GetReviewsQuery;
    const result = await reviewService.getReviews(req.params["id"] as string, query);
    sendPaginated(res, result);
  },
};
