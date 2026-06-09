import { z } from "zod";

export const aiScanResultSchema = z.object({
  foodName: z.string().min(1, "Food name required").catch("Unknown Food"),
  quantity: z.coerce.number().catch(100), // Default to 100g if AI fails to guess
  unit: z.string().catch("g"),
  calories: z.coerce.number().catch(0),
  protein: z.coerce.number().catch(0),
  carbs: z.coerce.number().catch(0),
  fat: z.coerce.number().catch(0),
  fiber: z.coerce.number().catch(0),
  imageUrl: z.string().url().catch(""),
});
