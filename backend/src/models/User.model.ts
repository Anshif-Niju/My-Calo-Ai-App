import bcrypt from "bcrypt";
import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  role: "user" | "doctor" | "subadmin" | "admin";
  isEmailVerified: boolean;
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

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    role: { type: String, enum: ["user", "doctor", "subadmin", "admin"], default: "user" },
    isEmailVerified: { type: Boolean, default: false },
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
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

export const User = mongoose.model<IUser>("User", UserSchema);
