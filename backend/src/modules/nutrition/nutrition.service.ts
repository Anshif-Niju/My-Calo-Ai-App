import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env";
import { redis } from "../../config/redis";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

// AI Meal Plan Generation

export const generateDailyMealPlan = async (userProfile: { name: string; calories: number; protein: number; carbs: number; fat: number; goalType: string; diseases: string[]; activityLevel: string }) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
You are a certified nutritionist AI. Generate a detailed daily meal plan for:
- Name: ${userProfile.name}
- Daily calorie target: ${userProfile.calories} kcal
- Protein: ${userProfile.protein}g | Carbs: ${userProfile.carbs}g | Fat: ${userProfile.fat}g
- Goal: ${userProfile.goalType}
- Activity level: ${userProfile.activityLevel}
- Health conditions: ${userProfile.diseases.join(", ") || "None"}

Generate meal suggestions for breakfast, lunch, dinner with:
1. 2-3 food options per meal
2. Exact quantities and macros
3. Simple Indian/healthy foods

Respond ONLY with valid JSON in this exact format, no markdown, no extra text:
{
  "totalCalories": number,
  "meals": {
    "breakfast": {
      "targetCalories": number,
      "suggestions": [
        {
          "name": "string",
          "quantity": "string",
          "calories": number,
          "protein": number,
          "carbs": number,
          "fat": number
        }
      ]
    },
    "lunch": { "targetCalories": number, "suggestions": [...] },
    "dinner": { "targetCalories": number, "suggestions": [...] }
  },
  "tip": "one short health tip string"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Clean and parse JSON
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
};

// Food Scan via Gemini Vision

export const scanFoodWithAI = async (imageBase64: string, mimeType: string) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
Analyze this food image and identify all food items visible.
Calculate nutrition for the total portion shown.

Respond ONLY with valid JSON, no markdown, no extra text:
{
  "foodName": "string (main food identified)",
  "allItems": ["list", "of", "all", "items"],
  "quantity": number (estimated grams),
  "unit": "g",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "fiber": number,
  "confidence": "high|medium|low"
}`;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType,
        data: imageBase64,
      },
    },
  ]);

  const text = result.response.text();
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
};

//  Redis Cache Helpers

export const getCachedMealPlan = async (userId: string, date: string) => {
  const key = `mealplan:${userId}:${date}`;
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
};

export const cacheMealPlan = async (userId: string, date: string, plan: object) => {
  const key = `mealplan:${userId}:${date}`;
  // Cache for 24 hours
  await redis.set(key, JSON.stringify(plan), "EX", 86400);
};

export const getCachedDailySummary = async (userId: string, date: string) => {
  const key = `summary:${userId}:${date}`;
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
};

export const cacheDailySummary = async (userId: string, date: string, summary: object) => {
  const key = `summary:${userId}:${date}`;
  // Cache for 5 minutes — updates frequently
  await redis.set(key, JSON.stringify(summary), "EX", 300);
};

export const invalidateDailySummary = async (userId: string, date: string) => {
  const key = `summary:${userId}:${date}`;
  await redis.del(key);
};
