import { Request, Response } from "express";
import { User } from "../../models/User.model";
import { AuthUserPayload } from "../../types/index";

export const completeIntro = async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUserPayload;
    await User.findByIdAndUpdate(authUser.userId, { onboardingCompleted: true });
    return res.status(200).json({ message: "Intro completed" });
  } catch (error) {
    return res.status(500).json({ message: error });
  }
};

export const completeUserverifiaction = async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUserPayload;
    const { height, weight, age, gender, diseases, activityLevel, goalType, targetWeight } = req.body;

    const user = await User.findById(authUser.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const heightInMeters = height / 100;
    const bmi = parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));

    const bmr = gender === "male" ? Math.round(88.362 + 13.397 * weight + 4.799 * height - 5.677 * age) : Math.round(447.593 + 9.247 * weight + 3.098 * height - 4.33 * age);

    const multipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
    };
    const tdee = Math.round(bmr * (multipliers[activityLevel] ?? 1.2));

    const targetCalories = goalType === "weight_loss" ? tdee - 500 : goalType === "weight_gain" ? tdee + 500 : tdee;

    const protein = Math.round((targetCalories * 0.3) / 4);
    const carbs = Math.round((targetCalories * 0.4) / 4);
    const fat = Math.round((targetCalories * 0.3) / 9);

    user.healthProfile = { height, weight, age, gender, diseases, bmi, bmr, activityLevel };
    user.goal = { type: goalType, targetWeight };
    user.dailyTargets = { calories: targetCalories, protein, carbs, fat, fiber: 25 };
    user.hasSubmittedVerification = true;

    await user.save();

    return res.status(200).json({
      message: "Profile setup complete",
      dailyTargets: user.dailyTargets,
      healthProfile: user.healthProfile,
      goal: user.goal,
    });
  } catch (error) {
    return res.status(500).json({ message: error });
  }
};
