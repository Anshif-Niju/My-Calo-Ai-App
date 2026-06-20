import bcrypt from "bcrypt";
import AppError from "../../errors/AppError";
import jwt from "jsonwebtoken";
import qrcode from "qrcode";
import speakeasy from "speakeasy";
import { env } from "../../config/env";
import { redis } from "../../config/redis";
import { emailQueue } from "../../jobs/queues/email.queue";
import { DoctorVerification } from "../../models/Doctor.Verification.model";
import { User } from "../../models/User.model";
import { AuthUserPayload, ResendOtpPayload, Verify2FAPayload, VerifyResetOtpPayload, ResetPasswordPayload, GoogleCallbackResult } from "../../types/index.js";
import { generateOTP } from "../../utils/otp.utils";
import type { LoginInput, RegisterInput } from "./auth.validator";
import { generateAccessToken, generateRefreshToken, generateTemp2FAToken } from "./auth.tokens";

//Login

export const login = async (email: string, password: string) => {
  const user = await User.findOne({
    email,
  }).select("+password");

  if (!user || !user.password) {
    throw new AppError(401, "Invalid credentials");
  }

  if (user.isBlocked) {
    throw new AppError(403, "Account blocked");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new AppError(401, "Invalid credentials");
  }

  if (!user.isEmailVerified) {
    throw new AppError(400, "Verify your email first");
  }

  if (user.isTwoFactorEnabled) {
    return {
      requiresTwoFactor: true,
      tempToken: generateTemp2FAToken(user.id),
    };
  }

  let userData: any = user.toObject();

  if (user.role === "doctor") {
    const verification = await DoctorVerification.findOne({
      userId: user._id,
    }).lean();

    userData = {
      ...userData,
      verificationStatus: verification?.verificationStatus ?? "not_submitted",
    };
  }

  const accessToken = generateAccessToken(user.id, user.role, user.email);

  const refreshToken = generateRefreshToken(user.id);

  return {
    accessToken,
    refreshToken,
    user: userData,
  };
};

//Register

export const register = async (payload: RegisterInput) => {
  const { name, email, password, role, phone, countryCode } = payload;

  const existingUser = await User.exists({
    email,
    isEmailVerified: true,
  });

  if (existingUser) {
    throw new AppError(409, "This email is already registered. Please login instead.");
  }

  await User.findOneAndDelete({
    email,
    isEmailVerified: false,
  });

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
    phone,
    countryCode,
  });

  if (role === "doctor") {
    await DoctorVerification.create({
      userId: user._id,
    });
  }

  const otp = generateOTP();

  await redis.set(`otp:${email}:email_verify`, otp, "EX", 180);

  await emailQueue.add("send-verify-email", {
    type: "verify_email",
    to: email,
    subject: "Verify your MyCalo AI account",
    otp,
  });

  return {
    message: "OTP sent to your email",
  };
};

//Verify User Otp

export const verifyOtp = async (payload: { email: string; otp: string; type: string }) => {
  const { email, otp, type } = payload;

  const storedOtp = await redis.get(`otp:${email}:${type}`);

  if (!storedOtp) {
    throw new AppError(400, "OTP expired. Please request a new one.");
  }

  if (storedOtp !== otp) {
    throw new AppError(400, "Incorrect OTP");
  }

  await redis.del(`otp:${email}:${type}`);

  if (type === "email_verify") {
    const user = await User.findOneAndUpdate(
      { email },
      {
        isEmailVerified: true,
      },
      {
        returnDocument: "after",
      },
    );

    if (!user) {
      throw new AppError(404, "User not found");
    }

    return {
      accessToken: generateAccessToken(user.id, user.role, user.email),

      refreshToken: generateRefreshToken(user.id),

      data: {
        user,
      },
    };
  }

  const resetToken = jwt.sign({ email }, env.JWT_SECRET, {
    expiresIn: "10m",
  });

  return {
    data: {
      resetToken,
    },
  };
};

//Forgot Password

export const forgotPassword = async (email: string) => {
  const user = await User.findOne({
    email,
  });

  if (!user) {
    throw new AppError(400, "This email is not registered");
  }

  const otp = generateOTP();

  await redis.set(`otp:${email}:forgot_password`, otp, "EX", 180);

  await emailQueue.add("forgot-password-otp", {
    type: "forgot_password",
    to: email,
    subject: "Reset your MyCalo AI password",
    otp,
  });

  return {
    message: "OTP sent.",
  };
};

//Refresh Token Acces Token Genrating

export const refresh = async (refreshToken: string) => {
  if (!refreshToken) {
    throw new AppError(401, "No refresh token provided");
  }

  const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as {
    userId: string;
  };

  const user = await User.findById(decoded.userId).lean();

  if (!user) {
    throw new AppError(401, "User not found");
  }

  let userData: any = user;

  if (user.role === "doctor") {
    const verification = await DoctorVerification.findOne({
      userId: user._id,
    }).lean();

    userData = {
      ...userData,
      verificationStatus: verification?.verificationStatus ?? "not_submitted",
    };
  }

  return {
    accessToken: generateAccessToken(user._id.toString(), user.role, user.email),
    user: userData,
  };
};

