import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import cloudinary from "../../config/cloudinary";
import { redis } from "../../config/redis";
import { foodScanQueue } from "../../jobs/queues/foodScan.queue";
import { mealPlanQueue } from "../../jobs/queues/mealPlan.queue";
import { User } from "../../models/User.model";
import { AuthUserPayload } from "../../types/index";
import { getErrorMessage } from "../../utils/error.util";
import { MealLog } from "../../models/Meal.model";
import {
  cacheDailySummary,
  getCachedDailySummary,
  getCachedMealPlan,
  invalidateDailySummary,
} from "./nutrition.service";

// ── GET /nutrition/dashboard ──────────────────────────────────────────────────
export const getDashboard = async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUserPayload;
    const date = (req.query.date as string) || new Date().toISOString().split("T")[0];

    // Check Redis cache first
    const cached = await getCachedDailySummary(authUser.userId, date);
    if (cached) {
      return res.status(200).json({ ...cached, fromCache: true });
    }

    // Fetch user targets
    const user = await User.findById(authUser.userId).select("dailyTargets healthProfile goal name");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Fetch today's meals
    const meals = await MealLog.find({ userId: authUser.userId, date }).sort({ createdAt: 1 });

    // Calculate consumed
    const consumed = meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.calories,
        protein: acc.protein + meal.protein,
        carbs: acc.carbs + meal.carbs,
        fat: acc.fat + meal.fat,
        fiber: acc.fiber + meal.fiber,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    );

    // Group by meal type
    const mealsByType = {
      breakfast: meals.filter((m) => m.mealType === "breakfast"),
      lunch: meals.filter((m) => m.mealType === "lunch"),
      dinner: meals.filter((m) => m.mealType === "dinner"),
      custom: meals.filter((m) => m.mealType === "custom"),
    };

    const summary = {
      date,
      user: {
        name: user.name,
        dailyTargets: user.dailyTargets,
        goal: user.goal,
      },
      consumed,
      remaining: {
        calories: Math.max(0, (user.dailyTargets?.calories || 2000) - consumed.calories),
        protein: Math.max(0, (user.dailyTargets?.protein || 150) - consumed.protein),
        carbs: Math.max(0, (user.dailyTargets?.carbs || 200) - consumed.carbs),
        fat: Math.max(0, (user.dailyTargets?.fat || 65) - consumed.fat),
      },
      progress: {
        calories: Math.min(100, Math.round((consumed.calories / (user.dailyTargets?.calories || 2000)) * 100)),
        protein: Math.min(100, Math.round((consumed.protein / (user.dailyTargets?.protein || 150)) * 100)),
        carbs: Math.min(100, Math.round((consumed.carbs / (user.dailyTargets?.carbs || 200)) * 100)),
        fat: Math.min(100, Math.round((consumed.fat / (user.dailyTargets?.fat || 65)) * 100)),
      },
      meals: mealsByType,
      totalMeals: meals.length,
    };

    // Cache for 5 minutes
    await cacheDailySummary(authUser.userId, date, summary);

    return res.status(200).json(summary);
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

// ── POST /nutrition/log-meal ──────────────────────────────────────────────────
export const logMeal = async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUserPayload;
    const data = req.body;

    const meal = await MealLog.create({
      userId: authUser.userId,
      ...data,
    });

    // Invalidate cache so dashboard refreshes
    await invalidateDailySummary(authUser.userId, data.date);

    return res.status(201).json({ message: "Meal logged", meal });
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

// ── DELETE /nutrition/meal/:id ────────────────────────────────────────────────
export const deleteMeal = async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUserPayload;
    const meal = await MealLog.findOneAndDelete({
      _id: req.params.id,
      userId: authUser.userId,
    });

    if (!meal) return res.status(404).json({ message: "Meal not found" });

    await invalidateDailySummary(authUser.userId, meal.date);

    return res.status(200).json({ message: "Meal removed" });
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

//  POST /nutrition/scan-food
// Upload image → queue Gemini Vision → return jobId for polling
export const scanFood = async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUserPayload;
    const file = req.file;

    if (!file) return res.status(400).json({ message: "Image required" });

    // Upload to Cloudinary
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "mycalo/food-scans", quality: "auto" },
        (err, result) => (err ? reject(err) : resolve(result)),
      );
      stream.end(file.buffer);
    });

    const imageUrl = uploadResult.secure_url;
    const imageBase64 = file.buffer.toString("base64");
    const jobId = uuidv4();

    // Queue Gemini Vision job
    await foodScanQueue.add(
      "scan",
      {
        jobId,
        imageBase64,
        mimeType: file.mimetype,
        imageUrl,
        userId: authUser.userId,
      },
      { jobId },
    );

    return res.status(202).json({
      message: "Scan queued",
      jobId,
      imageUrl,
    });
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

//  GET /nutrition/scan-result/:jobId
// Frontend polls this after scan
export const getScanResult = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const result = await redis.get(`scan-result:${jobId}`);

    if (!result) {
      return res.status(202).json({ status: "processing", message: "Still scanning..." });
    }

    return res.status(200).json({ status: "done", data: JSON.parse(result) });
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

// POST /nutrition/generate-meal-plan
export const generateMealPlan = async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUserPayload;
    const { date, forceRegenerate } = req.body;

    // Check cache first (unless forceRegenerate)
    if (!forceRegenerate) {
      const cached = await getCachedMealPlan(authUser.userId, date);
      if (cached) {
        return res.status(200).json({ status: "done", plan: cached, fromCache: true });
      }
    }

    const user = await User.findById(authUser.userId).select(
      "name dailyTargets healthProfile goal",
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    // Queue meal plan generation
    const job = await mealPlanQueue.add("generate", {
      userId: authUser.userId,
      date,
      userProfile: {
        name: user.name,
        calories: user.dailyTargets?.calories || 2000,
        protein: user.dailyTargets?.protein || 150,
        carbs: user.dailyTargets?.carbs || 200,
        fat: user.dailyTargets?.fat || 65,
        goalType: user.goal?.type || "maintain",
        diseases: user.healthProfile?.diseases || [],
        activityLevel: user.healthProfile?.activityLevel || "moderate",
      },
    });

    return res.status(202).json({
      message: "Meal plan generating",
      jobId: job.id,
    });
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

// GET /nutrition/meal-plan-result/:jobId
export const getMealPlanResult = async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUserPayload;
    const { jobId } = req.params;

    // Check if cached (worker stores it after done)
    const result = await redis.get(`mealplan-job:${jobId}`);
    if (!result) {
      return res.status(202).json({ status: "processing" });
    }

    return res.status(200).json({ status: "done", plan: JSON.parse(result) });
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

// GET /nutrition/history
export const getTodayHistory = async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUserPayload;
    const date = (req.query.date as string) || new Date().toISOString().split("T")[0];

    const meals = await MealLog.find({ userId: authUser.userId, date })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ meals, date });
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};
