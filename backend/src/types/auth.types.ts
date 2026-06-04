import mongoose, { Document } from "mongoose";

export type UserRole = "user" | "doctor" | "subadmin" | "admin";

export interface AuthUserPayload {
  userId: string;
  role: UserRole;
  email: string;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  phone?: string;
  countryCode?: string;
  isEmailVerified: boolean;
  isVerified: boolean; 
  isTwoFactorEnabled: boolean;
  twoFactorSecret?: string;
  googleId?: string;
  profilePhoto?: string;
  onboardingCompleted: boolean;
  healthProfile?: {
    height: number;
    weight: number;
    age: number;
    gender: "male" | "female";
    diseases: string[];
    bmi: number;
    bmr: number;
    activityLevel: "sedentary" | "light" | "moderate" | "active";
  };
  goal?: {
    type: "weight_loss" | "weight_gain" | "maintain";
    targetWeight: number;
  };
  dailyTargets?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  fcmToken?: string;
  createdAt: Date;
  updatedAt: Date;
}
