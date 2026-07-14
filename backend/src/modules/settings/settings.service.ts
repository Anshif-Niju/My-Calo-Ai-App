import { User } from "../../models/User.model";
import { MealLog } from "../../models/Meal.model";
import { DailyLog } from "../../models/DailyLog.model";
import { Appointment } from "../../models/Appointment.model";
import { Booking } from "../../models/TempBooking.model";
import { DoctorProfile } from "../../models/Doctor.Profile.model";
import { DoctorVerification } from "../../models/Doctor.Verification.model";
import { redis } from "../../config/redis";
import { generateAccessToken } from "../auth/auth.tokens";
import { cloudinaryUploadQueue } from "../../jobs/queues/cloudinaryUpload.queue";
import { UpdateProfileInput } from "./settings.validator";

export const updateProfileService = async (userId: string, file: Express.Multer.File | undefined, data: UpdateProfileInput) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Handle profile photo upload if present using BullMQ queue
  if (file) {
    await cloudinaryUploadQueue.add("cloudinary-upload", {
      entityType: "User",
      entityId: user._id.toString(),
      folder: "profiles",
      files: [{ fieldName: "image", path: file.path }],
    });
  }

  // Edit name if present
  if (data.name !== undefined) {
    user.name = data.name;
  }

  // Recalculate targets if any health metrics change
  const hasHealthOrGoalChanges = data.height !== undefined || data.weight !== undefined || data.activityLevel !== undefined || data.goalType !== undefined || data.targetWeight !== undefined || data.diseases !== undefined;

  if (hasHealthOrGoalChanges) {
    const height = data.height !== undefined ? Number(data.height) : user.healthProfile?.height;
    const weight = data.weight !== undefined ? Number(data.weight) : user.healthProfile?.weight;
    const age = user.healthProfile?.age;
    const gender = user.healthProfile?.gender;
    const activityLevel = data.activityLevel || user.healthProfile?.activityLevel;
    const goalType = data.goalType || user.goal?.type;
    const targetWeight = (data.targetWeight !== undefined ? Number(data.targetWeight) : user.goal?.targetWeight) || weight;
    const diseases = data.diseases || user.healthProfile?.diseases || [];

    if (height && weight && age && gender && activityLevel && goalType) {
      const heightInMeters = height / 100;
      const bmi = parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));

      const bmr = gender === "male" ? Math.round(88.362 + 13.397 * weight + 4.799 * height - 5.677 * age) : Math.round(447.593 + 9.247 * weight + 3.098 * height - 4.33 * age);

      const multipliers: Record<string, number> = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
      };
      const tdee = Math.round(bmr * (multipliers[activityLevel] ?? 1.2));

      const targetCalories = goalType === "weight_loss" ? tdee - 500 : goalType === "weight_gain" ? tdee + 500 : tdee;

      const protein = Math.round((targetCalories * 0.3) / 4);
      const carbs = Math.round((targetCalories * 0.4) / 4);
      const fat = Math.round((targetCalories * 0.3) / 9);

      user.healthProfile = { height, weight, age, gender, diseases, bmi, bmr, activityLevel };
      user.goal = { type: goalType, targetWeight: targetWeight as number };
      user.dailyTargets = { calories: targetCalories, protein, carbs, fat, fiber: 25 };
    }
  }

  await user.save();

  // Re-issue Express access token
  const newAccessToken = generateAccessToken(user._id.toString(), user.role, user.email, user.onboardingCompleted, user.hasSubmittedVerification, "not_submitted");

  // Invalidate Redis dashboard summary cache
  const todayStr = new Date().toISOString().split("T")[0];
  await redis.del(`summary:${user._id.toString()}:${todayStr}`);

  const updatedUser = await User.findById(user._id).select("-password -twoFactorSecret");

  return { newAccessToken, updatedUser };
};

export const deleteAccountService = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Delete all related data
  await Promise.all([
    User.findByIdAndDelete(userId),
    MealLog.deleteMany({ userId }),
    DailyLog.deleteMany({ userId }),
    Appointment.deleteMany({ $or: [{ patientId: userId }, { doctorId: userId }] }),
    Booking.deleteMany({ $or: [{ userId }, { doctorId: userId }] }),
    DoctorProfile.deleteMany({ userId }),
    DoctorVerification.deleteMany({ userId }),
  ]);

  // Invalidate Redis cache
  const todayStr = new Date().toISOString().split("T")[0];
  await redis.del(`summary:${userId}:${todayStr}`);
};
