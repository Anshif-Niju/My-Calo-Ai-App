import { Router } from "express";
import { z } from "zod";
import { verifyAccessToken } from "../../middlewares/authenticate.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { createDiskUploader } from "../../middlewares/upload.middleware";
import { completeDoctorIntro, completeDoctorVerification } from "./doctor.onboarding.controller";
import { doctorVerificationSchema, userProfileSchema } from "./onboarding.validator";
import { completeIntro, completeUserverifiaction } from "./user.onboarding.controller";

const router = Router();

const doctorDocsUpload = createDiskUploader("doctor-verification", 5).fields([
  { name: "mcuCertificate", maxCount: 1 },
  { name: "degreeCertificate", maxCount: 1 },
  { name: "governmentId", maxCount: 1 },
]);

//User Onboarding
router.post("/intro-complete", verifyAccessToken, completeIntro);

router.post(
  "/user-verification",
  verifyAccessToken,
  validate(
    z.object({
      body: userProfileSchema,
    }),
  ),
  completeUserverifiaction,
);

//Doctor Onboarding
router.post("/doctor-intro-complete", verifyAccessToken, completeDoctorIntro);

router.post("/doctor-verification", verifyAccessToken, doctorDocsUpload, validate(doctorVerificationSchema), completeDoctorVerification);
export default router;
