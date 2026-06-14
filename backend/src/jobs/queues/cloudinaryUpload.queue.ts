import { Queue } from "bullmq";
import { redis } from "../../config/redis";
import { CloudinaryUploadJobData } from "../../types/index";

export const cloudinaryUploadQueue = new Queue<CloudinaryUploadJobData>("cloudinary-upload", {
  connection: redis as any,
});
