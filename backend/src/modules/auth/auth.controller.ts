import { Request, Response } from "express";
import * as authService from "./auth.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { setAccessTokenCookie, setRefreshCookie, clearAuthCookies } from "./auth.cookies";
import { AuthUserPayload } from "../../types";

//Register

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);

  res.status(201).json(result);
});

//Login

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body.email, req.body.password);

  if ("requiresTwoFactor" in result) {
    return res.status(200).json(result);
  }

  setAccessTokenCookie(res, result.accessToken);

  setRefreshCookie(res, result.refreshToken);

  res.status(200).json({
    user: result.user,
  });
});

//Verify User Otp

export const verifyOtp = asyncHandler(async (req, res) => {
  const result = await authService.verifyOtp(req.body);

  if (result.accessToken) {
    setAccessTokenCookie(res, result.accessToken);

    setRefreshCookie(res, result.refreshToken);
  }

  res.status(200).json(result.data);
});

//Forgot Password

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);

  res.status(200).json(result);
});

//Refresh Token usign Acces Token Generate

export const refresh = asyncHandler(async (req, res) => {
  const result = await authService.refresh(req.cookies.refreshToken);

  setAccessTokenCookie(res, result.accessToken);

  res.status(200).json({
    user: result.user,
  });
});

//Logout

export const logout = asyncHandler(async (_req, res) => {
  clearAuthCookies(res);

  res.status(200).json({
    message: "Logged out successfully",
  });
});

//Resend Otp

export const resendOtp = asyncHandler(async (req, res) => {
  const result = await authService.resendOtp(req.body);

  res.status(200).json(result);
});

//Verify Reset Otp

export const verifyResetOtp = asyncHandler(async (req, res) => {
  const result = await authService.verifyResetOtp(req.body);

  res.status(200).json(result);
});

//Reset Password

export const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.body);

  res.status(200).json(result);
});

//Setup 2 Factor Authentication

export const setup2FA = asyncHandler(async (req, res) => {
  const authUser = req.user as AuthUserPayload;
  const result = await authService.setup2FA(authUser);

  res.status(200).json(result);
});

// Verify Two Factor Authentication

export const verify2FA = asyncHandler(async (req, res) => {
  const authUser = req.user as AuthUserPayload;

  const result = await authService.verify2FA(req.body, authUser);

  if (result.accessToken) {
    setAccessTokenCookie(res, result.accessToken);

    setRefreshCookie(res, result.refreshToken);
  }

  res.status(200).json({
    user: result.user,
  });
});

//Disable 2factor Authentication

export const disable2FA = asyncHandler(async (req, res) => {
  const authUser = req.user as AuthUserPayload;
  const result = await authService.disable2FA(authUser, req.body.password);

  res.status(200).json(result);
});

//Google Callback

export const googleCallback = asyncHandler(async (req, res) => {
  const result = await authService.googleCallback(req.user);

  if (result.redirectUrl) {
    return res.redirect(result.redirectUrl);
  }
  if (!result.accessToken || !result.refreshToken || !result.frontendRedirect) {
    throw new Error("Invalid Google callback response");
  }

  setAccessTokenCookie(res, result.accessToken);

  setRefreshCookie(res, result.refreshToken);

  return res.redirect(result.frontendRedirect);
});

//Get User Details

export const getMe = asyncHandler(async (req, res) => {
  const authUser = req.user as AuthUserPayload;
  const user = await authService.getMe(authUser.userId);

  res.status(200).json({
    user,
  });
});
