import app from "./app";
import { env } from "./config/env";
import { connectRedis, disconnectRedis } from "./config/redis";
import { prisma } from "./config/prisma";
import { logger } from "./utils/logger";

async function bootstrap(): Promise<void> {
  await connectRedis();
  logger.info("Redis connected successfully");

  const server = app.listen(env.port, () => {
    logger.info(`Server running on port ${env.port} [${env.nodeEnv}]`);
  });

  // Graceful shutdown — closes connections cleanly on SIGTERM/SIGINT
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      await disconnectRedis();
      logger.info("Server closed. Exiting.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  process.on("unhandledRejection", (reason) => {
    logger.fatal({ reason }, "Unhandled promise rejection");
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  logger.fatal({ err }, "Failed to start server");
  process.exit(1);
});
