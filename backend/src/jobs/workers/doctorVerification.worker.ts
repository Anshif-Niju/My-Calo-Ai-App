import { Worker } from "bullmq";
import fs from "fs/promises";
import { redis } from "../../config/redis";
import { Doctor } from "../../models/Doctor.model";
import { DoctorVerificationJobData } from "../../types/index";
import { uploadFileToCloudinary } from "../../utils/cloudinaryUpload.util";

//Cloudinary Folder Path to save
const DOCTOR_VERIFICATION_FOLDER = "MyCalo AI/Doctor/Verification";

export const doctorVerificationWorker = new Worker<DoctorVerificationJobData>(
  "doctor-verification",

  async (job) => {
    const { doctorId, mcuPath, degreePath, governmentIdPath, clinicProofPath } = job.data;

    console.log(`[Doctor Verification] Processing job ${job.id} for doctor ${doctorId}`);

    const mcuUpload = await uploadFileToCloudinary(mcuPath, DOCTOR_VERIFICATION_FOLDER);

    const degreeUpload = await uploadFileToCloudinary(degreePath, DOCTOR_VERIFICATION_FOLDER);

    const governmentIdUpload = await uploadFileToCloudinary(governmentIdPath, DOCTOR_VERIFICATION_FOLDER);

    let clinicProofUpload: { url: string; publicId: string } | undefined;

    if (clinicProofPath) {
      clinicProofUpload = await uploadFileToCloudinary(clinicProofPath, DOCTOR_VERIFICATION_FOLDER);
    }

    await Doctor.findByIdAndUpdate(doctorId, {
      documents: {
        mcuCertificate: mcuUpload.url,

        degreeCertificate: degreeUpload.url,

        governmentId: governmentIdUpload.url,

        clinicProof: clinicProofUpload?.url ?? "",
      },
    });

    // Delete temp files

    const tempFiles = [mcuPath, degreePath, governmentIdPath, clinicProofPath].filter(Boolean);

    for (const filePath of tempFiles) {
      try {
        await fs.unlink(filePath as string);
      } catch {
        console.error("[Doctor Verification] Failed to delete temp file:", filePath);
      }
    }
  },

  {
    connection: redis as any,

    concurrency: 2,
  },
);

doctorVerificationWorker.on("completed", (job) => {
  console.log(`[Doctor Verification] Job ${job.id} completed successfully`);
});

doctorVerificationWorker.on("failed", (job, error) => {
  console.error(`[Doctor Verification] Job ${job?.id} failed:`, error.message);
});
