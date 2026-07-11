import { z } from "zod";


export const healthProfileSchema = z.object({
  age: z.coerce.number().min(10, "Must be at least 10").max(100, "Invalid age"),

  gender: z.enum(["male", "female"], {
    message: "Gender is required",
  }),

  height: z.coerce.number().min(100, "Height must be at least 100cm").max(250, "Invalid height"),

  weight: z.coerce.number().min(30, "Weight must be at least 30 kg").max(300, "Invalid weight"),

  activityLevel: z.enum(["sedentary", "light", "moderate", "active"], {
    message: "Please select your daily activity level",
  }),

  diseases: z.array(z.string()).optional().default([]),
});

export const goalSchema = z
  .object({
    type: z.enum(["weight_loss", "weight_gain", "maintain"], {
      message: "Please select a goal",
    }),
    targetWeight: z.coerce.number().min(30, "Target weight must be at least 30 kg").max(300, "Invalid target weight").optional(),
  })
  .refine(
    (data) => {
      if (data.type !== "maintain" && !data.targetWeight) {
        return false;
      }
      return true;
    },
    {
      message: "Target weight is required for your selected goal",
      path: ["targetWeight"],
    },
  );

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];

const fileSchema = (requiredMessage: string) =>
  z
    .instanceof(File, { message: requiredMessage })
    .refine((file) => file.size <= MAX_FILE_SIZE, "File size must be less than 5MB")
    .refine((file) => ACCEPTED_TYPES.includes(file.type), "Only JPG, PNG, or PDF files are allowed");

export const doctorVerificationSchema = z.object({
  specialization: z.string().min(1, "Please select specialization"),

  experience: z.coerce.number().min(0, "Experience cannot be negative").max(70, "Invalid experience"),

  registrationNumber: z.string().min(3, "Invalid registration number"),

  registrationCouncil: z.string().min(2, "Invalid council name"),

  registrationYear: z.coerce.number().min(1950, "Invalid year").max(new Date().getFullYear(), "Year cannot be in the future"),

  mcuCertificate: fileSchema("MCU Certificate is required"),

  degreeCertificate: fileSchema("Degree Certificate is required"),

  governmentId: fileSchema("Government ID is required"),
});

export type DoctorVerificationInput = z.infer<typeof doctorVerificationSchema>;
