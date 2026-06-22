export interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "doctor" | "subadmin" | "admin";
  isEmailVerified: boolean;
  hasSubmittedVerification: boolean;
  onboardingCompleted: boolean;
  verificationStatus?: string;
  isTwoFactorEnabled: boolean;
  phone?: string;
  countryCode?: string;
  profilePhoto?: string;
  googleId?: string;
  fcmToken?: string;
  healthProfile?: {
    height?: number;
    weight?: number;
    age?: number;
    gender?: "male" | "female";
    diseases?: string[];
    bmi?: number;
    bmr?: number;
    activityLevel?: "sedentary" | "light" | "moderate" | "active";
  };
  goal?: {
    type?: "weight_loss" | "weight_gain" | "maintain";
    targetWeight?: number;
  };
  dailyTargets?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  requiresTwoFactor: boolean;
  tempToken: string | null;
  isInitialized: boolean;
}
