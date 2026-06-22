import mongoose, { Schema, Document } from "mongoose";

export interface IChatMessage extends Document {
  bookingId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderType: "user" | "doctor";
  message: string;
  messageType: "text" | "file" | "call_log";
  fileUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderType: { type: String, enum: ["user", "doctor"], required: true },
    message: { type: String, default: "" },
    messageType: { type: String, enum: ["text", "file", "call_log"], default: "text" },
    fileUrl: { type: String },
  },
  { timestamps: true }
);

ChatMessageSchema.index({ bookingId: 1, createdAt: 1 });

export const ChatMessage = mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema);