//Resend Otp

export const resendOtp = async (payload: ResendOtpPayload) => {
  const { email, type } = payload;

  const rateLimitKey = `resend_limit:${email}:${type}`;

  const attempts = await redis.incr(rateLimitKey);

  if (attempts === 1) {
    await redis.expire(rateLimitKey, 600);
  }

  if (attempts > 3) {
    throw new AppError(429, "Too many OTP requests");
  }

  const user = await User.findOne({
    email,
  });

  if (!user) {
    return {
      message: "If this email is registered, an OTP has been sent.",
    };
  }

  const otp = generateOTP();

  await redis.set(`otp:${email}:${type}`, otp, "EX", 180);

  const subject = type === "email_verify" ? "Your new MyCalo AI verification code" : "Your new MyCalo AI password reset code";

  await emailQueue.add("resend-otp", {
    type: type === "email_verify" ? "verify_email" : "forgot_password",
    to: email,
    subject,
    otp,
  });

  return {
    message: "A new OTP has been sent.",
  };
};

//VerifyResetOtp

export const verifyResetOtp = async (payload: VerifyResetOtpPayload) => {
  const { email, otp } = payload;

  const storedOtp = await redis.get(`otp:${email}:forgot_password`);

  if (storedOtp !== otp) {
    throw new AppError(400, "Incorrect or expired OTP");
  }

  const resetToken = jwt.sign({ email }, env.JWT_SECRET, {
    expiresIn: "10m",
  });

  return {
    resetToken,
  };
};

//ResetPassword

export const resetPassword = async (payload: ResetPasswordPayload) => {
  const { resetToken, newPassword } = payload;

  const decoded = jwt.verify(resetToken, env.JWT_SECRET) as {
    email: string;
  };

  const user = await User.findOne({
    email: decoded.email,
  }).select("+password");

  if (!user) {
    throw new AppError(404, "User not found");
  }

  user.password = await bcrypt.hash(newPassword, 10);

  await user.save();

  return {
    message: "Password reset successful",
  };
};

//Google CallBack
export const googleCallback = async (user: any): Promise<GoogleCallbackResult> => {
  if (!user) {
    return {
      redirectUrl: `${env.FRONTEND_URL}/login?error=auth_failed`,
    };
  }

  if (user.isTwoFactorEnabled) {
    const tempToken = generateTemp2FAToken(user._id.toString());

    return {
      redirectUrl: `${env.FRONTEND_URL}/verify-2fa?tempToken=${tempToken}`,
    };
  }

  const accessToken = generateAccessToken(user._id.toString(), user.role, user.email);

  const refreshToken = generateRefreshToken(user._id.toString());

  await emailQueue.add("google-login-notification", {
    type: "login_success",
    to: user.email,
    subject: "New login to your MyCalo AI account",
  });

  return {
    accessToken,
    refreshToken,
    frontendRedirect: `${env.FRONTEND_URL}/google-callback`,
  };
};

//Setup2FA

export const setup2FA = async (authUser: AuthUserPayload) => {
  const user = await User.findById(authUser.userId);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  const secret = speakeasy.generateSecret({
    name: "MyCalo AI",
  });

  user.twoFactorSecret = secret.base32;

  await user.save();

  const qrCode = await qrcode.toDataURL(secret.otpauth_url!);

  return {
    qrCode,
    secret: secret.base32,
  };
};

//Verify2FA

export const verify2FA = async (payload: Verify2FAPayload, authUser?: AuthUserPayload) => {
  let userId = authUser?.userId;

  const { token, tempToken } = payload;

  if (tempToken) {
    const decoded = jwt.verify(tempToken, env.JWT_2FA_TEMP_SECRET) as any;

    userId = decoded.userId;
  }

  const user = await User.findById(userId);

  if (!user || !user.twoFactorSecret) {
    throw new AppError(400, "2FA not configured");
  }

  const isValid = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: "base32",
    token,
    window: 1,
  });

  if (!isValid) {
    throw new AppError(400, "Invalid 2FA token");
  }

  user.isTwoFactorEnabled = true;

  await user.save();

  return {
    accessToken: generateAccessToken(user.id, user.role, user.email),

    refreshToken: generateRefreshToken(user.id),

    user,
  };
};

//Disable2FA

export const disable2FA = async (authUser: AuthUserPayload, password: string) => {
  const user = await User.findById(authUser.userId).select("+password");

  if (!user || !user.password) {
    throw new AppError(404, "User not found");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new AppError(401, "Incorrect password");
  }

  user.isTwoFactorEnabled = false;

  user.twoFactorSecret = undefined;

  await user.save();

  return {
    message: "Two-Factor Authentication disabled successfully",
  };
};

//Get User details

export const getMe = async (userId: string) => {
  const user = await User.findById(userId).select("-password -twoFactorSecret").lean();

  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (user.role === "doctor") {
    const verification = await DoctorVerification.findOne({
      userId,
    }).lean();

    return {
      ...user,
      verificationStatus: verification?.verificationStatus ?? "not_submitted",
    };
  }

  return user;
};
