import { Request, Response } from "express";
import { DailyLog } from "../../models/DailyLog.model";
import { MealLog } from "../../models/MealLog.model";
import { AuthUserPayload } from "../../types/index";
import { getErrorMessage } from "../../utils/error.util";

// Helper: get today's date string in user's local date
// We use UTC date; for production add timezone offset via query param
const getTodayString = (): string => {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
};

// GET /home/today
// Returns today's DailyLog + all MealLogs for the day
export const getTodayHome = async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUserPayload;
    const date = (req.query.date as string) || getTodayString();

    // Get or create DailyLog
    let dailyLog = await DailyLog.findOne({ userId: authUser.userId, date });

    if (!dailyLog) {
      dailyLog = await DailyLog.create({
        userId: authUser.userId,
        date,
        goalCalories: 2000,
        goalProtein: 150,
        goalCarbs: 250,
        goalFat: 65,
      });
    }

    // Get all meal logs for the day
    const meals = await MealLog.find({ userId: authUser.userId, date }).sort({ loggedAt: 1 });

    // Group meals by type for frontend convenience
    const grouped = {
      breakfast: meals.filter((m) => m.mealType === "breakfast"),
      lunch: meals.filter((m) => m.mealType === "lunch"),
      dinner: meals.filter((m) => m.mealType === "dinner"),
      custom: meals.filter((m) => m.mealType === "custom"),
    };

    // Calorie remaining
    const caloriesRemaining = Math.max(0, dailyLog.goalCalories - dailyLog.totalCalories);
    const caloriesNet = dailyLog.totalCalories - dailyLog.caloriesBurned;

    return res.status(200).json({
      date,
      summary: {
        totalCalories: dailyLog.totalCalories,
        goalCalories: dailyLog.goalCalories,
        caloriesRemaining,
        caloriesNet,
        caloriesBurned: dailyLog.caloriesBurned,
        totalProtein: dailyLog.totalProtein,
        goalProtein: dailyLog.goalProtein,
        totalCarbs: dailyLog.totalCarbs,
        goalCarbs: dailyLog.goalCarbs,
        totalFat: dailyLog.totalFat,
        goalFat: dailyLog.goalFat,
        totalFiber: dailyLog.totalFiber,
        waterIntake: dailyLog.waterIntake,
        waterGoal: dailyLog.waterGoal,
        isComplete: dailyLog.isComplete,
      },
      meals: grouped,
    });
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

// POST /home/meal — Add food items to a meal
export const addMealEntry = async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUserPayload;
    const { date, mealType, customMealName, foods, notes } = req.body;

    const dateStr = date || getTodayString();

    // Upsert MealLog (one per mealType per day, except custom)
    let mealLog;
    if (mealType === "custom") {
      mealLog = new MealLog({ userId: authUser.userId, date: dateStr, mealType, customMealName, foods: foods || [], notes });
    } else {
      mealLog = await MealLog.findOne({ userId: authUser.userId, date: dateStr, mealType });
      if (mealLog) {
        mealLog.foods.push(...(foods || []));
        if (notes) mealLog.notes = notes;
      } else {
        mealLog = new MealLog({ userId: authUser.userId, date: dateStr, mealType, foods: foods || [], notes });
      }
    }

    await mealLog.save(); // triggers pre-save totals calc

    // Update DailyLog totals
    await recalcDailyLog(authUser.userId, dateStr);

    return res.status(200).json({ message: "Meal logged", mealLog });
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

// DELETE /home/meal/:mealId/food/:foodIndex — Remove single food from meal

interface RemoveFoodParams {
  mealId: string;
  foodIndex: string;
}
export const removeFoodFromMeal = async (req: Request<RemoveFoodParams>, res: Response) => {
  try {
    const authUser = req.user as AuthUserPayload;
    const { mealId, foodIndex } = req.params;

    const mealLog = await MealLog.findOne({ _id: mealId, userId: authUser.userId });
    if (!mealLog) return res.status(404).json({ message: "Meal not found" });

    const idx = parseInt(foodIndex);
    if (idx < 0 || idx >= mealLog.foods.length) {
      return res.status(400).json({ message: "Invalid food index" });
    }

    mealLog.foods.splice(idx, 1);
    await mealLog.save();

    await recalcDailyLog(authUser.userId, mealLog.date);

    return res.status(200).json({ message: "Food removed", mealLog });
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

// PATCH /home/water — Update water intake
export const updateWater = async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUserPayload;
    const { amount, date } = req.body; // amount in ml
    const dateStr = date || getTodayString();

    const dailyLog = await DailyLog.findOneAndUpdate({ userId: authUser.userId, date: dateStr }, { $inc: { waterIntake: amount } }, { new: true, upsert: true });

    return res.status(200).json({ waterIntake: dailyLog.waterIntake, waterGoal: dailyLog.waterGoal });
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

// Internal helper: recompute DailyLog totals from all MealLogs
async function recalcDailyLog(userId: string, date: string) {
  const meals = await MealLog.find({ userId, date });

  const totals = meals.reduce(
    (acc, m) => {
      acc.calories += m.totalCalories;
      acc.protein += m.totalProtein;
      acc.carbs += m.totalCarbs;
      acc.fat += m.totalFat;
      acc.fiber += m.totalFiber;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  );

  await DailyLog.findOneAndUpdate(
    { userId, date },
    {
      totalCalories: +totals.calories.toFixed(2),
      totalProtein: +totals.protein.toFixed(2),
      totalCarbs: +totals.carbs.toFixed(2),
      totalFat: +totals.fat.toFixed(2),
      totalFiber: +totals.fiber.toFixed(2),
      meals: meals.map((m) => m._id),
    },
    { upsert: true, new: true },
  );
}
