import { z } from "zod";

export const roleSelectSchema = z.object({
  role: z.enum(["user", "doctor"], {
    message: "Please select a role to continue",
  }),
});

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
