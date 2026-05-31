import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import authRoutes from "./modules/auth/auth.routes";

const app = express();

// 1. Security Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true 
}));

// 2. Parsers
app.use(express.json()); // JSON ബോഡി റീഡ് ചെയ്യാൻ
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // HTTP-Only കുക്കികൾ റീഡ് ചെയ്യാൻ

// 3. API Routes
app.use("/api/auth", authRoutes);

// 4. Health Check Endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", timestamp: new Date() });
});

export default app;
