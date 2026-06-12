export const FOOD_SCAN_PROMPT = `
Analyze this food image.

Respond ONLY with valid JSON. Do not use formatting blocks.

Strict Rules for Numbers:
- Calories MUST be realistic (between 0 and 2000 kcal). Do not use Joules.
- Macros (protein, carbs, fat, fiber) MUST be realistic (between 0 and 150 grams).
- Do not output ridiculously high numbers.

{
  "isFood": boolean,
  "foodName": string,
  "confidence":"high"|"medium"|"low",
  "type":"countable"|"weighable",
  "defaultQuantity": number,
  "defaultUnit": string,
  "defaultGrams": number,

  "nutritionPerUnit":{
    "calories":number,
    "protein":number,
    "carbs":number,
    "fat":number,
    "fiber":number
  },

  "nutritionPer100g":{
    "calories":number,
    "protein":number,
    "carbs":number,
    "fat":number,
    "fiber":number
  }
}

Rules:
- Eggs, bananas, apples, appam, idli, dosa are countable.
- Rice, curry, noodles, oats are weighable.
- Estimate realistic default grams.
`;
