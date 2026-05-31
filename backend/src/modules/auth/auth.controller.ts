import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import * as authService from "./auth.service";

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const register = async (req: Request, res: Response) => {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const result = await authService.verifyEmail(email, otp);

    setRefreshCookie(res, result.refreshToken);
    res.status(200).json({
      accessToken: result.accessToken,
      user: result.user
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const result = await authService.loginUser(req.body);

    if (result.requiresTwoFactor) {
      return res.status(200).json({ requiresTwoFactor: true, tempToken: result.tempToken });
    }

    setRefreshCookie(res, result.refreshToken!);
    res.status(200).json({
      accessToken: result.accessToken,
      user: result.user
    });
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: "No refresh token provided" });

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET as string) as any;
    const accessToken = authService.generateAccessToken(decoded.userId, decoded.role, decoded.email);

    res.status(200).json({ accessToken });
  } catch (error) {
    res.status(401).json({ message: "Invalid refresh token" });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie("refreshToken");
  res.status(200).json({ message: "Logged out successfully" });
};

export const setup2FA = async (req: Request, res: Response) => {
  try {
    const result = await authService.setup2FA(req.user.userId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const verify2FA = async (req: Request, res: Response) => {
  try {
    let userId = req.user?.userId; // If already logged in

    // If coming from login flow via tempToken
    if (req.body.tempToken) {
       const decoded = jwt.verify(req.body.tempToken, process.env.JWT_SECRET as string) as any;
       userId = decoded.userId;
    }

    const result = await authService.verify2FA(userId, req.body.token);

    setRefreshCookie(res, result.refreshToken);
    res.status(200).json({ accessToken: result.accessToken, user: result.user });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
