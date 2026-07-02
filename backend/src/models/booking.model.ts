import mongoose, { Schema } from "mongoose";
import { IBooking } from "../types/index";

const BookingSchema = new Schema<IBooking>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    doctorProfileId: { type: Schema.Types.ObjectId, ref: "DoctorProfile", required: true },
    slotId: { type: String, required: true },
    slotDate: { type: Date, required: true },
    slotDay: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    patientName: { type: String, required: true },
    patientEmail: { type: String, required: true },
    consultationFee: { type: Number, required: true },
    gstAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    paymentOrderId: { type: String, required: true },
    paymentId: { type: String },
    status: {
      type: String,
      enum: ["pending_payment", "confirmed", "cancelled", "completed"],
      default: "pending_payment",
    },
    
    chatSessionId: { type: String },
    chatStartTime: { type: Date },
    chatEndTime: { type: Date },
  },
  { timestamps: true },
);

BookingSchema.index({ userId: 1, status: 1 });
BookingSchema.index({ doctorId: 1, slotDate: 1 });
BookingSchema.index({ paymentOrderId: 1 });

export const Booking = mongoose.model<IBooking>("Booking", BookingSchema);
