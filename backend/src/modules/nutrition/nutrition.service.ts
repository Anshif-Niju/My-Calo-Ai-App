import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env";
import { redis } from "../../config/redis";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export const scanFoodWithAI = async (imageBase64: string, mimeType: string) => {
  const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

  const prompt = `
Analyze this food image. Identify what food is shown.

If it is NOT food, respond with: {"isFood": false, "message": "This doesn't appear to be food"}

If it IS food, respond ONLY with valid JSON (no markdown, no extra text):
{
  "isFood": true,
  "foodName": "exact food name (e.g. Appam, White Rice, Sambar)",
  "type": "countable OR weighable (countable = items like appam/idli/egg, weighable = rice/curry/salad)",
  "defaultQuantity": 1,
  "defaultUnit": "piece OR serving OR bowl",
  "defaultGrams": estimated grams for 1 piece/serving (e.g. appam=80, rice 1 serving=150),
  "nutritionPerUnit": {
    "calories": per 1 piece/serving,
    "protein": grams,
    "carbs": grams,
    "fat": grams,
    "fiber": grams
  },
  "nutritionPer100g": {
    "calories": per 100g,
    "protein": grams,
    "carbs": grams,
    "fat": grams,
    "fiber": grams
  },
  "confidence": "high OR medium OR low"
}

Be accurate with Indian/common foods. For rice always use 100g as base.`;

  const result = await model.generateContent([prompt, { inlineData: { mimeType, data: imageBase64 } }]);

  const text = result.response.text();
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
};

export const generateDailyMealPlan = async (userProfile: { name: string; calories: number; protein: number; carbs: number; fat: number; goalType: string; diseases: string[]; activityLevel: string }) => {
  const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
  const prompt = `
You are a certified nutritionist. Generate a daily meal plan for:
- Daily calorie target: ${userProfile.calories} kcal
- Protein: ${userProfile.protein}g | Carbs: ${userProfile.carbs}g | Fat: ${userProfile.fat}g
- Goal: ${userProfile.goalType}
- Health conditions: ${userProfile.diseases.join(", ") || "None"}

Respond ONLY with valid JSON, no markdown:
{
  "totalCalories": number,
  "meals": {
    "breakfast": { "targetCalories": number, "suggestions": [{ "name": "string", "quantity": "string", "calories": number, "protein": number, "carbs": number, "fat": number }] },
    "lunch": { "targetCalories": number, "suggestions": [...] },
    "dinner": { "targetCalories": number, "suggestions": [...] }
  },
  "tip": "one short health tip"
}`;

  const result = await model.generateContent(prompt);
  const clean = result.response
    .text()
    .replace(/```json|```/g, "")
    .trim();
  return JSON.parse(clean);
};

// Redis helpers
export const getCachedDailySummary = async (userId: string, date: string) => {
  const key = `summary:${userId}:${date}`;
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
};

export const cacheDailySummary = async (userId: string, date: string, summary: object) => {
  await redis.set(`summary:${userId}:${date}`, JSON.stringify(summary), "EX", 120);
};

export const invalidateDailySummary = async (userId: string, date: string) => {
  await redis.del(`summary:${userId}:${date}`);
};

export const getCachedMealPlan = async (userId: string, date: string) => {
  const cached = await redis.get(`mealplan:${userId}:${date}`);
  return cached ? JSON.parse(cached) : null;
};

export const cacheMealPlan = async (userId: string, date: string, plan: object) => {
  await redis.set(`mealplan:${userId}:${date}`, JSON.stringify(plan), "EX", 86400);
};
