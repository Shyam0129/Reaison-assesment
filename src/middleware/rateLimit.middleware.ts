import rateLimit from "express-rate-limit";
import { env } from "../config/env";
import { sendError } from "../utils/response";
import { Request, Response } from "express";

export const rateLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    sendError(res, "Too many requests, please try again later.", 429);
  },
});
