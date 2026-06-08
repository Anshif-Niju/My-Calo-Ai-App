import mongoose, { Schema } from "mongoose";
import { IDoctor } from "../types/index";

const DoctorSchema = new Schema<IDoctor>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    specialization: { type: String },
    experience: { type: Number },
    registrationNumber: { type: String },
    registrationCouncil: { type: String },
    registrationYear: { type: Number },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: { type: String },
    documents: {
      mcuCertificate: { type: String },
      degreeCertificate: { type: String },
      governmentId: { type: String },
      clinicProof: { type: String },
    },
  },
  { timestamps: true },
);

DoctorSchema.index({ verificationStatus: 1 });

export const Doctor = mongoose.model<IDoctor>("Doctor", DoctorSchema);
