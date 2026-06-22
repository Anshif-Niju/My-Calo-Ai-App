import { Request, Response } from "express";
import { AuthUserPayload } from "../../types/index";
import * as subadminService from "./subadmin.service";

// ─── Dashboard ────────────────────────────────────────────────────────────────

/**
 * GET /api/subadmin/dashboard
 * Returns pending verifications count + list.
 * If none → pendingCount: 0, pendingVerifications: []
 */
export const getDashboard = async (req: Request, res: Response) => {
  try {
    const data = await subadminService.getDashboardStats();
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(error.statusCode ?? 500).json({ success: false, message: error.message });
  }
};

// ─── Verification detail ──────────────────────────────────────────────────────

/**
 * GET /api/subadmin/verifications/:doctorId
 * Full verification detail — submitted docs & images.
 */
export const getVerificationDetail = async (req: Request, res: Response) => {
  try {
    const doctorId = req.params.doctorId as string;
    const data = await subadminService.getVerificationDetail(doctorId);
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(error.statusCode ?? 500).json({ success: false, message: error.message });
  }
};

// ─── Approve verification ─────────────────────────────────────────────────────

/**
 * PATCH /api/subadmin/verifications/:doctorId/approve
 */
export const approveVerification = async (req: Request, res: Response) => {
  try {
    const doctorId = req.params.doctorId as string;
    const data = await subadminService.approveVerification(doctorId);
    return res.status(200).json({ success: true, message: "Doctor verification approved", data });
  } catch (error: any) {
    return res.status(error.statusCode ?? 500).json({ success: false, message: error.message });
  }
};

// ─── Reject verification ──────────────────────────────────────────────────────

/**
 * PATCH /api/subadmin/verifications/:doctorId/reject
 * Body: { reason: string }
 */
export const rejectVerification = async (req: Request, res: Response) => {
  try {
    const doctorId = req.params.doctorId as string;
    const { reason } = req.body;
    const data = await subadminService.rejectVerification(doctorId, reason);
    return res.status(200).json({ success: true, message: "Doctor verification rejected", data });
  } catch (error: any) {
    return res.status(error.statusCode ?? 500).json({ success: false, message: error.message });
  }
};

// ─── All doctors list ─────────────────────────────────────────────────────────

/**
 * GET /api/subadmin/doctors?page=1&limit=10&search=
 */
export const getAllDoctors = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const search = (req.query.search as string) || "";

    const data = await subadminService.getAllDoctors({ page, limit, search });
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(error.statusCode ?? 500).json({ success: false, message: error.message });
  }
};

// ─── Single doctor detail ─────────────────────────────────────────────────────

/**
 * GET /api/subadmin/doctors/:userId
 * Returns full info: user + verification + profile.
 */
export const getDoctorDetail = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const data = await subadminService.getDoctorDetail(userId);
    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(error.statusCode ?? 500).json({ success: false, message: error.message });
  }
};

// ─── Toggle doctor active/deactivate ─────────────────────────────────────────

/**
 * PATCH /api/subadmin/doctors/:userId/toggle-status
 */
export const toggleDoctorStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const data = await subadminService.toggleDoctorStatus(userId);
    const msg = data.isBlocked ? "Doctor deactivated" : "Doctor reactivated";
    return res.status(200).json({ success: true, message: msg, data });
  } catch (error: any) {
    return res.status(error.statusCode ?? 500).json({ success: false, message: error.message });
  }
};

// ─── Hard-delete doctor ───────────────────────────────────────────────────────

/**
 * DELETE /api/subadmin/doctors/:userId
 * Permanently removes User + DoctorVerification + DoctorProfile.
 */
export const deleteDoctor = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    await subadminService.hardDeleteDoctor(userId);
    return res.status(200).json({ success: true, message: "Doctor and all related data permanently deleted" });
  } catch (error: any) {
    return res.status(error.statusCode ?? 500).json({ success: false, message: error.message });
  }
};
