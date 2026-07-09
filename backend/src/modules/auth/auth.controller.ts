import { Request, Response } from "express";
import * as authService from "./auth.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { setAccessTokenCookie, setRefreshCookie, clearAuthCookies, setTemp2FACookie } from "./auth.cookies";
import { AuthUserPayload } from "../../types";
import fs from "fs";
import { User } from "../../models/User.model";
import { MealLog } from "../../models/Meal.model";
import { DailyLog } from "../../models/DailyLog.model";
import { Appointment } from "../../models/Appointment.model";
import { Booking } from "../../models/Booking.model";
import { DoctorProfile } from "../../models/Doctor.Profile.model";
import { DoctorVerification } from "../../models/Doctor.Verification.model";
import { redis } from "../../config/redis";
import { uploadFileToCloudinary } from "../../utils/cloudinaryUpload.util";
import { generateAccessToken } from "./auth.tokens";

//Register

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);

  res.status(201).json(result);
});

//Login

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body.email, req.body.password);

  if ("requiresTwoFactor" in result) {
    setTemp2FACookie(res, result.tempToken!);
    return res.status(200).json({
      requiresTwoFactor: true,
    });
  }

  setAccessTokenCookie(res, result.accessToken!);

  setRefreshCookie(res, result.refreshToken!);

  res.status(200).json({
    user: result.user,
  });
});

//Verify User Otp

export const verifyOtp = asyncHandler(async (req, res) => {
  const result = await authService.verifyOtp(req.body);

  if (result.accessToken) {
    setAccessTokenCookie(res, result.accessToken);

    setRefreshCookie(res, result.refreshToken);
  }

  res.status(200).json(result.data);
});

//Forgot Password

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);

  res.status(200).json(result);
});

//Logout

export const logout = asyncHandler(async (_req, res) => {
  clearAuthCookies(res);

  res.status(200).json({
    message: "Logged out successfully",
  });
});

//Resend Otp

export const resendOtp = asyncHandler(async (req, res) => {
  const result = await authService.resendOtp(req.body);

  res.status(200).json(result);
});

//Reset Password

export const newPassword = asyncHandler(async (req, res) => {
  const result = await authService.newPassword(req.body);

  res.status(200).json(result);
});

//Setup 2 Factor Authentication

export const setup2FA = asyncHandler(async (req, res) => {
  const authUser = req.user as AuthUserPayload;
  const result = await authService.setup2FA(authUser);

  res.status(200).json(result);
});

// Verify Two Factor Authentication

export const verify2FA = asyncHandler(async (req, res) => {
  const authUser = req.user as AuthUserPayload;

  const result = await authService.verify2FA(req.body, authUser);

  if (result.accessToken) {
    setAccessTokenCookie(res, result.accessToken);

    setRefreshCookie(res, result.refreshToken);
  }

  res.status(200).json({
    user: result.user,
  });
});

//Disable 2factor Authentication

export const disable2FA = asyncHandler(async (req, res) => {
  const authUser = req.user as AuthUserPayload;
  const result = await authService.disable2FA(authUser, req.body.password);

  res.status(200).json(result);
});

//Google Callback

export const googleCallback = asyncHandler(async (req, res) => {
  const result = await authService.googleCallback(req.user);

  if (result.redirectUrl) {
    return res.redirect(result.redirectUrl);
  }
  if (!result.accessToken || !result.refreshToken || !result.frontendRedirect) {
    throw new Error("Invalid Google callback response");
  }

  setAccessTokenCookie(res, result.accessToken);

  setRefreshCookie(res, result.refreshToken);

  return res.redirect(result.frontendRedirect);
});

//Refresh Token usign Acces Token Generate

export const refresh = asyncHandler(async (req, res) => {
  const { userId } = req.user as AuthUserPayload;
  const result = await authService.refresh(userId);

  setAccessTokenCookie(res, result.accessToken);

  res.status(200).json({
    user: result.user,
  });
});

//Get User Details

export const getMe = asyncHandler(async (req, res) => {
  const { userId } = req.user as AuthUserPayload;
  const user = await authService.getMe(userId);

  res.status(200).json({
    user,
  });
});

// Update Profile (Settings)

export const updateProfile = asyncHandler(async (req, res) => {
  const authUser = req.user as AuthUserPayload;
  const user = await User.findById(authUser.userId);

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  // Handle profile photo upload if present
  if (req.file) {
    try {
      const uploadResult = await uploadFileToCloudinary(req.file.path, "profiles");
      user.profilePhoto = uploadResult.url;
    } finally {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }
  }

  // Edit name if present
  if (req.body.name !== undefined) {
    user.name = req.body.name;
  }

  // Recalculate targets if any health metrics change
  const hasHealthOrGoalChanges =
    req.body.height !== undefined ||
    req.body.weight !== undefined ||
    req.body.age !== undefined ||
    req.body.gender !== undefined ||
    req.body.activityLevel !== undefined ||
    req.body.goalType !== undefined ||
    req.body.targetWeight !== undefined ||
    req.body.diseases !== undefined;

  if (hasHealthOrGoalChanges) {
    const height = req.body.height !== undefined ? Number(req.body.height) : user.healthProfile?.height;
    const weight = req.body.weight !== undefined ? Number(req.body.weight) : user.healthProfile?.weight;
    const age = req.body.age !== undefined ? Number(req.body.age) : user.healthProfile?.age;
    const gender = req.body.gender || user.healthProfile?.gender;
    const activityLevel = req.body.activityLevel || user.healthProfile?.activityLevel;
    const goalType = req.body.goalType || user.goal?.type;
    const targetWeight = (req.body.targetWeight !== undefined ? Number(req.body.targetWeight) : user.goal?.targetWeight) || weight;
    const diseases = req.body.diseases || user.healthProfile?.diseases || [];

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
  setAccessTokenCookie(res, newAccessToken);

  // Invalidate Redis dashboard summary cache
  const todayStr = new Date().toISOString().split("T")[0];
  await redis.del(`summary:${user._id.toString()}:${todayStr}`);

  const updatedUser = await User.findById(user._id).select("-password -twoFactorSecret");

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user: updatedUser,
  });
});

// Delete Account

export const deleteAccount = asyncHandler(async (req, res) => {
  const authUser = req.user as AuthUserPayload;
  const userId = authUser.userId;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
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

  // Clear cookies
  clearAuthCookies(res);

  return res.status(200).json({
    success: true,
    message: "Account and all associated logs deleted successfully",
  });
});
