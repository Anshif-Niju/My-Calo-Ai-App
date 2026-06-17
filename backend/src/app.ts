import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import authRoutes from "./modules/auth/auth.routes";
import doctorRoutes from "./modules/doctor/doctor.routes";
import nutritionRoutes from "./modules/nutrition/nutrition.routes";
import onboardingRoutes from "./modules/onboarding/onboarding.routes";
dotenv.config();

const app = express();

// 1. Security Middlewares

app.use(helmet());
app.use(
  cors({
    origin: [env.FRONTEND_URL || "http://localhost:3000"],
    credentials: true,
  }),
);

// 2. req parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 3. API Routes
app.use("/api/auth", authRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/nutrition", nutritionRoutes);
app.use("/api/doctors", doctorRoutes);

export default app;
