import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import { redis } from "../../config/redis";
import { emailQueue } from "../../jobs/queues/email.queue";
import { User } from "../../models/User.model";
import { generateOTP } from "../../utils/otp.utils";
import { AuthUserPayload } from "../../types/express";

// HELPERS & TOKEN GENERATORS

const generateAccessToken = (userId: string, role: string, email: string): string => {
  return jwt.sign({ userId, role, email }, process.env.JWT_SECRET as string, { expiresIn: "15m" });
};

const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.REFRESH_SECRET as string, { expiresIn: "7d" });
};

const setRefreshCookie = (res: Response, token: string): void => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// CONTROLLER HANDLERS

// 1. REGISTER

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already registered" });

    const user = new User({ name, email, password });
    await user.save();

    const otp = generateOTP();

    // Store in Redis with exactly 60 seconds TTL
    await redis.set(`otp:${user.email}:email_verify`, otp, "EX", 60);

    // Add background job to BullMQ
    await emailQueue.add("send-verify-email", {
      to: user.email,
      subject: "Verify your MyCalo AI account",
      otp,
    });

    return res.status(201).json({ message: "OTP sent to your email" });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

// 2. EMAIL OTP VERIFICATION

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    const storedOtp = await redis.get(`otp:${email}:email_verify`);
    if (!storedOtp) return res.status(400).json({ message: "OTP expired or invalid" });
    if (storedOtp !== otp) return res.status(400).json({ message: "Incorrect OTP" });

    const user = await User.findOneAndUpdate(
      { email },
      { isEmailVerified: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    // Clean up Redis
    await redis.del(`otp:${email}:email_verify`);

    const accessToken = generateAccessToken(user.id, user.role, user.email);
    const refreshToken = generateRefreshToken(user.id);

    setRefreshCookie(res, refreshToken);
    return res.status(200).json({ accessToken, user });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

// 3. LOGIN

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user || !user.password) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });
    if (!user.isEmailVerified) return res.status(400).json({ message: "Please verify your email first" });

    if (user.isTwoFactorEnabled) {
      const tempToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET as string, { expiresIn: "5m" });
      return res.status(200).json({ requiresTwoFactor: true, tempToken });
    }

    const accessToken = generateAccessToken(user.id, user.role, user.email);
    const refreshToken = generateRefreshToken(user.id);

    setRefreshCookie(res, refreshToken);
    return res.status(200).json({ accessToken, user });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

// 4.  REFRESH TOKEN (access token generating)

export const refresh = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: "No refresh token provided" });

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET as string) as any;

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ message: "User not found" });

    const accessToken = generateAccessToken(user.id, user.role, user.email);
    return res.status(200).json({ accessToken });
  } catch (error) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
};

// 5. LOGOUT

export const logout = (req: Request, res: Response) => {
  res.clearCookie("refreshToken");
  return res.status(200).json({ message: "Logged out successfully" });
};

// 6. ACTIVATE TFA AUTHENTICATION

export const setup2FA = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const secret = speakeasy.generateSecret({ name: "MyCalo AI" });
    user.twoFactorSecret = secret.base32;
    await user.save();

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url as string);
    return res.status(200).json({ qrCode: qrCodeUrl, secret: secret.base32 });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

// 7. VERIFY TFA AUTHENTICATION

export const verify2FA = async (req: Request, res: Response) => {
  try {
    let userId = req.user?.userId;
    const { token, tempToken } = req.body;

    // Handle the 2FA during Login (where user has a tempToken but isn't technically fully authenticated yet)
    if (tempToken) {
      const decoded = jwt.verify(tempToken, process.env.JWT_SECRET as string) as any;
      userId = decoded.userId;
    }

    if (!userId) return res.status(400).json({ message: "User context not identified" });

    const user = await User.findById(userId);
    if (!user || !user.twoFactorSecret) return res.status(400).json({ message: "2FA not configured for this user" });

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
    });

    if (!isValid) return res.status(400).json({ message: "Invalid 2FA token" });

    if (!user.isTwoFactorEnabled) {
      user.isTwoFactorEnabled = true;
      await user.save();
    }

    const accessToken = generateAccessToken(user.id, user.role, user.email);
    const refreshToken = generateRefreshToken(user.id);

    setRefreshCookie(res, refreshToken);
    return res.status(200).json({ accessToken, user });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};


// 8. DISABLE 2FA

export const disable2FA = async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: "Password is required to disable 2FA" });

    const user = await User.findById(req.user.userId).select("+password");
    if (!user || !user.password) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid password credentials" });

    user.isTwoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();

    return res.status(200).json({ message: "Two-Factor Authentication disabled successfully" });
  } catch (error: any) {
    return res.status(400).json({ message: error.message });
  }
};

// 9. Google Callback

export const googleCallback = async (req: Request, res: Response) => {
  try {

    const user = req.user as any;

    if (!user) return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);


    const accessToken = jwt.sign(
      { userId: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: "15m" }
    );
    const refreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_SECRET as string, { expiresIn: "7d" });


    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });


    return res.redirect(`${process.env.FRONTEND_URL}/auth-callback?token=${accessToken}`);
  } catch (error) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
  }
};
