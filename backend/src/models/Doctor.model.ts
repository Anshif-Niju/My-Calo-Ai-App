import mongoose, { Document, Schema } from "mongoose";

export interface IDoctor extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  specialization: string;
  qualifications: string[];
  experience: number;
  bio?: string;
  certificateUrl: string;
  idProofUrl: string;
  verificationStatus: "pending" | "approved" | "rejected";
  verificationNote?: string;
  consultationFee: number;
  razorpayAccountId?: string;
  qrCodeUrl?: string;
  rating: number;
  totalReviews: number;
  slots: {
    day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
    times: { time: string; isBooked: boolean }[];
  }[];
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DoctorSchema = new Schema<IDoctor>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    specialization: { type: String, required: true },
    qualifications: [{ type: String, required: true }],
    experience: { type: Number, required: true },
    bio: { type: String },
    certificateUrl: { type: String, required: true },
    idProofUrl: { type: String, required: true },
    verificationStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    verificationNote: { type: String },
    consultationFee: { type: Number, required: true },
    razorpayAccountId: { type: String },
    qrCodeUrl: { type: String },
    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    slots: [
      {
        day: { type: String, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] },
        times: [{ time: { type: String }, isBooked: { type: Boolean, default: false } }],
      },
    ],
    isActive: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

DoctorSchema.index({ verificationStatus: 1, isActive: 1 });
DoctorSchema.index({ specialization: 1 });

export const Doctor = mongoose.model<IDoctor>("Doctor", DoctorSchema);
