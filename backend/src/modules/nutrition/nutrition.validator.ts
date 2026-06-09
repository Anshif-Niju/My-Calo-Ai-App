import { z } from "zod";

export const logMealSchema = z.object({
  mealType: z.enum(["breakfast", "lunch", "dinner", "custom"], {
    errorMap: () => ({ message: "Invalid meal type" }),
  }),
  foodName: z.string().min(1, "Food name required").max(100),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1").max(5000),
  unit: z.string().min(1).max(20).default("g"),
  calories: z.coerce.number().min(0).max(10000),
  protein: z.coerce.number().min(0).max(1000),
  carbs: z.coerce.number().min(0).max(1000),
  fat: z.coerce.number().min(0).max(1000),
  fiber: z.coerce.number().min(0).max(200).default(0),
  imageUrl: z.string().url().optional(),
  source: z.enum(["scan", "search", "manual"]).default("manual"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
});

export const scanFoodSchema = z.object({
  mealType: z.enum(["breakfast", "lunch", "dinner", "custom"], {
    errorMap: () => ({ message: "Invalid meal type" }),
  }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
});

export const generateMealPlanSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  forceRegenerate: z.boolean().default(false),
});

export type LogMealInput = z.infer<typeof logMealSchema>;
export type ScanFoodInput = z.infer<typeof scanFoodSchema>;
