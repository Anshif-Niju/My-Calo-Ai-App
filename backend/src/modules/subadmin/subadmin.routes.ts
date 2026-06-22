import { Router } from "express";
import { z } from "zod";
import { authenticate, authorize, validate } from "../../middlewares/authenticate";
import * as subadminController from "./subadmin.controller";
import { approveVerificationSchema, rejectVerificationSchema, toggleDoctorStatusSchema, deleteDoctorSchema } from "./subadmin.validator";

const router = Router();

//Dashboard
router.get("/dashboard",authenticate, authorize(["subadmin"]), subadminController.getDashboard);

// Verification routes
router.get("/verifications/:doctorId",authenticate, authorize(["subadmin"]), validate(z.object({ params: z.object({ doctorId: z.string().min(1) }) })), subadminController.getVerificationDetail);
router.patch("/verifications/:doctorId/approve",authenticate, authorize(["subadmin"]), validate(approveVerificationSchema), subadminController.approveVerification);
router.patch("/verifications/:doctorId/reject", authenticate, authorize(["subadmin"]),validate(rejectVerificationSchema), subadminController.rejectVerification);

// Doctor management routes
router.get("/doctors",authenticate, authorize(["subadmin"]), subadminController.getAllDoctors);
router.get("/doctors/:userId",authenticate, authorize(["subadmin"]), validate(z.object({ params: z.object({ userId: z.string().min(1) }) })), subadminController.getDoctorDetail);
router.patch("/doctors/:userId/toggle-status", authenticate, authorize(["subadmin"]),validate(toggleDoctorStatusSchema), subadminController.toggleDoctorStatus);
router.delete("/doctors/:userId", authenticate, authorize(["subadmin"]),validate(deleteDoctorSchema), subadminController.deleteDoctor);

export default router;
