import { Response } from "express";
import { env } from "../../config/env";

export const setRefreshCookie = (res: Response, token: string) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const setAccessTokenCookie = (res: Response, token: string) => {
  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });
};

export const setTemp2FACookie = (res: Response, token: string) => {
  res.cookie("tempToken", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 5 * 60 * 1000, // 5 minutes
  });
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
};

export const clearTemp2FACookie = (res: Response) => {
  res.clearCookie("tempToken");
};
