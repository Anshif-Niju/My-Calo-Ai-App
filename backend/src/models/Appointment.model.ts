import mongoose, { Document, Schema } from "mongoose";

export interface IAppointment extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  slotDate: Date;
  slotTime: string;
  slotEndTime: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  paymentId: string;
  orderId: string;
  paymentStatus: "pending" | "paid" | "failed";
  amount: number;
  chatRoomId: string;
  reminderSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    slotDate: { type: Date, required: true },
    slotTime: { type: String, required: true },
    slotEndTime: { type: String, required: true },
    status: { type: String, enum: ["pending", "confirmed", "completed", "cancelled"], default: "pending" },
    paymentId: { type: String, required: true },
    orderId: { type: String, required: true },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    amount: { type: Number, required: true },
    chatRoomId: { type: String, required: true },
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

AppointmentSchema.index({ userId: 1, status: 1 });
AppointmentSchema.index({ doctorId: 1, slotDate: 1 });
AppointmentSchema.index({ doctorId: 1, slotDate: 1, slotTime: 1 }, { unique: true });

export const Appointment = mongoose.model<IAppointment>("Appointment", AppointmentSchema);
