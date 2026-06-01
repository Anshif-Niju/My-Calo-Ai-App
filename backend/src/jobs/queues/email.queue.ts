import { Queue } from "bullmq";
import { redis } from "../../config/redis";


export interface EmailJobData {
  type: "verify_email" | "forgot_password" | "login_success";
  to: string;
  subject: string;
  otp?: string; // optional — login_success email has no OTP
}

export const emailQueue = new Queue<EmailJobData>("emailQueue", {
  connection: redis as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000, // first retry after 5s, then 10s, then 20s
    },
    removeOnComplete: true,  // don't pile up completed jobs in Redis
    removeOnFail: 100,       // keep last 100 failed jobs for debugging
  },
});
