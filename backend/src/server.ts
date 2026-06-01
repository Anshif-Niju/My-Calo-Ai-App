import app from "./app";
import { connectDB } from "./config/db";
import { redis } from "./config/redis";
import { env } from "./config/env";
import "./jobs/workers/email.worker"; 

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
