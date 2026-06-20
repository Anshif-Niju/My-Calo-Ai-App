import jwt from "jsonwebtoken";
import { env } from "../../config/env";

export const generateAccessToken = (userId: string, role: string, email: string) => {
  return jwt.sign({ userId, role, email }, env.JWT_SECRET, { expiresIn: "15m" });
};

export const generateRefreshToken = (userId: string) => {
  return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

export const generateTemp2FAToken = (userId: string) => {
  return jwt.sign({ userId }, env.JWT_2FA_TEMP_SECRET, { expiresIn: "15m" });
};
