import mongoose, { Document, Schema } from "mongoose";

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  body: string;
  type: "calorie_goal_hit" | "calorie_low" | "calorie_exceeded" | "appointment_reminder" | "appointment_confirmed" | "appointment_cancelled" | "doctor_approved" | "doctor_rejected" | "meal_reminder" | "general";
  relatedId?: mongoose.Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "calorie_goal_hit", "calorie_low", "calorie_exceeded", "appointment_reminder",
        "appointment_confirmed", "appointment_cancelled", "doctor_approved",
        "doctor_rejected", "meal_reminder", "general"
      ],
      required: true,
    },
    relatedId: { type: Schema.Types.ObjectId },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>("Notification", NotificationSchema);
