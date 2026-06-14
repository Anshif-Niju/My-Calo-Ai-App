import { Doctor } from "../../models/Doctor.model";
import { CloudinaryUploadResult } from "../../types/index";

type UploadResults = Record<string, CloudinaryUploadResult>;

const handlers: Record<string, (entityId: string, results: UploadResults) => Promise<void>> = {
  "doctor-verification": async (entityId, results) => {
    await Doctor.findByIdAndUpdate(entityId, {
      documents: {
        mcuCertificate: results.mcuCertificate?.url ?? "",
        degreeCertificate: results.degreeCertificate?.url ?? "",
        governmentId: results.governmentId?.url ?? "",
        clinicProof: results.clinicProof?.url ?? "",
      },
    });
  },

  "food-scan": async (entityId, results) => {
    // Example: attach permanent image url to a MealLog later
    // await MealLog.findByIdAndUpdate(entityId, { imageUrl: results.image?.url ?? "" });
  },
};

export const handleCloudinaryUploadComplete = async (entityType: string, entityId: string, results: UploadResults) => {
  const handler = handlers[entityType];
  if (handler) await handler(entityId, results);
};
