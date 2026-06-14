import app from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";
import { redis } from "./config/redis";
import { startDailyEmailScheduler } from "./jobs/schedulers/dailyEmail.scheduler";
import "./jobs/workers/cloudinary.worker";
import "./jobs/workers/email.worker";
import "./jobs/workers/emailNotification.worker";
import "./jobs/workers/foodScan.worker";

// Start scheduler
startDailyEmailScheduler();

const PORT = env.PORT;

const startServer = async () => {
  try {
    await connectDB();

    await redis.ping();

    app.listen(PORT, () => {
      console.log(`MyCalo AI Server running in ${env.NODE_ENV} mode on port: http://localhost:${PORT}`);
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("Server startup failed:", errorMessage);
    process.exit(1);
  }
};

startServer();
