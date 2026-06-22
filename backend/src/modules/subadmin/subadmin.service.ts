import AppError from "../../errors/AppError";
import { DoctorProfile } from "../../models/Doctor.Profile.model";
import { DoctorVerification } from "../../models/Doctor.Verification.model";
import { User } from "../../models/User.model";

// ─── Dashboard ──────────────────────────────────────────────────────────────

/**
 * Returns the count + list of pending verification requests.
 * If none pending → returns an empty array (frontend shows "No pending").
 */
export const getDashboardStats = async () => {
  const pending = await DoctorVerification.find({ verificationStatus: "pending" })
    .populate("userId", "name email phone profilePhoto createdAt")
    .sort({ createdAt: -1 })
    .lean();

  return {
    pendingCount: pending.length,
    pendingVerifications: pending,
  };
};

// ─── Verification detail ─────────────────────────────────────────────────────

/**
 * Full verification submission detail for a single doctor
 * (used when sub-admin clicks a doctor card to review docs & images).
 */
export const getVerificationDetail = async (doctorId: string) => {
  const verification = await DoctorVerification.findById(doctorId)
    .populate("userId", "name email phone profilePhoto countryCode createdAt")
    .lean();

  if (!verification) {
    throw new AppError(404, "Verification record not found");
  }

  return verification;
};

// ─── Approve verification ────────────────────────────────────────────────────

export const approveVerification = async (doctorId: string) => {
  const verification = await DoctorVerification.findById(doctorId);

  if (!verification) {
    throw new AppError(404, "Verification record not found");
  }

  if (verification.verificationStatus === "approved") {
    throw new AppError(400, "Doctor is already approved");
  }

  verification.verificationStatus = "approved";
  verification.rejectionReason = undefined;
  await verification.save();

  // Mark hasSubmittedVerification on user (already true, but ensure it)
  await User.findByIdAndUpdate(verification.userId, {
    hasSubmittedVerification: true,
  });

  return verification;
};

// ─── Reject verification ─────────────────────────────────────────────────────

export const rejectVerification = async (doctorId: string, reason: string) => {
  const verification = await DoctorVerification.findById(doctorId);

  if (!verification) {
    throw new AppError(404, "Verification record not found");
  }

  verification.verificationStatus = "rejected";
  verification.rejectionReason = reason;
  await verification.save();

  return verification;
};

// ─── All doctors list ─────────────────────────────────────────────────────────

/**
 * Returns all doctor users with their verification + profile info.
 * Sub-admin uses this for the "Doctors" section.
 */
export const getAllDoctors = async ({
  page,
  limit,
  search,
}: {
  page: number;
  limit: number;
  search?: string;
}) => {
  const query: any = { role: "doctor", isDeleted: false };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const total = await User.countDocuments(query);

  const doctorUsers = await User.find(query)
    .select("-password -twoFactorSecret")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  // Attach verification + profile data
  const enriched = await Promise.all(
    doctorUsers.map(async (u) => {
      const [verification, profile] = await Promise.all([
        DoctorVerification.findOne({ userId: u._id }).lean(),
        DoctorProfile.findOne({ doctorId: u._id }).lean(),
      ]);
      return {
        ...u,
        verification: verification ?? null,
        profile: profile ?? null,
      };
    })
  );

  return { doctors: enriched, total, page, limit };
};

// ─── Doctor detail ────────────────────────────────────────────────────────────

/**
 * Full details of one doctor: user info + verification submission + profile.
 */
export const getDoctorDetail = async (userId: string) => {
  const user = await User.findById(userId)
    .select("-password -twoFactorSecret")
    .lean();

  if (!user || user.role !== "doctor") {
    throw new AppError(404, "Doctor not found");
  }

  const [verification, profile] = await Promise.all([
    DoctorVerification.findOne({ userId }).lean(),
    DoctorProfile.findOne({ doctorId: userId }).lean(),
  ]);

  return { user, verification: verification ?? null, profile: profile ?? null };
};

// ─── Toggle doctor active/inactive ───────────────────────────────────────────

/**
 * Toggles isBlocked on the User document (deactivate / reactivate).
 */
export const toggleDoctorStatus = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user || user.role !== "doctor") {
    throw new AppError(404, "Doctor not found");
  }

  user.isBlocked = !user.isBlocked;
  await user.save();

  return { isBlocked: user.isBlocked };
};

// ─── Hard-delete a doctor ─────────────────────────────────────────────────────

/**
 * Permanently removes:
 *   - User document
 *   - DoctorVerification document
 *   - DoctorProfile document
 */
export const hardDeleteDoctor = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user || user.role !== "doctor") {
    throw new AppError(404, "Doctor not found");
  }

  await Promise.all([
    User.findByIdAndDelete(userId),
    DoctorVerification.findOneAndDelete({ userId }),
    DoctorProfile.findOneAndDelete({ doctorId: userId }),
  ]);

  return null;
};
