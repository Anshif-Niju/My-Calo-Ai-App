import { Router } from "express";
import { z } from "zod";
import { authenticate, validate } from "../../middlewares/authenticate";
import { completeDoctorIntro, completeDoctorVerification } from "./doctor.onboarding.controller";
import { doctorVerificationSchema, userProfileSchema } from "./onboarding.validator";
import { completeIntro, completeUserverifiaction } from "./user.onboarding.controller";

const router = Router();

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
router.post("/doctor-verification", authenticate, validate(doctorVerificationSchema), completeDoctorVerification);

export default router;
