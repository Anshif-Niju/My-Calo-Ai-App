// admin.service.ts

import AppError from "../../errors/AppError";
import { Appointment } from "../../models/Appointment.model";
import { DoctorProfile } from "../../models/Doctor.Profile.model";
import { DoctorVerification } from "../../models/Doctor.Verification.model";
import { User } from "../../models/User.model";
import { Foods } from "../../models/Foods.model";

export const getDashboard = async () => {
  const [totalUsers, totalDoctors, pendingVerifications, totalAppointments] = await Promise.all([
    User.countDocuments(),
    DoctorProfile.countDocuments(),
    DoctorVerification.countDocuments({
      verificationStatus: "pending",
    }),
    Appointment.countDocuments(),
  ]);

  return {
    totalUsers,
    totalDoctors,
    pendingVerifications,
    totalAppointments,
  };
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

  return user;
};

export const softDeleteUser = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  user.isDeleted = true;

  await user.save();

  return user;
};

//Admin Food Adding

export const createFood = async (payload: any) => {
  return Foods.create(payload);
};
