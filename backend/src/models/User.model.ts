import mongoose, { Schema } from "mongoose";
import { IUser } from "../types/index";

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    role: { type: String, enum: ["user", "doctor", "subadmin", "admin"], default: "user" },
    phone: { type: String, trim: true },
    countryCode: { type: String, trim: true }, 
    isEmailVerified: { type: Boolean, default: false },
    hasSubmittedVerification: { type: Boolean, default: false }, // for doctor verification
    isTwoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String },
    googleId: { type: String, sparse: true, unique: true },
    profilePhoto: { type: String },
    onboardingCompleted: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    healthProfile: {
      height: { type: Number },
      weight: { type: Number },
      age: { type: Number },
      gender: { type: String, enum: ["male", "female"] },
      diseases: [{ type: String }],
      bmi: { type: Number },
      bmr: { type: Number },
      activityLevel: { type: String, enum: ["sedentary", "light", "moderate", "active"] },
    },
    goal: {
      type: { type: String, enum: ["weight_loss", "weight_gain", "maintain"] },
      targetWeight: { type: Number },
    },
    dailyTargets: {
      calories: { type: Number },
      protein: { type: Number },
      carbs: { type: Number },
      fat: { type: Number },
      fiber: { type: Number },
    },
    fcmToken: { type: String },
  },
  { timestamps: true },
);

UserSchema.index({
  email: 1,
  isEmailVerified: 1,
});
UserSchema.index({ role: 1 });

export const User = mongoose.model<IUser>("User", UserSchema);
