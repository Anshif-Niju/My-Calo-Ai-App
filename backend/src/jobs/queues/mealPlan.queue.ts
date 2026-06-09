import { Queue } from "bullmq";
import { redis } from "../../config/redis";

export const mealPlanQueue = new Queue("meal-plan", {
  connection: redis as any,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "fixed", delay: 3000 },
    removeOnComplete: 50,
    removeOnFail: 25,
  },
});
