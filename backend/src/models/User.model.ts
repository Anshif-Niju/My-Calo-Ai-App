import bcrypt from "bcrypt";
import mongoose, { Schema } from "mongoose";
import { IUser } from "../types/index";

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    role: { type: String, enum: ["user", "doctor", "subadmin", "admin"], default: "user" },
    phone: { type: String, trim: true },
    countryCode: { type: String, trim: true }, // "+91", "+1" etc.
    isEmailVerified: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false }, // for doctor verification
    isTwoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String },
    googleId: { type: String, sparse: true, unique: true },
    profilePhoto: { type: String },
    onboardingCompleted: { type: Boolean, default: false },
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

UserSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 10);
});

UserSchema.index({ role: 1 });

export const User = mongoose.model<IUser>("User", UserSchema);
