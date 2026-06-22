import { z } from "zod";

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    height: z.number().min(50, "Height must be at least 50cm").max(300, "Height seems invalid").optional(),
    weight: z.number().min(10, "Weight must be at least 10kg").max(500, "Weight seems invalid").optional(),
    activityLevel: z.enum(["sedentary", "light", "moderate", "active"]).optional(),
    diseases: z.array(z.string()).optional(),
    goalType: z.enum(["weight_loss", "weight_gain", "maintain"]).optional(),
    targetWeight: z.number().min(10).max(500).optional(),
  }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>["body"];
