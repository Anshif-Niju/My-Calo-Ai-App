import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import qrcode from "qrcode";
import speakeasy from "speakeasy";
import { redis } from "../../config/redis";
import { emailQueue } from "../../jobs/queues/email.queue";
import { User } from "../../models/User.model";
import { generateOTP } from "../../utils/otp.utils";

// Token Generators
export const generateAccessToken = (userId: string, role: string, email: string) => {
  return jwt.sign({ userId, role, email }, process.env.JWT_SECRET as string, { expiresIn: "15m" });
};

export const generateRefreshToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.REFRESH_SECRET as string, { expiresIn: "7d" });
};

export const registerUser = async (data: any) => {
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) throw new Error("Email already registered");

  const user = new User({
    name: data.name,
    email: data.email,
    password: data.password, // Pre-save hook handles bcrypt hashing
  });
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

  return { message: "OTP sent to your email" };
};

export const verifyEmail = async (email: string, otp: string) => {
  const storedOtp = await redis.get(`otp:${email}:email_verify`);

  if (!storedOtp) throw new Error("OTP expired or invalid");
  if (storedOtp !== otp) throw new Error("Incorrect OTP");

  const user = await User.findOneAndUpdate(
    { email },
    { isEmailVerified: true },
    { new: true }
  );

  if (!user) throw new Error("User not found");

  // Clean up Redis
  await redis.del(`otp:${email}:email_verify`);

  const accessToken = generateAccessToken(user.id, user.role, user.email);
  const refreshToken = generateRefreshToken(user.id);

  return { accessToken, refreshToken, user };
};

export const loginUser = async (data: any) => {
  const user = await User.findOne({ email: data.email }).select("+password");
  if (!user || !user.password) throw new Error("Invalid credentials");

  const isMatch = await bcrypt.compare(data.password, user.password);
  if (!isMatch) throw new Error("Invalid credentials");
  if (!user.isEmailVerified) throw new Error("Please verify your email first");

  if (user.isTwoFactorEnabled) {
    const tempToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET as string, { expiresIn: "5m" });
    return { requiresTwoFactor: true, tempToken };
  }

  const accessToken = generateAccessToken(user.id, user.role, user.email);
  const refreshToken = generateRefreshToken(user.id);

  return { accessToken, refreshToken, user, requiresTwoFactor: false };
};

export const setup2FA = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const secret = speakeasy.generateSecret({ name: "MyCalo AI" });
  user.twoFactorSecret = secret.base32;
  await user.save();

  const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url as string);
  return { qrCode: qrCodeUrl, secret: secret.base32 };
};

export const verify2FA = async (userId: string, token: string) => {
  const user = await User.findById(userId);
  if (!user || !user.twoFactorSecret) throw new Error("2FA not configured");

  const isValid = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: "base32",
    token,
  });

  if (!isValid) throw new Error("Invalid 2FA token");

  user.isTwoFactorEnabled = true;
  await user.save();

  const accessToken = generateAccessToken(user.id, user.role, user.email);
  const refreshToken = generateRefreshToken(user.id);

  return { accessToken, refreshToken, user };
};
