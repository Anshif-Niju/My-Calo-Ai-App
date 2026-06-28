import fs from "fs";
import AppError from "../../errors/AppError";
import { redis } from "../../config/redis";
import { Appointment } from "../../models/Appointment.model";
import { DoctorProfile } from "../../models/Doctor.Profile.model";
import { DoctorVerification } from "../../models/Doctor.Verification.model";
import { User } from "../../models/User.model";
import { Foods } from "../../models/Foods.model";
import { uploadFileToCloudinary } from "../../utils/cloudinaryUpload.util";
import { getDashboard as getNutritionDashboard } from "../nutrition/nutrition.service";

const ADMIN_DASHBOARD_CACHE_KEY = "admin:dashboard:stats";

export const getDashboard = async () => {
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
  await redis.set(ADMIN_DASHBOARD_CACHE_KEY, JSON.stringify(stats), "EX", 300);

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

//User Daily Log (Redis Optimized)

export const getUserDailyLog = async (userId: string, date: string) => {
  return getNutritionDashboard(userId, date);
};

//Admin Food Adding

export const createFood = async (payload: any, file?: Express.Multer.File) => {
  if (file) {
    try {
      const uploadResult = await uploadFileToCloudinary(file.path, "foods");
      payload.imageUrl = uploadResult.url;
    } finally {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }
  }
  return Foods.create(payload);
};

//Get all foods

export const getAllFoods = async ({ page, limit, search }: { page: number; limit: number; search: string }) => {
  const query: any = { isActive: true };

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  const total = await Foods.countDocuments(query);

  const foods = await Foods.find(query)
    .sort({ name: 1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return {
    foods,
    total,
    page,
    limit,
  };
};

//Delete Food

export const deleteFood = async (foodId: string) => {
  const food = await Foods.findById(foodId);

  if (!food) {
    throw new AppError(404, "Food item not found");
  }

  await Foods.findByIdAndDelete(foodId);

  return null;
};
