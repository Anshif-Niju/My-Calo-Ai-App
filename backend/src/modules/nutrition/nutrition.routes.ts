import { Router } from "express";
import multer from "multer";
import { authenticate, validate } from "../../middlewares/authenticate";
import {
  deleteMeal, generateMealPlan, getDashboard,
  getLastDay, getMealPlanResult, getScanResult,
  logMeal, scanFood,
} from "./nutrition.controller";
import { generateMealPlanSchema, logMealSchema } from "./nutrition.validator";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images allowed"));
  },
});

router.get("/dashboard", authenticate, getDashboard);
router.get("/last-day", authenticate, getLastDay);
router.post("/log-meal", authenticate, validate(logMealSchema), logMeal);
router.delete("/meal/:id", authenticate, deleteMeal);
router.post("/scan-food", authenticate, upload.single("image"), scanFood);
router.get("/scan-result/:jobId", authenticate, getScanResult);
router.post("/generate-meal-plan", authenticate, validate(generateMealPlanSchema), generateMealPlan);
router.get("/meal-plan-result/:jobId", authenticate, getMealPlanResult);

export default router;
