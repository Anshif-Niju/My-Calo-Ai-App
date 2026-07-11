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
    {
      message: "Password is too weak or common. Please use a stronger one.",
    },
  );

// 1. Login Schema

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

// 2. Register Schema

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email format"),
    password: passwordValidation,
    confirmPassword: z.string(),
    role: z.enum(["user", "doctor"]),
    phone: z.string().min(8, "Invalid phone number").max(15, "Invalid phone number").regex(/^\d+$/, "Phone number must contain only digits"),
    countryCode: z.string().min(2).max(5),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// 3. Forgot Password Schema

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
});


// 4. Reset Password Schema

export const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });




export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
