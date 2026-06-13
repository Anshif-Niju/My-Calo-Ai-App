import { Queue } from "bullmq";
import { redis } from "../../config/redis";

export const foodScanQueue = new Queue("food-scan", {
  connection: redis as any,
  defaultJobOptions: {
    attempts: 1,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});
