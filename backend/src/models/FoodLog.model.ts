import mongoose, { Document, Schema } from "mongoose";

export interface IFoodItem {
  foodId?: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  unit: "g" | "ml" | "piece" | "cup" | "tbsp" | "tsp";
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  source: "scan" | "search" | "manual";
}

export interface IFoodLog extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  date: Date;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  foods: IFoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  createdAt: Date;
  updatedAt: Date;
}

const FoodItemSchema = new Schema<IFoodItem>({
  foodId: { type: Schema.Types.ObjectId, ref: "Food" },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, enum: ["g", "ml", "piece", "cup", "tbsp", "tsp"], required: true },
  calories: { type: Number, required: true },
  protein: { type: Number, required: true },
  carbs: { type: Number, required: true },
  fat: { type: Number, required: true },
  fiber: { type: Number, required: true },
  source: { type: String, enum: ["scan", "search", "manual"], required: true },
});

const FoodLogSchema = new Schema<IFoodLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    mealType: { type: String, enum: ["breakfast", "lunch", "dinner", "snack"], required: true },
    foods: [FoodItemSchema],
    totalCalories: { type: Number, default: 0 },
    totalProtein: { type: Number, default: 0 },
    totalCarbs: { type: Number, default: 0 },
    totalFat: { type: Number, default: 0 },
    totalFiber: { type: Number, default: 0 },
  },
  { timestamps: true }
);

FoodLogSchema.pre("save", function (next) {
  this.totalCalories = this.foods.reduce((sum, item) => sum + item.calories, 0);
  this.totalProtein = this.foods.reduce((sum, item) => sum + item.protein, 0);
  this.totalCarbs = this.foods.reduce((sum, item) => sum + item.carbs, 0);
  this.totalFat = this.foods.reduce((sum, item) => sum + item.fat, 0);
  this.totalFiber = this.foods.reduce((sum, item) => sum + item.fiber, 0);
});

FoodLogSchema.index({ userId: 1, date: 1 });
FoodLogSchema.index({ userId: 1, date: 1, mealType: 1 });

export const FoodLog = mongoose.model<IFoodLog>("FoodLog", FoodLogSchema);
