import { Worker } from "bullmq";
import { redis } from "../../config/redis";
import { scanFoodWithGemini25 } from "../../service/ai/gemini25.service";
import { scanFoodWithGemini35 } from "../../service/ai/gemini35.service";
import { scanFoodWithGroq } from "../../service/ai/groq.service";
import { compressImage } from "../../service/imageCompression.service";
import { deleteTempImage } from "../../service/tempFile.service";
import { logger } from "../../utils/logger";

export const foodScanWorker = new Worker(
  "food-scan",
  async (job) => {
    const { scanId, tempPath, mimeType } = job.data;

    logger.info(`🔍 Processing food scan [${scanId}]`);

    try {
      // Compress image ONCE

      const compressedBuffer = await compressImage(tempPath);

      // Convert to base64 ONCE

      const imageBase64 = compressedBuffer.toString("base64");

      // Ai Worker
      const runWithFallback = async (imageBase64: string, mimeType: string) => {
        // Step 1: Groq alone try
        try {
          const result = await scanFoodWithGroq(imageBase64, mimeType);
          console.log("✅ Groq won — skipping Gemini");
          return result;
        } catch (groqError) {
          console.warn("⚠️ Groq failed, trying Gemini fallback...");
        }

        // Step 2: Groq failed — now Gemini both parallel
        return Promise.any([scanFoodWithGemini25(imageBase64, mimeType), scanFoodWithGemini35(imageBase64, mimeType)]);
      };

      const result = await runWithFallback(imageBase64, mimeType);

      // Store result for polling / Socket.IO

      await redis.set(`scan-result:${scanId}`, JSON.stringify(result), "EX", 300);

      logger.info(`✅ Scan complete [${scanId}]: ${result.isFood ? result.foodName : "not food"}`);

      return result;
    } finally {
      // Delete temp file once processing ends

      await deleteTempImage(tempPath);
    }
  },
  {
    connection: redis as any,

    concurrency: 5,

    limiter: {
      max: 10,
      duration: 1000,
    },
  },
);

foodScanWorker.on("failed", async (job, err) => {
  logger.error(`❌ Food scan failed [${job?.id}]`, err);

  // Promise.any failed only if ALL providers failed.

  if (job) {
    await redis.set(
      `scan-result:${job.data.scanId}`,
      JSON.stringify({
        error: true,
        message: "All AI providers failed. Please try again.",
      }),
      "EX",
      300,
    );
  }
});
