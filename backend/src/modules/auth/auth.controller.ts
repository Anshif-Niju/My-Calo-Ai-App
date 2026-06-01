import bcrypt from "bcrypt";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import qrcode from "qrcode";
import speakeasy from "speakeasy";
import { redis } from "../../config/redis";
import { emailQueue } from "../../jobs/queues/email.queue";
import { User } from "../../models/User.model";
import { AuthUserPayload } from "../../types/index.js";
import { getErrorMessage } from "../../utils/error.util";
import { generateOTP } from "../../utils/otp.utils";
import { env } from '../../config/env';

// Token helpers
const generateAccessToken = (userId: string, role: string, email: string): string => jwt.sign({ userId, role, email }, env.JWT_SECRET , { expiresIn: "15m" });

const generateRefreshToken = (userId: string): string => jwt.sign({ userId }, env.JWT_REFRESH_SECRET , { expiresIn: "7d" });

const generateTemp2FAToken = (userId: string): string => jwt.sign({ userId }, env.JWT_2FA_TEMP_SECRET , { expiresIn: "5m" });

const setRefreshCookie = (res: Response, token: string): void => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

// 1. REGISTER

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const user = new User({ name, email, password });
    await user.save();

    const otp = generateOTP();
    await redis.set(`otp:${email}:email_verify`, otp, "EX", 60);

    await emailQueue.add("send-verify-email", {
      type: "verify_email",
      to: email,
      subject: "Verify your MyCalo AI account",
      otp,
    });

    return res.status(201).json({ message: "OTP sent to your email" });
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

// 2. VERIFY EMAIL

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    const storedOtp = await redis.get(`otp:${email}:email_verify`);
    if (!storedOtp) {
      return res.status(400).json({ message: "OTP expired. Please request a new one." });
    }
    if (storedOtp !== otp) {
      return res.status(400).json({ message: "Incorrect OTP" });
    }

    const user = await User.findOneAndUpdate({ email }, { isEmailVerified: true }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });

    await redis.del(`otp:${email}:email_verify`);

    const accessToken = generateAccessToken(user.id, user.role, user.email);
    const refreshToken = generateRefreshToken(user.id);
    setRefreshCookie(res, refreshToken);

    return res.status(200).json({ accessToken, user });
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

// 3. RESEND OTP

export const resendOtp = async (req: Request, res: Response) => {
  try {
    const { email, type } = req.body;

    const rateLimitKey = `resend_limit:${email}:${type}`;
    const attempts = await redis.incr(rateLimitKey);

    if (attempts === 1) {
      await redis.expire(rateLimitKey, 600); // 10 minutes window safely initialized
    }

    if (attempts > 3) {
      return res.status(429).json({
        message: "Too many OTP requests. Please wait 10 minutes before trying again.",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ message: "If this email is registered, an OTP has been sent." });
    }

    if (type === "email_verify" && user.isEmailVerified) {
      return res.status(400).json({ message: "Email is already verified." });
    }

    const otp = generateOTP();
    await redis.set(`otp:${email}:${type}`, otp, "EX", 60);

    const subject = type === "email_verify" ? "Your new MyCalo AI verification code" : "Your new MyCalo AI password reset code";

    await emailQueue.add("resend-otp", {
      type: type === "email_verify" ? "verify_email" : "forgot_password",
      to: email,
      subject,
      otp,
    });

    return res.status(200).json({ message: "A new OTP has been sent to your email." });
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

// 4. LOGIN

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isEmailVerified) {
      return res.status(400).json({ message: "Please verify your email before logging in." });
    }

    if (user.isTwoFactorEnabled) {
      const tempToken = generateTemp2FAToken(user.id);
      return res.status(200).json({ requiresTwoFactor: true, tempToken });
    }

    const accessToken = generateAccessToken(user.id, user.role, user.email);
    const refreshToken = generateRefreshToken(user.id);
    setRefreshCookie(res, refreshToken);

    emailQueue
      .add("login-success-notification", {
        type: "login_success",
        to: user.email,
        subject: "New login to your MyCalo AI account",
      })
      .catch((err) => console.error("Failed to queue login email:", err));

    return res.status(200).json({ accessToken, user });
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

// 5. FORGOT PASSWORD

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ message: "If this email is registered, a reset code has been sent." });
    }

    const otp = generateOTP();
    await redis.set(`otp:${email}:forgot_password`, otp, "EX", 60);

    await emailQueue.add("forgot-password-otp", {
      type: "forgot_password",
      to: email,
      subject: "Reset your MyCalo AI password",
      otp,
    });

    return res.status(200).json({ message: "If this email is registered, a reset code has been sent." });
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

