import jwt from "jsonwebtoken";
import { env } from "../../config/env";

export interface AccessTokenPayload {
  userId: string;
  role: string;
  email: string;
  onboardingCompleted: boolean;
  hasSubmittedVerification: boolean;
  verificationStatus: string;
}

export const generateAccessToken = (
  userId: string,
  role: string,
  email: string,
  onboardingCompleted = false,
  hasSubmittedVerification = false,
  verificationStatus = "not_submitted"
) => {
  return jwt.sign(
    { userId, role, email, onboardingCompleted, hasSubmittedVerification, verificationStatus },
    env.JWT_SECRET,
    { expiresIn: "15m" }
  );
};

export const generateRefreshToken = (userId: string) => {
  return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

export const generateTemp2FAToken = (userId: string) => {
  return jwt.sign({ userId }, env.JWT_2FA_TEMP_SECRET, { expiresIn: "15m" });
};
