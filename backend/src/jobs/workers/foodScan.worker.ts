import fs from "fs";
import { Worker } from "bullmq";
import { redis } from "../../config/redis.js";
import { getIO } from "../../socket/index.js";
import { scanFoodWithGemini25 } from "../../service/ai/gemini25.service.js";
import { scanFoodWithGemini35 } from "../../service/ai/gemini35.service.js";
import { scanFoodWithGroq } from "../../service/ai/groq.service.js";
import { compressImage } from "../../service/imageCompression.service.js";
import { deleteTempImage } from "../../service/tempFile.service.js";
import { logger } from "../../utils/logger.js";
import { Foods } from "../../models/Foods.model.js";
import { uploadFileToCloudinary } from "../../utils/cloudinaryUpload.util.js";

export const foodScanWorker = new Worker(
  "food-scan",
  async (job) => {
    const { scanId, userId, tempPath, mimeType } = job.data;

    logger.info(`🔍 Processing food scan [${scanId}] for user [${userId}]`);

    try {
      const compressedBuffer = await compressImage(tempPath);

      // Overwrite temp file with the compressed version
      await fs.promises.writeFile(tempPath, compressedBuffer);

      const imageBase64 = compressedBuffer.toString("base64");

      // AI Worker — Groq first, then Gemini parallel fallback
      const runWithFallback = async (imageBase64: string, mimeType: string) => {
        try {
          const result = await scanFoodWithGroq(imageBase64, mimeType);
          logger.info("Groq AI completed scan");
          return result;
        } catch {
          logger.warn("Groq failed — trying Gemini fallback");
        }

        return Promise.any([
          scanFoodWithGemini25(imageBase64, mimeType),
          scanFoodWithGemini35(imageBase64, mimeType),
        ]);
      };

      const result = await runWithFallback(imageBase64, mimeType);

      // Store result in Redis (fallback if socket event is missed)
      await redis.set(`scan-result:${scanId}`, JSON.stringify(result), "EX", 300);

      // Emit directly to the authenticated user's personal room
      // Frontend listens for "food-scan-completed" (stable event name)
      try {
        getIO().to(userId).emit("food-scan-completed", { scanId, data: result });
        logger.info(`📡 Emitted food-scan-completed to user [${userId}] scan [${scanId}]`);
      } catch {
        logger.warn("Socket.IO not ready — frontend will fallback to Redis poll");
      }

      // Auto-register newly identified foods in the database
      if (result && result.isFood && result.foodName) {
        try {
          const trimmedName = result.foodName.trim();
          const exists = await Foods.findOne({
            name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
            isActive: true,
          });

          if (!exists) {
            let uploadedImageUrl: string | undefined;

            try {
              const uploadResult = await uploadFileToCloudinary(tempPath, "foods");
              uploadedImageUrl = uploadResult.url;
              logger.info(`📸 Scanned food image uploaded to Cloudinary: ${uploadedImageUrl}`);
            } catch (uploadError) {
              logger.error(`⚠️ Cloudinary upload failed for "${trimmedName}":`, uploadError);
            }

            await Foods.create({
              name: trimmedName,
              category: result.category || "other",
              servingType: result.type,
              defaultQuantity: result.defaultQuantity || 1,
              defaultUnit: result.defaultUnit || "piece",
              defaultGrams: result.defaultGrams || 100,
              nutritionPerUnit: result.nutritionPerUnit,
              nutritionPer100g: result.nutritionPer100g,
              imageUrl: uploadedImageUrl,
              isActive: true,
            });
            logger.info(`✅ Auto-registered new food "${trimmedName}" in database`);
          }
        } catch (dbError) {
          logger.error(`Failed to auto-register food "${result.foodName}":`, dbError);
        }
      }

      logger.info(`✅ Scan complete [${scanId}]: ${result.isFood ? result.foodName : "not food"}`);

      return result;
    } finally {
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

  if (job) {
    const { scanId, userId } = job.data;

    const errorPayload = {
      error: true,
      message: "All AI providers failed. Please try again.",
    };

    await redis.set(`scan-result:${scanId}`, JSON.stringify(errorPayload), "EX", 300);

    // Push failure to the user's personal room
    try {
      getIO().to(userId).emit("food-scan-completed", { scanId, data: errorPayload });
    } catch {
      // Socket not ready — frontend timeout will handle it
    }
  }
});
