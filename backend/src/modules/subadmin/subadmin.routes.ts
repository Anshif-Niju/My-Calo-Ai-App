import { Router } from "express";
import { z } from "zod";
import { authenticate, authorize, validate } from "../../middlewares/authenticate";
import * as subadminController from "./subadmin.controller";
import {
  approveVerificationSchema,
  rejectVerificationSchema,
  toggleDoctorStatusSchema,
  deleteDoctorSchema,
} from "./subadmin.validator";

const router = Router();

// All sub-admin routes require auth + subadmin role
router.use(authenticate, authorize(["subadmin"]));

// ─── Dashboard ────────────────────────────────────────────────────────────────
// GET /api/subadmin/dashboard
// Returns: { pendingCount, pendingVerifications[] }
router.get("/dashboard", subadminController.getDashboard);

// ─── Verification routes ──────────────────────────────────────────────────────
// GET /api/subadmin/verifications/:doctorId   → view submitted docs & images
router.get(
  "/verifications/:doctorId",
  validate(z.object({ params: z.object({ doctorId: z.string().min(1) }) })),
  subadminController.getVerificationDetail,
);

// PATCH /api/subadmin/verifications/:doctorId/approve  → approve the doctor
router.patch(
  "/verifications/:doctorId/approve",
  validate(approveVerificationSchema),
  subadminController.approveVerification,
);

// PATCH /api/subadmin/verifications/:doctorId/reject   → reject with reason
router.patch(
  "/verifications/:doctorId/reject",
  validate(rejectVerificationSchema),
  subadminController.rejectVerification,
);

// ─── Doctor management routes ──────────────────────────────────────────────────
// GET /api/subadmin/doctors?page=1&limit=10&search=  → list all doctors
router.get("/doctors", subadminController.getAllDoctors);

// GET /api/subadmin/doctors/:userId  → full doctor detail (user + verification + profile)
router.get(
  "/doctors/:userId",
  validate(z.object({ params: z.object({ userId: z.string().min(1) }) })),
  subadminController.getDoctorDetail,
);

// PATCH /api/subadmin/doctors/:userId/toggle-status  → deactivate / reactivate
router.patch(
  "/doctors/:userId/toggle-status",
  validate(toggleDoctorStatusSchema),
  subadminController.toggleDoctorStatus,
);

// DELETE /api/subadmin/doctors/:userId  → permanently delete doctor + all data
router.delete(
  "/doctors/:userId",
  validate(deleteDoctorSchema),
  subadminController.deleteDoctor,
);

export default router;
