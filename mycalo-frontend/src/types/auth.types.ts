export interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "doctor" | "subadmin" | "admin";
  isEmailVerified: boolean;
  isTwoFactorEnabled: boolean;
  profilePhoto?: string;
  onboardingCompleted: boolean;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  requiresTwoFactor: boolean;
  tempToken: string | null;
}
