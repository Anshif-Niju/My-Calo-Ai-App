import mongoose, { Schema } from "mongoose";

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
    morning: boolean;   // 6 AM reminder
    completed: boolean; // goal hit notification
  };
  createdAt: Date;
  updatedAt: Date;
}

const DailyLogSchema = new Schema<IDailyLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true },
    consumed: {
      calories: { type: Number, default: 0 },
      protein: { type: Number, default: 0 },
      carbs: { type: Number, default: 0 },
      fat: { type: Number, default: 0 },
      fiber: { type: Number, default: 0 },
    },
    targets: {
      calories: { type: Number, required: true },
      protein: { type: Number, required: true },
      carbs: { type: Number, required: true },
      fat: { type: Number, required: true },
    },
    status: { type: String, enum: ["under", "hit", "over"], default: "under" },
    mealCount: { type: Number, default: 0 },
    emailSent: {
      morning: { type: Boolean, default: false },
      completed: { type: Boolean, default: false },
    },
    // Auto-delete after 3 days
    createdAt: { type: Date, default: Date.now, expires: 259200 },
  },
  { timestamps: true },
);

DailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export const DailyLog = mongoose.model<IDailyLog>("DailyLog", DailyLogSchema);