// 6. RESET PASSWORD

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;

    const storedOtp = await redis.get(`otp:${email}:forgot_password`);
    if (!storedOtp) {
      return res.status(400).json({ message: "OTP expired. Please request a new reset code." });
    }
    if (storedOtp !== otp) {
      return res.status(400).json({ message: "Incorrect OTP" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = newPassword;
    await user.save();

    await redis.del(`otp:${email}:forgot_password`);

    return res.status(200).json({ message: "Password reset successfully. Please log in." });
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

// 7. REFRESH TOKEN

export const refresh = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET as string) as any;
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ message: "User not found" });

    const accessToken = generateAccessToken(user.id, user.role, user.email);
    return res.status(200).json({ accessToken });
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired refresh token" });
  }
};

// 8. LOGOUT

export const logout = (_req: Request, res: Response) => {
  res.clearCookie("refreshToken");
  return res.status(200).json({ message: "Logged out successfully" });
};

// 9. SETUP 2FA

export const setup2FA = async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUserPayload | undefined;
    if (!authUser?.userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(authUser.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const secret = speakeasy.generateSecret({ name: "MyCalo AI" });
    user.twoFactorSecret = secret.base32;
    await user.save();

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url as string);
    return res.status(200).json({ qrCode: qrCodeUrl, secret: secret.base32 });
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

// 10. VERIFY 2FA

export const verify2FA = async (req: Request, res: Response) => {
  try {
    let userId = (req.user as AuthUserPayload | undefined)?.userId;
    const { token, tempToken } = req.body;

    if (tempToken) {
      // Use dedicated 2FA temporary handshake secret
      const decoded = jwt.verify(tempToken, env.JWT_2FA_TEMP_SECRET as string) as any;
      userId = decoded.userId;
    }

    if (!userId) {
      return res.status(400).json({ message: "User context not identified" });
    }

    const user = await User.findById(userId);
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ message: "2FA not configured for this user" });
    }

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!isValid) {
      return res.status(400).json({ message: "Invalid 2FA token. Check your authenticator app." });
    }

    if (!user.isTwoFactorEnabled) {
      user.isTwoFactorEnabled = true;
      await user.save();
    }

    const accessToken = generateAccessToken(user.id, user.role, user.email);
    const refreshToken = generateRefreshToken(user.id);
    setRefreshCookie(res, refreshToken);

    return res.status(200).json({ accessToken, user });
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

// 11. DISABLE 2FA

export const disable2FA = async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    const authUser = req.user as AuthUserPayload | undefined;

    if (!authUser?.userId) {
      return res.status(401).json({ message: "Unauthorized: Missing user context" });
    }
    const user = await User.findById(authUser.userId).select("+password");
    if (!user || !user.password) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    user.isTwoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();

    return res.status(200).json({ message: "Two-Factor Authentication disabled successfully" });
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

// 12. GOOGLE CALLBACK

export const googleCallback = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    if (!user) {
      return res.redirect(`${env.FRONTEND_URL}/login?error=auth_failed`);
    }

    // Direct user to 2FA layout if enabled via OAuth link
    if (user.isTwoFactorEnabled) {
      const tempToken = generateTemp2FAToken(user._id.toString());
      return res.redirect(`${env.FRONTEND_URL}/verify-2fa?tempToken=${tempToken}`);
    }

    const accessToken = generateAccessToken(user._id.toString(), user.role, user.email);
    const refreshToken = generateRefreshToken(user._id.toString());
    setRefreshCookie(res, refreshToken);

    emailQueue
      .add("google-login-notification", {
        type: "login_success",
        to: user.email,
        subject: "New login to your MyCalo AI account",
      })
      .catch((err) => console.error("Failed to queue Google login email:", err));

    return res.redirect(`${env.FRONTEND_URL}/auth-callback?token=${accessToken}`);
  } catch (error) {
    return res.redirect(`${env.FRONTEND_URL}/login?error=server_error`);
  }
};
