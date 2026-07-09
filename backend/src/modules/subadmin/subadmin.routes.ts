import { Router } from "express";
import { z } from "zod";
import { verifyAccessToken } from "../../middlewares/authenticate.middleware";
import { validate } from "../../middlewares/validate.middleware";

import { authorize } from "../../middlewares/authorize.middleware";
import * as subadminController from "./subadmin.controller";
import { approveVerificationSchema, rejectVerificationSchema, toggleDoctorStatusSchema, deleteDoctorSchema } from "./subadmin.validator";


const router = Router();

//Dashboard
router.get("/dashboard", verifyAccessToken, authorize(["subadmin"]), subadminController.getDashboard);

// Verification routes
router.get("/verifications/:doctorId", verifyAccessToken, authorize(["subadmin"]), validate(z.object({ params: z.object({ doctorId: z.string().min(1) }) })), subadminController.getVerificationDetail);
router.patch("/verifications/:doctorId/approve", verifyAccessToken, authorize(["subadmin"]), validate(approveVerificationSchema), subadminController.approveVerification);
router.patch("/verifications/:doctorId/reject", verifyAccessToken, authorize(["subadmin"]), validate(rejectVerificationSchema), subadminController.rejectVerification);

// Doctor management routes
router.get("/doctors", verifyAccessToken, authorize(["subadmin"]), subadminController.getAllDoctors);
router.get("/doctors/:userId", verifyAccessToken, authorize(["subadmin"]), validate(z.object({ params: z.object({ userId: z.string().min(1) }) })), subadminController.getDoctorDetail);
router.patch("/doctors/:userId/toggle-status", verifyAccessToken, authorize(["subadmin"]), validate(toggleDoctorStatusSchema), subadminController.toggleDoctorStatus);
router.delete("/doctors/:userId", verifyAccessToken, authorize(["subadmin"]), validate(deleteDoctorSchema), subadminController.deleteDoctor);

export default router;
