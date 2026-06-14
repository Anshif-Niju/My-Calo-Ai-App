// jobs/workers/cloudinaryUpload.worker.ts
import { Worker } from "bullmq";
import { redis } from "../../config/redis";
import { deleteTempImage } from "../../service/tempFile.service";
import { CloudinaryUploadJobData, CloudinaryUploadResult } from "../../types/index";
import { uploadFileToCloudinary } from "../../utils/cloudinaryUpload.util";
import { handleCloudinaryUploadComplete } from "../handlers/cloudinaryUpload.handler";

export const cloudinaryUploadWorker = new Worker<CloudinaryUploadJobData>(
  "cloudinary-upload",
  async (job) => {
    const { entityType, entityId, folder, files } = job.data;

    console.log(`\n Cloudinary Upload Job ${job.id} | type=${entityType} | entity=${entityId}`);

    const results: Record<string, CloudinaryUploadResult> = {};

    for (const file of files) {
      results[file.fieldName] = await uploadFileToCloudinary(file.path, folder);
      await deleteTempImage(file.path); // cleanup temp file
    }

    await handleCloudinaryUploadComplete(entityType, entityId, results);

    return results;
  },
  {
    connection: redis as any,
    concurrency: 3,
  },
);

cloudinaryUploadWorker.on("completed", (job) => {
  console.log(`\n Cloudinary Upload Job ${job.id} completed`);
});

cloudinaryUploadWorker.on("failed", (job, error) => {
  console.error(`\n Cloudinary Upload Job ${job?.id} failed:`, error.message);
});
