import { Router } from "express";
import { z } from "zod";
import { authenticate, validate } from "../../middlewares/authenticate";
import { createCloudUploader } from "../../middlewares/upload.middleware";
import { completeDoctorIntro, completeDoctorVerification } from "./doctor.onboarding.controller";
import { doctorVerificationSchema, userProfileSchema } from "./onboarding.validator";
import { completeIntro, completeUserverifiaction } from "./user.onboarding.controller";

const router = Router();

const doctorDocsUpload = createCloudUploader("MyCalo Ai/Doctor/Verification", 5).fields([
  { name: "mcuCertificate", maxCount: 1 },
  { name: "degreeCertificate", maxCount: 1 },
  { name: "governmentId", maxCount: 1 },
  { name: "clinicProof", maxCount: 1 }, 
]);

//User Onboarding
router.post("/intro-complete", authenticate, completeIntro);

router.post(
  "/user-verification",
  authenticate,
  validate(
    z.object({
      body: userProfileSchema,
    }),
  ),
  completeUserverifiaction,
);

//Doctor Onboarding
router.post("/doctor-intro-complete", authenticate, completeDoctorIntro);

router.post(
  "/verification",
  authenticate,
  doctorDocsUpload, // ← Cloudinary handles the files here
  validate(doctorVerificationSchema),
  completeDoctorVerification,
);
export default router;
