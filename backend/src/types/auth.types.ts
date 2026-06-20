export type OtpType = "email_verify" | "forgot_password";

export interface AuthUserPayload {
  userId: string;
  email: string;
  role: "user" | "doctor" | "admin" | "subadmin";
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
  type: OtpType;
}

export interface ResendOtpPayload {
  email: string;
  type: OtpType;
}

export interface ResetPasswordPayload {
  resetToken: string;
  newPassword: string;
}

export interface Verify2FAPayload {
  token: string;
  tempToken?: string;
}

export interface GoogleCallbackResult {
  redirectUrl?: string;

  frontendRedirect?: string;

  accessToken?: string;

  refreshToken?: string;
}
export interface VerifyResetOtpPayload {
  email: string;
  otp: string;
}
