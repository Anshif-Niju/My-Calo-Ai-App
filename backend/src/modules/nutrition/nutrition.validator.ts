import { z } from "zod";

export const logMealSchema = z.object({
  body: z.object({                          // ← wrap in body:
    foodName: z.string().trim().min(1, "Meal name is required").max(100),
    mealType: z.enum(["breakfast", "lunch", "dinner", "custom"], {
      message: "Invalid meal type",
    }),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    calories: z.number().min(0).max(10000),
    protein: z.number().min(0).max(1000),
    carbs: z.number().min(0).max(1000),
    fat: z.number().min(0).max(1000),
    fiber: z.number().min(0).max(500).default(0),
    imageUrl: z.string().url().optional().or(z.literal("")),
    category: z.enum(["fruit", "vegetable", "meat", "rice", "drink", "snack", "fastfood", "other"]).optional().default("other"),
    quantity: z.number().optional(),
    unit: z.string().optional(),
    grams: z.number().optional(),
    source: z.string().optional(),
    scanData: z.any().optional(),
  }),
  query: z.object({}).passthrough().optional(),
  params: z.object({}).passthrough().optional(),
});

export const generateMealPlanSchema = z.object({
  body: z.object({                          // ← wrap in body:
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    forceRegenerate: z.boolean().default(false),
  }),
  query: z.object({}).passthrough().optional(),
  params: z.object({}).passthrough().optional(),
});

export type LogMealInput = z.infer<typeof logMealSchema>["body"];
