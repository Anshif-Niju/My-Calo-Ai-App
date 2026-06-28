import { Request, Response } from "express";
import * as nutritionService from "./nutrition.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { AuthUserPayload } from "../../types";

//Get Dashboard

export const getDashboard = asyncHandler(async (req, res) => {
  const authUser = req.user as AuthUserPayload;

  const result = await nutritionService.getDashboard(authUser.userId, (req.query.date as string) || nutritionService.getToday());

  res.status(200).json(result);
});

//Log Meal(When user click to add food)

export const logMeal = asyncHandler(async (req, res) => {
  const authUser = req.user as AuthUserPayload;

  const result = await nutritionService.logMeal(authUser.userId, req.body, req.file);

  res.status(201).json(result);
});

//Delete Meal

export const deleteMeal = asyncHandler(async (req, res) => {
  const authUser = req.user as AuthUserPayload;
  const mealId = req.params.id as string;
  const result = await nutritionService.deleteMeal(authUser.userId, mealId);

  res.status(200).json(result);
});

//Scan Food

export const scanFood = asyncHandler(async (req: Request, res: Response) => {
  const result = await nutritionService.scanFood(req.file);

  res.status(202).json(result);
});

//Get Scan Result

export const getScanResult = asyncHandler(async (req, res) => {
  const mealId = req.params.jobId as string;
  const result = await nutritionService.getScanResult(mealId);
  res.status(result.status === "processing" ? 202 : 200).json(result);
});

//Search Foods

export const searchFoods = asyncHandler(async (req: Request, res: Response) => {
  const query = (req.query.name as string) || "";
  const result = await nutritionService.searchFoods(query);

  res.status(200).json({
    success: true,
    foods: result,
  });
});
