import mongoose, { Document, Schema } from "mongoose";

export type MealType = "breakfast" | "lunch" | "dinner" | "custom";

export interface IFoodItem {
  name: string;
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber?: number; // grams
  quantity: number; // user-defined amount
  unit: string; // "g" | "ml" | "cup" | "piece" etc.
  servingSize: number; // base serving in grams
  imageUrl?: string;
  source: "ai_scan" | "manual_search" | "custom";
}

export interface IMealLog extends Document {
  userId: mongoose.Types.ObjectId;
  date: string; // "YYYY-MM-DD" — easy daily grouping
  mealType: MealType;
  customMealName?: string; // only when mealType === "custom"
  foods: IFoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  notes?: string;
  loggedAt: Date;
}

const FoodItemSchema = new Schema<IFoodItem>(
  {
    name: { type: String, required: true, trim: true },
    calories: { type: Number, required: true, min: 0 },
    protein: { type: Number, required: true, min: 0 },
    carbs: { type: Number, required: true, min: 0 },
    fat: { type: Number, required: true, min: 0 },
    fiber: { type: Number, default: 0 },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, default: "g" },
    servingSize: { type: Number, required: true, default: 100 },
    imageUrl: { type: String },
    source: {
      type: String,
      enum: ["ai_scan", "manual_search", "custom"],
      default: "manual_search",
    },
  },
  { _id: true },
);

const MealLogSchema = new Schema<IMealLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true, index: true }, // "2025-06-08"
    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "dinner", "custom"],
      required: true,
    },
    customMealName: { type: String, trim: true },
    foods: { type: [FoodItemSchema], default: [] },
    totalCalories: { type: Number, default: 0 },
    totalProtein: { type: Number, default: 0 },
    totalCarbs: { type: Number, default: 0 },
    totalFat: { type: Number, default: 0 },
    totalFiber: { type: Number, default: 0 },
    notes: { type: String },
    loggedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Compound index: one meal type per user per day (except custom — multiple customs allowed)
MealLogSchema.index({ userId: 1, date: 1, mealType: 1 });

// Auto-calc totals before save
MealLogSchema.pre("save", function (next) {
  if (this.foods.length > 0) {
    this.totalCalories = +this.foods.reduce((s, f) => s + f.calories, 0).toFixed(2);
    this.totalProtein = +this.foods.reduce((s, f) => s + f.protein, 0).toFixed(2);
    this.totalCarbs = +this.foods.reduce((s, f) => s + f.carbs, 0).toFixed(2);
    this.totalFat = +this.foods.reduce((s, f) => s + f.fat, 0).toFixed(2);
    this.totalFiber = +this.foods.reduce((s, f) => s + (f.fiber ?? 0), 0).toFixed(2);
  }

});

export const MealLog = mongoose.model<IMealLog>("MealLog", MealLogSchema);
