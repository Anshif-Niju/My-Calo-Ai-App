import { z } from "zod";

//  USER PROFILE

export const userProfileSchema = z.object({
  height: z.number({ required_error: "Height is required" }).min(50, "Height must be at least 50cm").max(300, "Height seems invalid"),

  weight: z.number({ required_error: "Weight is required" }).min(10, "Weight must be at least 10kg").max(500, "Weight seems invalid"),

  age: z.number({ required_error: "Age is required" }).min(10, "Age must be at least 10").max(120, "Age seems invalid"),

  gender: z.enum(["male", "female"], {
    required_error: "Gender is required",
  }),

  diseases: z.array(z.string()).optional().default([]),

  activityLevel: z.enum(["sedentary", "light", "moderate", "active"], {
    required_error: "Activity level is required",
  }),

  goalType: z.enum(["weight_loss", "weight_gain", "maintain"], {
    required_error: "Goal is required",
  }),

  targetWeight: z.number().min(10).max(500).optional(),
});

//  DOCTOR VERIFICATION

export const doctorVerificationSchema = z.object({
  specialization: z.string({ required_error: "Specialization is required" }).min(2, "Specialization too short").max(100),

  experience: z.number({ required_error: "Experience is required" }).min(0, "Experience cannot be negative").max(70, "Experience seems invalid"),

  registrationNumber: z.string({ required_error: "Registration number is required" }).min(3, "Invalid registration number"),

  registrationCouncil: z.string({ required_error: "Registration council is required" }).min(2, "Invalid council name"),

  registrationYear: z.number({ required_error: "Registration year is required" }).min(1950, "Invalid year").max(new Date().getFullYear(), "Year cannot be in the future"),

  // S3 URLs — frontend upload ചെയ്‌ത ശേഷം URL അയക്കും
  mcuCertificate: z.string({ required_error: "MCU certificate is required" }).url("Invalid file URL"),

  degreeCertificate: z.string({ required_error: "Degree certificate is required" }).url("Invalid file URL"),

  governmentId: z.string({ required_error: "Government ID is required" }).url("Invalid file URL"),

  clinicProof: z.string().url("Invalid file URL").optional(),
});

//  Types

export type UserProfileInput = z.infer<typeof userProfileSchema>;
export type DoctorVerificationInput = z.infer<typeof doctorVerificationSchema>;
