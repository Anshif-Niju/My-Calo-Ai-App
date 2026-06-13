import mongoose, { Schema } from "mongoose";

export interface IMealLog {
  userId: mongoose.Types.ObjectId;
  mealType: "breakfast" | "lunch" | "dinner" | "custom";
  foodName: string;
  quantity: number;
  unit: string; // "piece", "serving", "g"
  grams: number; // actual grams consumed
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  imageUrl?: string;
  source: "scan" | "search" | "manual";
  date: string;
  // AI scan data
  scanData?: {
    type: "countable" | "weighable";
    nutritionPer100g: { calories: number; protein: number; carbs: number; fat: number; fiber: number };
    nutritionPerUnit: { calories: number; protein: number; carbs: number; fat: number; fiber: number };
    confidence: string;
  };
  createdAt: Date;
}

const MealLogSchema = new Schema<IMealLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    mealType: { type: String, enum: ["breakfast", "lunch", "dinner", "custom"], required: true },
    foodName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, default: 1 },
    unit: { type: String, required: true, default: "piece" },
    grams: { type: Number, required: true, default: 100 },
    calories: { type: Number, required: true },
    protein: { type: Number, required: true },
    carbs: { type: Number, required: true },
    fat: { type: Number, required: true },
    fiber: { type: Number, default: 0 },
    imageUrl: { type: String },
    source: { type: String, enum: ["scan", "search", "manual"], default: "manual" },
    date: { type: String, required: true, index: true },
    scanData: {
      type: { type: String, enum: ["countable", "weighable"] },
      nutritionPer100g: {
        calories: Number,
        protein: Number,
        carbs: Number,
        fat: Number,
        fiber: Number,
      },
      nutritionPerUnit: {
        calories: Number,
        protein: Number,
        carbs: Number,
        fat: Number,
        fiber: Number,
      },
      confidence: String,
    },
    // TTL: auto-delete after 3 days (259200 seconds)
    createdAt: { type: Date, default: Date.now, expires: 259200 },
  },
  { timestamps: true },
);

MealLogSchema.index({ userId: 1, date: 1 });

export const MealLog = mongoose.model<IMealLog>("MealLog", MealLogSchema);
