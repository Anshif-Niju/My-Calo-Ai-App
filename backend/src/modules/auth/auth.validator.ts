import { z } from "zod";

export const registerSchema = z.object({
body: z
    .object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      email: z.string().email("Invalid email format"),
      password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
      confirmPassword: z.string().min(1, "Confirm password is required"),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    otp: z.string().length(6, "OTP must be exactly 6 digits"),
  }),
});


export const resendOtpSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    type: z.enum(["email_verify", "forgot_password"]),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
  }),
});


export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
  }),
});


export const resetPasswordSchema = z.object({
  body: z
    .object({
      email: z.string().email("Invalid email format"),
      otp: z.string().length(6, "OTP must be exactly 6 digits"),
      newPassword: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
      confirmPassword: z.string().min(1, "Confirm password is required"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
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

// Exported types — use these in your controller for type-safe req.body
export type RegisterInput = z.infer<typeof registerSchema>["body"];
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>["body"];
export type ResendOtpInput = z.infer<typeof resendOtpSchema>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>["body"];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>["body"];
export type TwoFactorVerifyInput = z.infer<typeof twoFactorVerifySchema>["body"];
export type Disable2FAInput = z.infer<typeof disable2FASchema>["body"];
