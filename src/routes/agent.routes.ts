import { Router } from "express";
import { agentController } from "../controllers/agent.controller";
import { asyncHandler } from "../middleware/error.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  searchAgentsSchema,
  agentIdSchema,
  addReviewSchema,
  getReviewsSchema,
} from "../validators/agent.validators";

const router = Router();

// GET /agents/search?lat=&lng=&radius=&page=&limit=
router.get(
  "/search",
  validate(searchAgentsSchema),
  asyncHandler(agentController.searchAgents)
);

// GET /agents/:id
router.get(
  "/:id",
  validate(agentIdSchema),
  asyncHandler(agentController.getAgentById)
);

// POST /agents/:id/reviews
router.post(
  "/:id/reviews",
  validate(addReviewSchema),
  asyncHandler(agentController.addReview)
);

// GET /agents/:id/reviews?page=&limit=
router.get(
  "/:id/reviews",
  validate(getReviewsSchema),
  asyncHandler(agentController.getReviews)
);

export default router;
