import mongoose, { Schema } from "mongoose";
import { IDayAvailability, IDoctorProfile, ITimeSlot } from "../types/index";

const TimeSlotSchema = new Schema<ITimeSlot>(
  {
    id: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isBooked: { type: Boolean, default: false },
  },
  { _id: false },
);

const DayAvailabilitySchema = new Schema<IDayAvailability>(
  {
    day: {
      type: String,
      enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
      required: true,
    },
    isAvailable: { type: Boolean, default: false },
    slots: [TimeSlotSchema],
  },
  { _id: false },
);

const DoctorProfileSchema = new Schema<IDoctorProfile>(
  {
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      unique: true,
    },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: "" },
    profilePhoto: { type: String, default: "" },
    specialization: { type: String, default: "" },
    experience: { type: Number, default: 0 },
    qualifications: [{ type: String }],
    about: { type: String, default: "" },
    services: [{ type: String }],
    consultationFee: { type: Number, default: 0 },
    gstPercent: { type: Number, default: 18 },
    razorpayAccountId: { type: String },
    availability: [DayAvailabilitySchema],
    isProfileComplete: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

DoctorProfileSchema.index({ specialization: 1 });
DoctorProfileSchema.index({ doctorId: 1 });

export const DoctorProfile = mongoose.model<IDoctorProfile>("DoctorProfile", DoctorProfileSchema);
