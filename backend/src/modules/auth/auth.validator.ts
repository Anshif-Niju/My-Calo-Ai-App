import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    otp: z.string().length(6, "OTP must be exactly 6 digits"),
  }),
});

export const twoFactorVerifySchema = z.object({
  body: z.object({
    token: z.string().length(6, "Token must be exactly 6 digits"),
    tempToken: z.string().optional(),
  }),
});

export const disable2FASchema = z.object({
  body: z.object({
    password: z.string().min(1, "Password is required"),
  }),
});


export type RegisterInput = z.infer<typeof registerSchema>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>["body"];
export type TwoFactorVerifyInput = z.infer<typeof twoFactorVerifySchema>["body"];
export type Disable2FAInput = z.infer<typeof disable2FASchema>["body"];
