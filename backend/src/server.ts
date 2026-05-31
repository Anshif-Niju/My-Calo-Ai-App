import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "./app"; // ഇവിടെയാണ് നമ്മൾ എക്സ്പ്രസ്സ് ഇമ്പോർട്ട് ചെയ്യുന്നത്
import { redis } from "./config/redis";

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Connect MongoDB
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/mycalo";
    await mongoose.connect(mongoUri);
    console.log(" MongoDB connected successfully");

    // 2. Verify Redis Connection
    await redis.ping();
    console.log(" Shared Redis instance verified active");

    // 3. Start Express Server Directly
    app.listen(PORT, () => {
      console.log(` MyCalo AI Server running on: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(" Failed to start the infrastructure:", error);
    process.exit(1);
  }
};

startServer();
