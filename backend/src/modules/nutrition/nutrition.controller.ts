import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import cloudinary from "../../config/cloudinary";
import { redis } from "../../config/redis";
import { foodScanQueue } from "../../jobs/queues/foodScan.queue";
import { mealPlanQueue } from "../../jobs/queues/mealPlan.queue";
import { DailyLog } from "../../models/DailyLog.model";
import { MealLog } from "../../models/Meal.model";
import { User } from "../../models/User.model";
import { AuthUserPayload } from "../../types/index";
import { getErrorMessage } from "../../utils/error.util";
import { cacheDailySummary, getCachedDailySummary, getCachedMealPlan, invalidateDailySummary } from "./nutrition.service";

const getToday = () => new Date().toISOString().split("T")[0];

// ── Update DailyLog after meal change ────────────────────────────────────────
const updateDailyLog = async (userId: string, date: string) => {
  const user = await User.findById(userId).select("dailyTargets");
  if (!user?.dailyTargets) return;

  const meals = await MealLog.find({ userId, date });
  const consumed = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
      fiber: acc.fiber + m.fiber,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  );

  const target = user.dailyTargets.calories || 2000;
  const status = consumed.calories >= target * 1.05 ? "over" : consumed.calories >= target * 0.95 ? "hit" : "under";

  await DailyLog.findOneAndUpdate(
    { userId, date },
    {
      $set: {
        consumed,
        targets: {
          calories: user.dailyTargets.calories,
          protein: user.dailyTargets.protein,
          carbs: user.dailyTargets.carbs,
          fat: user.dailyTargets.fat,
        },
        status,
        mealCount: meals.length,
      },
    },
    { upsert: true, returnDocument: "after" },
  );

  await invalidateDailySummary(userId, date);
  return { consumed, status, target };
};

