import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { sendError } from "../utils/response";

// Generic Zod validation middleware factory
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      params: req.params,
      query: req.query,
      body: req.body,
    });

    if (!result.success) {
      // Zod 4 uses .issues (was .errors in v3)
      const message = result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ");
      sendError(res, message, 400);
      return;
    }

    // Express 5: req.query is a read-only getter — must mutate in-place, not reassign
    const data = result.data as any;
    if (data.params) Object.assign(req.params, data.params);
    if (data.query) Object.assign(req.query, data.query);
    if (data.body) req.body = { ...req.body, ...data.body };

    next();
  };
}
