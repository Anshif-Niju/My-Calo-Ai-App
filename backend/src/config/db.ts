import mongoose from "mongoose";
import { env } from "./env";

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI, { maxPoolSize: 50, minPoolSize: 10, socketTimeoutMS: 45000, serverSelectionTimeoutMS: 5000 });

    console.log("MongoDB connected successfully");
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("MongoDB Connection Failed:", errorMessage);
    process.exit(1);
  }
};
