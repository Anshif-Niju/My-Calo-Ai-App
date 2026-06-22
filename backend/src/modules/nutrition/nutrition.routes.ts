import { Router } from "express";
import { authenticate, validate } from "../../middlewares/authenticate";
import { createDiskUploader } from "../../middlewares/upload.middleware";
import { deleteMeal, getDashboard, getScanResult, logMeal, scanFood, searchFoods } from "./nutrition.controller";
import { logMealSchema } from "./nutrition.validator";

const router = Router();

// Image Upload Setup
const foodScanUpload = createDiskUploader("food-scanning", 10, (_req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only images allowed"));
});

router.get("/dashboard", authenticate, getDashboard);
router.post(
  "/log-meal",
  authenticate,
  foodScanUpload.single("image"),
  (req, res, next) => {
    if (req.body.data) {
      try {
        req.body = JSON.parse(req.body.data);
      } catch (error) {
        return res.status(400).json({ message: "Invalid data format" });
      }
    }
    next();
  },
  validate(logMealSchema),
  logMeal,
);
router.delete("/meal/:id", authenticate, deleteMeal);
router.post("/scan-food", authenticate, foodScanUpload.single("image"), scanFood);
router.get("/scan-result/:jobId", authenticate, getScanResult);
router.get("/search-foods", authenticate, searchFoods);

export default router;
