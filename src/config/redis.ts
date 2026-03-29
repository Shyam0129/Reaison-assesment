import { createClient } from "redis";
import { env } from "./env";
import { logger } from "../utils/logger";

const client = createClient({ url: env.redisUrl });

client.on("error", (err) => logger.error({ err }, "Redis client error"));
client.on("connect", () => logger.info("Redis connected"));
client.on("reconnecting", () => logger.warn("Redis reconnecting..."));

export async function connectRedis(): Promise<void> {
  if (!client.isOpen) await client.connect();
}

export async function disconnectRedis(): Promise<void> {
  if (client.isOpen) await client.disconnect();
}

// Typed wrappers around the redis client for safe usage
export const cache = {
  get: async <T>(key: string): Promise<T | null> => {
    const data = await client.get(key);
    return data ? (JSON.parse(data) as T) : null;
  },

  set: async (key: string, value: unknown, ttlSeconds: number): Promise<void> => {
    await client.setEx(key, ttlSeconds, JSON.stringify(value));
  },

  del: async (key: string): Promise<void> => {
    await client.del(key);
  },
};
