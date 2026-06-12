import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env";
import { parseFoodResponse } from "./parser/parser";
import { FOOD_SCAN_PROMPT } from "./prompts/food.prompts";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export const scanFoodWithGemini35 = async (imageBase64: string, mimeType: string) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-3.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  const result = await model.generateContent([
    FOOD_SCAN_PROMPT,
    {
      inlineData: {
        data: imageBase64,
        mimeType,
      },
    },
  ]);

  console.log("Gemini model3.5 completed the task");

  return parseFoodResponse(result.response.text());
};
