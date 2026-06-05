import { z } from "zod";

const passwordValidation = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter (A-Z)")
  .regex(/[a-z]/, "Must contain at least one lowercase letter (a-z)")
  .regex(/[0-9]/, "Must contain at least one number (0-9)")
  .regex(/[\W_]/, "Must contain at least one special symbol (e.g., @, #, $, !)")
  .refine(
    (password) => {
      const weakPatterns = [/12345/i, /abcdef/i, /password/i, /qwerty/i, /00000/i];
      return !weakPatterns.some((pattern) => pattern.test(password));
    },
    { message: "Password is too weak or common. Please use a stronger one." },
  );

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email format"),
    password: passwordValidation,
    role: z.enum(["user", "doctor"]).default("user"),
    phone: z.string().min(7, "Invalid phone number").max(15, "Invalid phone number"),
    countryCode: z.string().min(2, "Country code required").max(5, "Invalid country code"),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    otp: z.string().length(6, "OTP must be exactly 6 digits"),
    type: z.enum(["email_verify", "forgot_password"]),
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
  body: z.object({
    resetToken: z.string().min(1, "Reset token is required"),
    newPassword: passwordValidation,
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
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>["body"];
export type ResendOtpInput = z.infer<typeof resendOtpSchema>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>["body"];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>["body"];
export type TwoFactorVerifyInput = z.infer<typeof twoFactorVerifySchema>["body"];
export type Disable2FAInput = z.infer<typeof disable2FASchema>["body"];
