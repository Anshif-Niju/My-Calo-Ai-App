import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AuthUserPayload } from "../types/index.js";
import AppError from "../errors/AppError.js";

// Access Token
export const verifyAccessToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      throw new AppError(401, "Authentication required");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as AuthUserPayload;

    req.user = decoded;

    next();
  } catch {
    throw new AppError(401, "Invalid or expired access token");
  }
};

// Refresh Token
export const verifyRefreshToken = (req: Request, res: Response, next: NextFunction) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new AppError(401, "Refresh token not found");
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as AuthUserPayload;

    req.user = {
      userId: decoded.userId,
    };

    next();
  } catch {
    throw new AppError(401, "Invalid or expired refresh token");
  }
};

// Temporary 2FA Token
export const verifyTemp2FAToken = (req: Request, res: Response, next: NextFunction) => {
  const tempToken = req.cookies.temp2FAToken;

  if (!tempToken) {
    throw new AppError(401, "2FA session expired");
  }

  try {
    const decoded = jwt.verify(tempToken, process.env.JWT_2FA_TEMP_SECRET as string) as AuthUserPayload;

    req.user = {
      userId: decoded.userId,
    };

    next();
  } catch {
    throw new AppError(401, "Invalid or expired 2FA session");
  }
};
