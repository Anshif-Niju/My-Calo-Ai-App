import { Redis } from "ioredis";
import dotenv from "dotenv";

dotenv.config();

// We create a singleton instance of Redis.
// BullMQ requires maxRetriesPerRequest to be null to handle blocking operations safely.
export const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

redis.on("connect", () => {
  console.log("Redis connected successfully");
});

redis.on("error", (error) => {
  console.error(" Redis connection error:", error);
});
