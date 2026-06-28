import mongoose, { Document } from "mongoose";
import { IUser } from "./user.types";

export interface IDoctor extends Document {
  _id: mongoose.Types.ObjectId;

  userId: mongoose.Types.ObjectId;

  // Doctor-specific only
  specialization?: string;
  experience?: number;
  registrationNumber?: string;
  registrationCouncil?: string;
  registrationYear?: number;
  verificationStatus: "not_submitted" | "pending" | "under_review" | "approved" | "rejected";
  rejectionReason?: string;
  documents?: {
    mcuCertificate?: string;
    degreeCertificate?: string;
    governmentId?: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

export interface IPopulatedDoctor extends Omit<IDoctor, "userId"> {
  userId: IUser;
}

export interface DoctorVerificationJobData {
  doctorId: string;

  mcuPath: string;
  degreePath: string;
  governmentIdPath: string;
}

export interface ITimeSlot {
  id: string;
  startTime: string; // "09:00"
  endTime: string; // "09:30"
  isBooked: boolean;
}

export interface IDayAvailability {
  day: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
  isAvailable: boolean;
  slots: ITimeSlot[];
}

export interface IDoctorProfile extends Document {
  doctorId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  profilePhoto: string;
  specialization: string;
  experience: number; // years
  qualifications: string[];
  about: string; // paragraph the doctor writes
  services: string[];
  consultationFee: number; // in rupees
  gstPercent: number; // default 18
  razorpayAccountId?: string;
  availability: IDayAvailability[];
  isProfileComplete: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type BookingStatus = "pending_payment" | "confirmed" | "cancelled" | "completed";

export interface IBooking extends Document {
  userId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  doctorProfileId: mongoose.Types.ObjectId;
  slotId: string;
  slotDate: Date;
  slotDay: string;
  startTime: string;
  endTime: string;
  patientName: string;
  patientEmail: string;
  consultationFee: number;
  gstAmount: number;
  totalAmount: number;
  paymentOrderId: string; // Razorpay order id (mock for now)
  paymentId?: string; // Razorpay payment id after success
  status: BookingStatus;
  chatSessionId?: string;
  chatStartTime?: Date;
  chatEndTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAppointment extends Document {
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  appointmentDate: Date;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  reason: string;
}
