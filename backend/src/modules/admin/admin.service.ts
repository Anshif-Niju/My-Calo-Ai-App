// admin.service.ts

import AppError from "../../errors/AppError";
import { redis } from "../../config/redis";
import { Appointment } from "../../models/Appointment.model";
import { DoctorProfile } from "../../models/Doctor.Profile.model";
import { DoctorVerification } from "../../models/Doctor.Verification.model";
import { User } from "../../models/User.model";
import { Foods } from "../../models/Foods.model";

const ADMIN_DASHBOARD_CACHE_KEY = "admin:dashboard:stats";
const ADMIN_DASHBOARD_TTL = 300; // 5 minutes

export const getDashboard = async () => {
  // Check Redis cache first
  const cached = await redis.get(ADMIN_DASHBOARD_CACHE_KEY);
  if (cached) {
    return JSON.parse(cached);
  }

  // Cache miss — run the 4 DB queries
  const [totalUsers, totalDoctors, pendingVerifications, totalAppointments] = await Promise.all([
    User.countDocuments(),
    DoctorProfile.countDocuments(),
    DoctorVerification.countDocuments({
      verificationStatus: "pending",
    }),
    Appointment.countDocuments(),
  ]);

  const stats = {
    totalUsers,
    totalDoctors,
    pendingVerifications,
    totalAppointments,
  };

  // Store in Redis for 5 minutes
  await redis.set(ADMIN_DASHBOARD_CACHE_KEY, JSON.stringify(stats), "EX", ADMIN_DASHBOARD_TTL);

  return stats;
};

export const getAllUsers = async ({ page, limit, isBlocked }: { page: number; limit: number; isBlocked?: boolean }) => {
  const query: any = {
    role: "user",
    isDeleted: false,
  };

  if (isBlocked !== undefined) {
    query.isBlocked = isBlocked;
  }

  const total = await User.countDocuments(query);

  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    users,
    total,
    page,
    limit,
  };
};
export const getUserDetail = async (userId: string) => {
  const user = await User.findById(userId).lean();

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return user;
};

export const toggleBlockUser = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  user.isBlocked = !user.isBlocked;

  await user.save();

  // Invalidate dashboard cache so stats refresh on next open
  await redis.del(ADMIN_DASHBOARD_CACHE_KEY);

  return user;
};

export const softDeleteUser = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  user.isDeleted = true;

  await user.save();

  // Invalidate dashboard cache so user count updates
  await redis.del(ADMIN_DASHBOARD_CACHE_KEY);

  return user;
};

//Admin Food Adding

export const createFood = async (payload: any) => {
  return Foods.create(payload);
};
