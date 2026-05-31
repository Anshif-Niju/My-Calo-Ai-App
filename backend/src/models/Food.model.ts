import mongoose, { Schema, Document } from "mongoose";

export interface IFood extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  brand?: string;
  category: "grain" | "protein" | "dairy" | "vegetable" | "fruit" | "beverage" | "snack" | "other";
  per100g: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  commonServings: { label: string; grams: number }[];
  imageUrl?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FoodSchema = new Schema<IFood>(
  {
    name: { type: String, required: true },
    brand: { type: String },
    category: {
      type: String,
      enum: ["grain", "protein", "dairy", "vegetable", "fruit", "beverage", "snack", "other"],
      required: true,
    },
    per100g: {
      calories: { type: Number, required: true },
      protein: { type: Number, required: true },
      carbs: { type: Number, required: true },
      fat: { type: Number, required: true },
      fiber: { type: Number, required: true },
    },
    commonServings: [
      {
        label: { type: String, required: true },
        grams: { type: Number, required: true },
      },
    ],
    imageUrl: { type: String },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

FoodSchema.index({ name: "text", brand: "text" });
FoodSchema.index({ category: 1 });
FoodSchema.index({ isVerified: 1 });

export const Food = mongoose.model<IFood>("Food", FoodSchema);
