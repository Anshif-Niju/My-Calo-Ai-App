import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary";

export const createCloudUploader = (folderName: string, maxSizeMB: number = 5) => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
      folder: folderName,
      allowed_formats: ["jpg", "jpeg", "png", "webp", "pdf"],
      transformation: [{ quality: "auto", fetch_format: "auto" }],
      public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
    }),
  });

  return multer({
    storage,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
  });
};
