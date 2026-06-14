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
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  requiresTwoFactor: boolean;
  tempToken: string | null;
  isInitialized: boolean;
}
