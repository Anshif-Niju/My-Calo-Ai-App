import { redis } from "../../config/redis";
import { DoctorVerification } from "../../models/Doctor.Verification.model";
import { MealLog } from "../../models/Meal.model";
import { CloudinaryUploadResult } from "../../types/index";

type UploadResults = Record<string, CloudinaryUploadResult>;

const handlers: Record<string, (entityId: string, results: UploadResults) => Promise<void>> = {
  "doctor-verification": async (entityId, results) => {
    await DoctorVerification.findByIdAndUpdate(entityId, {
      documents: {
        mcuCertificate: results.mcuCertificate?.url ?? "",
        degreeCertificate: results.degreeCertificate?.url ?? "",
        governmentId: results.governmentId?.url ?? "",
        clinicProof: results.clinicProof?.url ?? "",
      },
    });
    console.log(`✅ Doctor Verfication updated in MongoDB `);
  },

  MealLog: async (entityId, results) => {
    const imageUrl = results.image?.url;
    if (imageUrl) {
      const meal = await MealLog.findByIdAndUpdate(entityId, { imageUrl: imageUrl }, { returnDocument: "after" });
      if (meal) {
        await redis.del(`summary:${meal.userId}:${meal.date}`);
        console.log(` MealLog  updated in MongoDB with image`);
      }
    }
  },
};

export const handleCloudinaryUploadComplete = async (entityType: string, entityId: string, results: UploadResults) => {
  const handler = handlers[entityType];
  if (handler) await handler(entityId, results);
  else console.log(` No handler found for entityType: ${entityType}`);
};
