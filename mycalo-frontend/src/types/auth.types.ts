export interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "doctor" | "subadmin" | "admin";
  isEmailVerified: boolean;
  isVerified: boolean;
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
  accessToken: string | null;
  requiresTwoFactor: boolean;
  tempToken: string | null;
  authInitialized: boolean;
}
