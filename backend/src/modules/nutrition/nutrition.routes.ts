import { Router } from "express";
import multer from "multer";
import { authenticate, validate } from "../../middlewares/authenticate";
import {
  deleteMeal,
  generateMealPlan,
  getDashboard,
  getMealPlanResult,
  getScanResult,
  getTodayHistory,
  logMeal,
  scanFood,
} from "./nutrition.controller";
import { generateMealPlanSchema, logMealSchema, scanFoodSchema } from "./nutrition.validator";

const router = Router();

// Multer memory storage for food scan (buffer → base64 for Gemini)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images allowed"));
  },
});

// Dashboard
router.get("/dashboard", authenticate, getDashboard);

// Meal logging
router.post("/log-meal", authenticate, validate(logMealSchema), logMeal);
router.delete("/meal/:id", authenticate, deleteMeal);

// Food scan (async)
router.post("/scan-food", authenticate, upload.single("image"), scanFood);
router.get("/scan-result/:jobId", authenticate, getScanResult);

// AI Meal Plan (async)
router.post("/generate-meal-plan", authenticate, validate(generateMealPlanSchema), generateMealPlan);
router.get("/meal-plan-result/:jobId", authenticate, getMealPlanResult);

// History
router.get("/history", authenticate, getTodayHistory);

export default router;
