import mongoose, { Document, Schema } from "mongoose";

export interface IChatMessage extends Document {
  _id: mongoose.Types.ObjectId;
  roomId: string;
  senderId?: mongoose.Types.ObjectId;
  receiverId?: mongoose.Types.ObjectId;
  content: string;
  messageType: "text" | "image" | "file" | "ai";
  fileUrl?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    roomId: { type: String, required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User" },
    receiverId: { type: Schema.Types.ObjectId, ref: "User" },
    content: { type: String, required: true },
    messageType: { type: String, enum: ["text", "image", "file", "ai"], required: true },
    fileUrl: { type: String },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ChatMessageSchema.index({ roomId: 1, createdAt: 1 });
ChatMessageSchema.index({ senderId: 1, isRead: 1 });

export const ChatMessage = mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema);
