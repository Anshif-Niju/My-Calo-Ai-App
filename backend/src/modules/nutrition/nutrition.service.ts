import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { redis } from "../../config/redis";
import { cloudinaryUploadQueue } from "../../jobs/queues/cloudinaryUpload.queue";
import { foodScanQueue } from "../../jobs/queues/foodScan.queue";
import { DailyLog } from "../../models/DailyLog.model";
import { MealLog } from "../../models/Meal.model";
import { User } from "../../models/User.model";
import AppError from "../../errors/AppError";
import { AuthUserPayload, LogMealInput } from "../../types/index";

//Get Today's Date

export const getToday = (): string => new Date().toISOString().split("T")[0];

//Update Daily Log

export const updateDailyLog = async (userId: string, date: string) => {
  const [user, meals] = await Promise.all([User.findById(userId).select("dailyTargets").lean(), MealLog.find({ userId, date }).lean()]);

  if (!user?.dailyTargets) return null;

  const rawConsumed = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fat: acc.fat + meal.fat,
      fiber: acc.fiber + meal.fiber,
    }),
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
    },
  );

  const consumed = {
    calories: Math.round(rawConsumed.calories),
    protein: Math.round(rawConsumed.protein * 10) / 10,
    carbs: Math.round(rawConsumed.carbs * 10) / 10,
    fat: Math.round(rawConsumed.fat * 10) / 10,
    fiber: Math.round(rawConsumed.fiber * 10) / 10,
  };

  const target = user.dailyTargets.calories || 2000;

  const status = consumed.calories >= target * 1.05 ? "over" : consumed.calories >= target * 0.95 ? "hit" : "under";

  await Promise.all([
    DailyLog.findOneAndUpdate(
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
      {
        upsert: true,
      },
    ),

    redis.del(`summary:${userId}:${date}`),
  ]);

  return {
    consumed,
    status,
    target,
  };
};

//Get Dashboard

export const getDashboard = async (userId: string, date: string) => {
  const cacheKey = `summary:${userId}:${date}`;

  const cached = await redis.get(cacheKey);

  if (cached) {
    return {
      ...JSON.parse(cached),
      fromCache: true,
    };
  }

  const [user, meals] = await Promise.all([
    User.findById(userId).select("dailyTargets healthProfile goal name").lean(),

    MealLog.find({
      userId,
      date,
    })
      .sort({
        createdAt: 1,
      })
      .lean(),
  ]);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  const rawConsumed = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,

      protein: acc.protein + meal.protein,

      carbs: acc.carbs + meal.carbs,

      fat: acc.fat + meal.fat,

      fiber: acc.fiber + meal.fiber,
    }),
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
    },
  );

  const targets = user.dailyTargets || {
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 65,
  };

  const mealsByType = {
    breakfast: meals.filter((m) => m.mealType === "breakfast"),

    lunch: meals.filter((m) => m.mealType === "lunch"),

    dinner: meals.filter((m) => m.mealType === "dinner"),

    custom: meals.filter((m) => m.mealType === "custom"),
  };

  const calorieTarget = targets.calories || 2000;

  const isOver = rawConsumed.calories > calorieTarget * 1.05;

  const isHit = !isOver && rawConsumed.calories >= calorieTarget * 0.95;

  const summary = {
    date,

    user: {
      name: user.name,
      dailyTargets: targets,
      goal: user.goal,
    },

    consumed: rawConsumed,

    remaining: {
      calories: Math.max(0, calorieTarget - rawConsumed.calories),

      protein: Number(Math.max(0, targets.protein - rawConsumed.protein).toFixed(1)),

      carbs: Number(Math.max(0, targets.carbs - rawConsumed.carbs).toFixed(1)),

      fat: Number(Math.max(0, targets.fat - rawConsumed.fat).toFixed(1)),
    },

    overflow: {
      calories: Math.max(0, rawConsumed.calories - calorieTarget),
    },

    progress: {
      calories: Math.round((rawConsumed.calories / calorieTarget) * 100),

      protein: Math.round((rawConsumed.protein / (targets.protein || 150)) * 100),

      carbs: Math.round((rawConsumed.carbs / (targets.carbs || 200)) * 100),

      fat: Math.round((rawConsumed.fat / (targets.fat || 65)) * 100),
    },

    status: isOver ? "over" : isHit ? "hit" : "under",

    meals: mealsByType,

    totalMeals: meals.length,
  };

  const ttl = date === getToday() ? 120 : 600;

  await redis.set(cacheKey, JSON.stringify(summary), "EX", ttl);

  return summary;
};

//Log Meal

export const logMeal = async (userId: string, data: LogMealInput, file?: Express.Multer.File) => {
  const meal = await MealLog.create({
    userId,
    ...data,

    calories: Math.round(data.calories),

    protein: Math.round(data.protein * 10) / 10,

    carbs: Math.round(data.carbs * 10) / 10,

    fat: Math.round(data.fat * 10) / 10,

    fiber: Math.round(data.fiber * 10) / 10,
  });

  if (file) {
    await cloudinaryUploadQueue.add("cloudinary-upload", {
      entityType: "MealLog",
      entityId: meal._id.toString(),

      folder: `meals/${userId}`,

      files: [
        {
          fieldName: "image",
          path: file.path,
          mimeType: file.mimetype,
        },
      ],
    });
  }

  const [result, dailyLog] = await Promise.all([
    updateDailyLog(userId, data.date),

    DailyLog.findOne({
      userId,
      date: data.date,
    }).lean(),
  ]);

  let notification = null;

  if (result && (result.status === "hit" || result.status === "over") && !dailyLog?.emailSent?.completed) {
    await DailyLog.updateOne(
      {
        userId,
        date: data.date,
      },
      {
        $set: {
          "emailSent.completed": true,
        },
      },
    );

    notification = {
      type: result.status,

      message: result.status === "hit" ? "🎉 Daily calorie goal reached!" : `⚠️ Calorie limit exceeded by ${result.consumed.calories - result.target} kcal`,
    };
  }

  return {
    message: "Meal logged",
    meal,
    notification,
  };
};

//Delete the log

export const deleteMeal = async (userId: string, mealId: string) => {
  const meal = await MealLog.findOneAndDelete({
    _id: mealId,
    userId,
  });

  if (!meal) {
    throw new AppError(404, "Meal not found");
  }

  await updateDailyLog(userId, meal.date);

  return {
    message: "Meal removed successfully",
  };
};

//Scan Food

export const scanFood = async (file?: Express.Multer.File) => {
  if (!file) {
    throw new AppError(400, "Image required");
  }

  const scanId = uuidv4();

  await foodScanQueue.add(
    "scan",
    {
      scanId,
      tempPath: file.path,
      mimeType: file.mimetype,
    },
    {
      jobId: scanId,
    },
  );

  return {
    scanId,
    status: "processing",
  };
};

//Get Scan Result

export const getScanResult = async (jobId: string) => {
  const result = await redis.get(`scan-result:${jobId}`);
  if (!result) {
    return {
      status: "processing",
    };
  }

  return {
    status: "done",
    data: JSON.parse(result),
  };
};
