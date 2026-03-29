import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { rateLimiter } from "./middleware/rateLimit.middleware";
import { errorHandler } from "./middleware/error.middleware";
import agentRoutes from "./routes/agent.routes";

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors({ origin: env.corsOrigin, credentials: true }));

// Body parsing
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Global rate limiter
app.use(rateLimiter);

// Health check — for Docker healthcheck and load balancer probes
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api/v1/agents", agentRoutes);

// 404 handler for unknown routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler — must be registered LAST
app.use(errorHandler);

export default app;
