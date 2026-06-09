import { Queue } from "bullmq";
import { redis } from "../../config/redis";

export const emailNotificationQueue = new Queue("email-notification", {
  connection: redis as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});
