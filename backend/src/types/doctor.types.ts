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
    clinicProof?: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

export interface IPopulatedDoctor extends Omit<IDoctor, "userId"> {
  userId: IUser;
}
