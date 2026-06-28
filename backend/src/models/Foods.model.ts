import { Schema, model } from "mongoose";

const FoodSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },

    category: {
      type: String,
      enum: ["fruit", "vegetable", "meat", "rice", "drink", "snack", "fastfood", "other"],
      default : "other"
    },

    servingType: {
      type: String,
      enum: ["countable", "weighable"],
      default: "weighable",
    },

    defaultQuantity: Number,

    defaultUnit: String,

    defaultGrams: Number,

    nutritionPerUnit: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
      fiber: Number,
    },

    nutritionPer100g: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
      fiber: Number,
    },

    imageUrl: {
      type: String,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Foods = model("Foods", FoodSchema);
