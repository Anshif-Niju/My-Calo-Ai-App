import { Worker } from "bullmq";
import { redis } from "../../config/redis";
import { scanFoodWithAI } from "../../modules/nutrition/nutrition.service";
import { logger } from "../../utils/logger";

export const foodScanWorker = new Worker(
  "food-scan",
  async (job) => {
    const { jobId, imageBase64, mimeType, imageUrl } = job.data;
    logger.info(`🔍 Processing food scan [${job.id}]`);

    const result = await scanFoodWithAI(imageBase64, mimeType);

    // Attach imageUrl to result
    const finalResult = { ...result, imageUrl };

    await redis.set(`scan-result:${jobId}`, JSON.stringify(finalResult), "EX", 300);
    logger.info(`✅ Scan complete [${job.id}]: ${result.isFood ? result.foodName : "not food"}`);
    return finalResult;
  },
  {
    connection: redis as any,
    concurrency: 5,
    limiter: { max: 10, duration: 1000 },
  },
);

foodScanWorker.on("failed", async (job, err) => {
  logger.error(`❌ Food scan failed [${job?.id}]`, err);

  if (job && job.attemptsMade >= 3) {
    await redis.set(`scan-result:${job.data.jobId}`, JSON.stringify({ error: true, message: "Food could not be identified. Please upload a clearer photo." }), "EX", 300);
  }
});
