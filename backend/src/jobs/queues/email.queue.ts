import { Queue } from "bullmq";
import { redis } from "../../config/redis";

// Initialize the queue and pass the shared Redis connection
export const emailQueue = new Queue("email-queue", {
  connection: redis as any
});
