import { Queue } from "bullmq";
import { redis } from "../../config/redis";
import { DoctorVerificationJobData } from "../../types/index";

export const doctorVerificationQueue = new Queue<DoctorVerificationJobData>("doctor-verification", {
  connection: redis as any,

  defaultJobOptions: {
    attempts: 3,

    backoff: {
      type: "exponential",
      delay: 3000,
    },

    removeOnComplete: 100,
    removeOnFail: 50,
  },
});
