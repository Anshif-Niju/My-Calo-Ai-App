import { Redis } from "ioredis";
import { env } from "./env";

export const redis = new Redis(env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

redis.on("connect", () => {
  console.log("Redis connected successfully");
});

redis.on("error", (error) => {
  console.error(" Redis connection error:", error);
});