// ── GET /nutrition/dashboard ──────────────────────────────────────────────────
export const getDashboard = async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUserPayload;
    const date = (req.query.date as string) || getToday();

    const cached = await getCachedDailySummary(authUser.userId, date);
    if (cached) return res.status(200).json({ ...cached, fromCache: true });

    const user = await User.findById(authUser.userId).select("dailyTargets healthProfile goal name");
    if (!user) return res.status(404).json({ message: "User not found" });

    const meals = await MealLog.find({ userId: authUser.userId, date }).sort({ createdAt: 1 }).lean();

    const consumed = meals.reduce(
      (acc, m) => ({
        calories: acc.calories + m.calories,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat,
        fiber: acc.fiber + m.fiber,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    );

    const targets = user.dailyTargets || { calories: 2000, protein: 150, carbs: 200, fat: 65 };

    const mealsByType = {
      breakfast: meals.filter((m) => m.mealType === "breakfast"),
      lunch: meals.filter((m) => m.mealType === "lunch"),
      dinner: meals.filter((m) => m.mealType === "dinner"),
      custom: meals.filter((m) => m.mealType === "custom"),
    };

    const isOver = consumed.calories > (targets.calories || 2000) * 1.05;
    const isHit = !isOver && consumed.calories >= (targets.calories || 2000) * 0.95;

    const summary = {
      date,
      user: { name: user.name, dailyTargets: targets, goal: user.goal },
      consumed,
      remaining: {
        calories: Math.max(0, (targets.calories || 2000) - consumed.calories),
        protein: Math.max(0, (targets.protein || 150) - consumed.protein),
        carbs: Math.max(0, (targets.carbs || 200) - consumed.carbs),
        fat: Math.max(0, (targets.fat || 65) - consumed.fat),
      },
      overflow: {
        calories: Math.max(0, consumed.calories - (targets.calories || 2000)),
      },
      progress: {
        calories: Math.round((consumed.calories / (targets.calories || 2000)) * 100),
        protein: Math.round((consumed.protein / (targets.protein || 150)) * 100),
        carbs: Math.round((consumed.carbs / (targets.carbs || 200)) * 100),
        fat: Math.round((consumed.fat / (targets.fat || 65)) * 100),
      },
      status: isOver ? "over" : isHit ? "hit" : "under",
      meals: mealsByType,
      totalMeals: meals.length,
    };

    await cacheDailySummary(authUser.userId, date, summary);
    return res.status(200).json(summary);
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

// ── GET /nutrition/last-day ───────────────────────────────────────────────────
// Returns the most recent day (before today) that has meal data
export const getLastDay = async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUserPayload;
    const today = getToday();

    const lastLog = await DailyLog.findOne({
      userId: authUser.userId,
      date: { $lt: today },
      mealCount: { $gt: 0 },
    }).sort({ date: -1 });

    if (!lastLog) {
      return res.status(200).json({ hasData: false, date: null });
    }

    // Get full dashboard for that date
    req.query.date = lastLog.date;
    return getDashboard(req, res);
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

// ── POST /nutrition/log-meal ──────────────────────────────────────────────────
export const logMeal = async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUserPayload;
    const data = req.body;

    const meal = await MealLog.create({ userId: authUser.userId, ...data });
    const result = await updateDailyLog(authUser.userId, data.date);

    // Check if goal just hit/over — send notification
    const dailyLog = await DailyLog.findOne({ userId: authUser.userId, date: data.date });
    let notification = null;

    if (result && (result.status === "hit" || result.status === "over") && !dailyLog?.emailSent.completed) {
      await DailyLog.findOneAndUpdate({ userId: authUser.userId, date: data.date }, { "emailSent.completed": true });
      notification = {
        type: result.status,
        message: result.status === "hit" ? "🎉 Daily calorie goal reached!" : `⚠️ Calorie limit exceeded by ${result.consumed.calories - result.target} kcal`,
      };
    }

    return res.status(201).json({ message: "Meal logged", meal, notification });
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
    await updateDailyLog(authUser.userId, meal.date);
    return res.status(200).json({ message: "Meal removed" });
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

// ── POST /nutrition/scan-food ─────────────────────────────────────────────────
export const scanFood = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: "Image required" });

    const jobId = uuidv4();
    const imageBase64 = file.buffer.toString("base64");

    // Upload to Cloudinary in background
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: "mycalo/food-scans", quality: "auto" }, (err, result) => (err ? reject(err) : resolve(result)));
      stream.end(file.buffer);
    });

    // Queue Gemini scan
    await foodScanQueue.add(
      "scan",
      {
        jobId,
        imageBase64,
        mimeType: file.mimetype,
        imageUrl: uploadResult.secure_url,
      },
      { jobId },
    );

    return res.status(202).json({ jobId, imageUrl: uploadResult.secure_url });
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

// ── GET /nutrition/scan-result/:jobId ─────────────────────────────────────────
export const getScanResult = async (req: Request, res: Response) => {
  try {
    const result = await redis.get(`scan-result:${req.params.jobId}`);
    if (!result) return res.status(202).json({ status: "processing" });
    return res.status(200).json({ status: "done", data: JSON.parse(result) });
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

// ── POST /nutrition/generate-meal-plan ────────────────────────────────────────
export const generateMealPlan = async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUserPayload;
    const { date, forceRegenerate } = req.body;

    if (!forceRegenerate) {
      const cached = await getCachedMealPlan(authUser.userId, date);
      if (cached) return res.status(200).json({ status: "done", plan: cached, fromCache: true });
    }

    const user = await User.findById(authUser.userId).select("name dailyTargets healthProfile goal");
    if (!user) return res.status(404).json({ message: "User not found" });

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

    return res.status(202).json({ jobId: job.id });
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

export const getMealPlanResult = async (req: Request, res: Response) => {
  try {
    const result = await redis.get(`mealplan-job:${req.params.jobId}`);
    if (!result) return res.status(202).json({ status: "processing" });
    return res.status(200).json({ status: "done", plan: JSON.parse(result) });
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};
