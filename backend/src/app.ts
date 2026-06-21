import { env } from "./config/env";
dotenv.config();
import compression from "compression";  
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import authRoutes from "./modules/auth/auth.routes";
// import doctorRoutes from "./modules/doctor/doctor.routes";
import adminRoutes from "./modules/admin/admin.route";
import nutritionRoutes from "./modules/nutrition/nutrition.routes";
import onboardingRoutes from "./modules/onboarding/onboarding.routes";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import { globalLimiter, authLimiter, scanLimiter } from "./middlewares/rateLimiter";

const app = express();


// 1. Compression 
app.use(compression());                        

// 2. Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: [env.FRONTEND_URL || "http://localhost:3000"],
    credentials: true,
  }),
);

// 3. Global rate limiter — applies to ALL routes
app.use(globalLimiter); 

// 2. req parsing with body size limits
app.use(express.json({ limit: "10kb" })); 
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// 3. API Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/nutrition/scan-food", scanLimiter);
// app.use("/api/doctors", doctorRoutes);
app.use("/api/admin", adminRoutes);

// 404 Route
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global Error Handler
app.use(globalErrorHandler);

export default app;
