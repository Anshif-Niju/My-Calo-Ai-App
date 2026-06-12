import Groq from "groq-sdk";
import { env } from "../../config/env";

import { parseFoodResponse } from "./parser/parser";
import { FOOD_SCAN_PROMPT } from "./prompts/food.prompts";

const groq = new Groq({
  apiKey: env.GROQ_API_KEY,
});

export const scanFoodWithGroq = async (imageBase64: string, mimeType: string) => {
  const completion = await groq.chat.completions.create({
    model: "meta-llama/llama-4-maverick-17b-128e-instruct",

    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: FOOD_SCAN_PROMPT,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
            },
          },
        ],
      },
    ],

    temperature: 0,
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error("Groq returned empty response");
  }
  console.log("Groq llama completd the task");

  return parseFoodResponse(content);
};
