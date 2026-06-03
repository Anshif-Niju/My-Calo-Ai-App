import { z } from "zod";

export const roleSelectSchema = z.object({
  role: z.enum(["user", "doctor"], {
    // errorMap എല്ലാവിധ എററുകളെയും (empty string, undefined, invalid type) ഹാൻഡിൽ ചെയ്യും
    errorMap: () => ({ message: "Please select a role to continue" }),
  }),
});

export const healthProfileSchema = z.object({
  age: z
    .number({ invalid_type_error: "Age is required" })
    .min(10, "Must be at least 10 years old")
    .max(100, "Invalid age"),
  gender: z.enum(["male", "female"], {
    errorMap: () => ({ message: "Gender is required for BMR calculation" }),
  }),
  height: z
    .number({ invalid_type_error: "Height is required" })
    .min(100, "Height must be at least 100 cm")
    .max(250, "Invalid height"),
  weight: z
    .number({ invalid_type_error: "Weight is required" })
    .min(30, "Weight must be at least 30 kg")
    .max(300, "Invalid weight"),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active"], {
    errorMap: () => ({ message: "Please select your daily activity level" }),
  }),
});

export const goalSchema = z
  .object({
    type: z.enum(["weight_loss", "weight_gain", "maintain"], {
      errorMap: () => ({ message: "Please select a goal" }),
    }),
    targetWeight: z.number({ invalid_type_error: "Please enter a valid weight" }).min(30).max(300).optional(),
  })
  .refine(
    (data) => {
      // If the goal is NOT "maintain", they MUST provide a target weight
      if (data.type !== "maintain" && !data.targetWeight) {
        return false;
      }
      return true;
    },
    {
      message: "Target weight is required for your selected goal",
      path: ["targetWeight"],
    }
  );
