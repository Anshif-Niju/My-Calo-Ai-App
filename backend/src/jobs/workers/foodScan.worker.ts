import fs from "fs";
import { Worker } from "bullmq";
import { redis } from "../../config/redis";
import { getIO } from "../../config/socket";
import { scanFoodWithGemini25 } from "../../service/ai/gemini25.service";
import { scanFoodWithGemini35 } from "../../service/ai/gemini35.service";
import { scanFoodWithGroq } from "../../service/ai/groq.service";
import { compressImage } from "../../service/imageCompression.service";
import { deleteTempImage } from "../../service/tempFile.service";
import { logger } from "../../utils/logger";
import { Foods } from "../../models/Foods.model";
import { uploadFileToCloudinary } from "../../utils/cloudinaryUpload.util";

export const foodScanWorker = new Worker(
  "food-scan",
  async (job) => {
    const { scanId, tempPath, mimeType } = job.data;

    logger.info(`🔍 Processing food scan [${scanId}]`);

    try {
      // Compress image ONCE
      const compressedBuffer = await compressImage(tempPath);

      // Overwrite temp file with the compressed version
      await fs.promises.writeFile(tempPath, compressedBuffer);

      // Convert to base64 ONCE
      const imageBase64 = compressedBuffer.toString("base64");

      // Ai Worker
      const runWithFallback = async (imageBase64: string, mimeType: string) => {
        // Step 1: Groq alone try
        try {
          const result = await scanFoodWithGroq(imageBase64, mimeType);
          console.log("✅ Groq Ai Completed — skipping Gemini");
          return result;
        } catch (groqError) {
          console.warn("⚠️ Groq failed, trying Gemini fallback...");
        }

        // Step 2: Groq failed — now Gemini both parallel
        return Promise.any([scanFoodWithGemini25(imageBase64, mimeType), scanFoodWithGemini35(imageBase64, mimeType)]);
      };

      const result = await runWithFallback(imageBase64, mimeType);

      // Store result in Redis (kept as fallback if socket disconnects)
      await redis.set(`scan-result:${scanId}`, JSON.stringify(result), "EX", 300);

      // Push result instantly to the frontend via Socket.IO
      try {
        getIO().emit(`scan:complete:${scanId}`, { status: "done", data: result });
        logger.info(`📡 Socket event emitted [scan:complete:${scanId}]`);
      } catch {
        logger.warn("Socket.IO not ready — frontend will fallback to Redis poll");
      }

      // Automatically register newly scanned food to Foods database synchronously inside worker
      if (result && result.isFood && result.foodName) {
        try {
          const trimmedName = result.foodName.trim();
          const exists = await Foods.findOne({
            name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
            isActive: true,
          });

          if (!exists) {
            let uploadedImageUrl = undefined;

            try {
              // Upload the compressed scanned image from tempPath to Cloudinary
              const uploadResult = await uploadFileToCloudinary(tempPath, "foods");
              uploadedImageUrl = uploadResult.url;
              logger.info(`📸 Scanned food image uploaded to Cloudinary: ${uploadedImageUrl}`);
            } catch (uploadError) {
              logger.error(`⚠️ Cloudinary upload failed for auto-registered food "${trimmedName}":`, uploadError);
            }

            await Foods.create({
              name: trimmedName,
              servingType: result.type,
              defaultQuantity: result.defaultQuantity || 1,
              defaultUnit: result.defaultUnit || "piece",
              defaultGrams: result.defaultGrams || 100,
              nutritionPerUnit: result.nutritionPerUnit,
              nutritionPer100g: result.nutritionPer100g,
              imageUrl: uploadedImageUrl,
              isActive: true,
            });
            logger.info(`🌱 Automatically added newly scanned food "${trimmedName}" to database`);
          }
        } catch (dbError) {
          logger.error(`⚠️ Failed to automatically add scanned food "${result.foodName}" to database:`, dbError);
        }
      }

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
    const errorPayload = {
      error: true,
      message: "All AI providers failed. Please try again.",
    };

    await redis.set(
      `scan-result:${job.data.scanId}`,
      JSON.stringify(errorPayload),
      "EX",
      300,
    );

    // Push failure instantly to frontend
    try {
      getIO().emit(`scan:complete:${job.data.scanId}`, { status: "done", data: errorPayload });
    } catch {
      // Socket not ready — frontend timeout will handle it
    }
  }
});
