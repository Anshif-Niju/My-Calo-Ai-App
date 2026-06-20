import Groq from "groq-sdk";
import { env } from "../../config/env";
import { parseFoodResponse } from "./parser/parser";
import { FOOD_SCAN_PROMPT } from "./prompts/food.prompts";

const groq = new Groq({ apiKey: env.GROQ_API_KEY });

export const scanFoodWithGroq = async (imageBase64: string, mimeType: string) => {
  try {
    const completion = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: FOOD_SCAN_PROMPT },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            },
          ],
        },
      ],
      temperature: 0,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Groq returned empty response");

    return parseFoodResponse(content);
  } catch (error: any) {
    console.error("❌ Groq failed:", error?.message || error);
    throw new Error(`Groq: ${error?.message || "Unknown error"}`);
  }
};
