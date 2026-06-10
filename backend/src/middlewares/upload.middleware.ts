import fs from "fs";
import multer from "multer";
import path from "path";

export const createDiskUploader = (folderName: string, maxSizeMB: number = 5) => {
  const uploadDir = path.join(process.cwd(), "uploads", "temp", folderName);

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadDir);
    },

    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);

      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  });

  return multer({
    storage,

    limits: {
      fileSize: maxSizeMB * 1024 * 1024,
    },
  });
};
