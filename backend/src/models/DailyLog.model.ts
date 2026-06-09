import mongoose, { Document, Schema } from "mongoose";

export interface IDailyLog extends Document {
  userId: mongoose.Types.ObjectId;
  date: string; // "YYYY-MM-DD"

  // Aggregated nutrition for the day (recomputed on every meal add/remove)
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;

  // Goals (copied from user's NutritionPlan or defaults)
  goalCalories: number;
  goalProtein: number;
  goalCarbs: number;
  goalFat: number;

  // Water tracking (ml)
  waterIntake: number; // actual ml consumed
  waterGoal: number; // daily goal ml (default 2500)

  // Burned calories (manual entry or from wearable sync later)
  caloriesBurned: number;

  // Meal references (populated from MealLog)
  meals: mongoose.Types.ObjectId[];

  // Streak helper
  isComplete: boolean; // true if calorie goal met (≥90%)
}

const DailyLogSchema = new Schema<IDailyLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true }, // "2025-06-08"

    totalCalories: { type: Number, default: 0 },
    totalProtein: { type: Number, default: 0 },
    totalCarbs: { type: Number, default: 0 },
    totalFat: { type: Number, default: 0 },
    totalFiber: { type: Number, default: 0 },

    goalCalories: { type: Number, default: 2000 },
    goalProtein: { type: Number, default: 150 },
    goalCarbs: { type: Number, default: 250 },
    goalFat: { type: Number, default: 65 },

    waterIntake: { type: Number, default: 0 },
    waterGoal: { type: Number, default: 2500 },

    caloriesBurned: { type: Number, default: 0 },

    meals: [{ type: Schema.Types.ObjectId, ref: "MealLog" }],

    isComplete: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// One daily log per user per day
DailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });

// Auto-mark complete
DailyLogSchema.pre("save", function (next) {
  if (this.goalCalories > 0) {
    this.isComplete = this.totalCalories >= this.goalCalories * 0.9;
  }

});

export const DailyLog = mongoose.model<IDailyLog>("DailyLog", DailyLogSchema);
