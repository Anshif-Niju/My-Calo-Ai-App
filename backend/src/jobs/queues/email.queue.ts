import { Queue } from "bullmq";
import { redis } from "../../config/redis";
import { EmailJobData } from "../../types/index";

export const emailQueue = new Queue<EmailJobData>("emailQueue", {
  connection: redis as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 3000,
    },
    removeOnComplete: true,
    removeOnFail: 100, 
  },
});
