import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env";
import { redis } from "../../config/redis";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export const scanFoodWithAI = async (imageBase64: string, mimeType: string) => {
  try {
    // 1. Gemini മോഡൽ ഇനിഷ്യലൈസ് ചെയ്യുക
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    // 2. കൃത്യമായ JSON ഔട്ട്പുട്ട് ലഭിക്കാനുള്ള പ്രോംപ്റ്റ്
    const prompt = `
You are an expert nutritionist. Analyze this food image and estimate its nutritional facts.
If the image does not contain any food items, set "isFood" to false.

Respond ONLY with valid JSON, no markdown and no extra text:
{
  "isFood": boolean,
  "foodName": "string",
  "confidence": "high" | "medium" | "low",
  "nutritionPer100g": {
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number,
    "fiber": number
  },
  "imageUrl": null
}`;

    // 3. ബേസ്64 ഇമേജ് ഡാറ്റയും പ്രോംപ്റ്റും ചേർത്ത് Gemini-ലേക്ക് അയക്കുന്നു
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType,
        },
      },
    ]);

    const cleanText = result.response
      .text()
      .replace(/```json|```/g, "")
      .trim();

    const parsedData = JSON.parse(cleanText);
    return parsedData;

  } catch (error) {
    console.error("🚨 Gemini Food Scan Error:", error);
    throw error;
  }
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
