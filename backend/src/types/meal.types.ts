import mongoose from 'mongoose'

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
