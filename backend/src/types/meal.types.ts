import mongoose from "mongoose";

export interface IMealLog {
  userId: mongoose.Types.ObjectId;
  mealType: "breakfast" | "lunch" | "dinner" | "custom";
  foodName: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  imageUrl?: string;
  source: "scan" | "search" | "manual";
  date: string; // "2025-06-07"
  createdAt: Date;
}

export interface IDailyLog {
  userId: mongoose.Types.ObjectId;
  date: string; // "YYYY-MM-DD"
  consumed: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  targets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  status: "under" | "hit" | "over";
  mealCount: number;
  emailSent: {
    morning: boolean;
    completed: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type MealType = "breakfast" | "lunch" | "dinner" | "custom";

export interface LogMealInput {
  foodName: string;
  mealType: MealType;
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  category?: "fruit" | "vegetable" | "meat" | "rice" | "drink" | "snack" | "fastfood" | "other";
}
