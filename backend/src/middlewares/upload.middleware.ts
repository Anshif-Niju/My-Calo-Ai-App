import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "MyCalo Ai/Doctor/Verification",
    allowed_formats: ["jpg", "jpeg", "png", "pdf"],
    transformation: [{ quality: "auto", fetch_format: "auto" }],
    public_id: `${Date.now()}-${file.fieldname}`,
  }),
});

export const uploadDoctorDocs = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).fields([
  { name: "mcuCertificate", maxCount: 1 },
  { name: "degreeCertificate", maxCount: 1 },
  { name: "governmentId", maxCount: 1 },
  { name: "clinicProof", maxCount: 1 },
]);
