import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import { sendError } from "../utils/response";
import { logger } from "../utils/logger";

// Centralized error handler — must be the LAST middleware registered in Express
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction // required 4th arg for Express to treat this as error middleware
): void {
  if (err instanceof AppError && err.isOperational) {
    // Known operational error — safe to expose to client
    sendError(res, err.message, err.statusCode);
    return;
  }

  // Unknown/programming error — log it and send a generic message
  logger.error({ err, req: { method: req.method, url: req.url } }, "Unhandled error");
  sendError(res, "Internal server error", 500);
}

// Wraps async route handlers to forward errors to the error handler
// Avoids try/catch boilerplate in every controller
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
