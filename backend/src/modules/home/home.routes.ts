import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate";
import { addMealEntry, getTodayHome, removeFoodFromMeal, updateWater } from "./home.controller";

const router = Router();

router.use(authenticate); 

router.get("/today", getTodayHome);
router.post("/meal", addMealEntry);
router.delete("/meal/:mealId/food/:foodIndex", removeFoodFromMeal);
router.patch("/water", updateWater);

export default router;
