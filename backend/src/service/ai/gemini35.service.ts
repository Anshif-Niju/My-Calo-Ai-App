import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env";
import { parseFoodResponse } from "./parser/parser";
import { FOOD_SCAN_PROMPT } from "./prompts/food.prompts";

const clients = [new GoogleGenerativeAI(env.GEMINI_API_KEY1), new GoogleGenerativeAI(env.GEMINI_API_KEY2), new GoogleGenerativeAI(env.GEMINI_API_KEY3), new GoogleGenerativeAI(env.GEMINI_API_KEY4), new GoogleGenerativeAI(env.GEMINI_API_KEY5)];
let currentIndex = 0;
const getNextClient = () => {
  const client = clients[currentIndex];
  currentIndex = (currentIndex + 1) % clients.length; // round-robin
  return client;
};

export const scanFoodWithGemini35 = async (imageBase64: string, mimeType: string) => {
  try {
    const genAI = getNextClient();
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const result = await model.generateContent([FOOD_SCAN_PROMPT, { inlineData: { data: imageBase64, mimeType } }]);

    console.log("✅ Gemini 3.5 completed");
    return parseFoodResponse(result.response.text());
  } catch (error: any) {
    console.error("❌ Gemini 3.5 failed:", error?.message || error);
    throw new Error(`Gemini3.5: ${error?.message || "Unknown error"}`);
  }
};
