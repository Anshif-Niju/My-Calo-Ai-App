import { Worker } from "bullmq";
import { redis } from "../../config/redis";
import { scanFoodWithAI } from "../../modules/nutrition/nutrition.service";
import { logger } from "../../utils/logger";

export const foodScanWorker = new Worker(
  "food-scan",
  async (job) => {
    const { jobId, imageBase64, mimeType } = job.data;
    logger.info(`🔍 Processing food scan job [${job.id}]`);

    const result = await scanFoodWithAI(imageBase64, mimeType);

    await redis.set(`scan-result:${jobId}`, JSON.stringify(result), "EX", 300);

    logger.info(`✅ Food scan complete [${job.id}]: ${result.foodName}`);
    return result;
  },
  {
    connection: redis as any,
    concurrency: 5, // max 5 Gemini calls at once → no rate limit issues
    limiter: {
      max: 10, // max 10 jobs per duration
      duration: 1000, // per 1 second
    },
  },
);

foodScanWorker.on("failed", (job, err) => {
  logger.error(`❌ Food scan job failed [${job?.id}]: ${err.message}`);
});
