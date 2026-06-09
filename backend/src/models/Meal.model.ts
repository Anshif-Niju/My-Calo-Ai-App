import mongoose, { Schema } from "mongoose";
import { IMealLog } from "../types/index";

const MealLogSchema = new Schema<IMealLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    mealType: { type: String, enum: ["breakfast", "lunch", "dinner", "custom"], required: true },
    foodName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true, default: "g" },
    calories: { type: Number, required: true },
    protein: { type: Number, required: true },
    carbs: { type: Number, required: true },
    fat: { type: Number, required: true },
    fiber: { type: Number, default: 0 },
    imageUrl: { type: String },
    source: { type: String, enum: ["scan", "search", "manual"], default: "manual" },
    date: { type: String, required: true, index: true }, // "YYYY-MM-DD"
  },
  { timestamps: true },
);

MealLogSchema.index({ userId: 1, date: 1 });

export const MealLog = mongoose.model<IMealLog>("MealLog", MealLogSchema);
