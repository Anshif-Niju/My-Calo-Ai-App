import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as adminService from "./admin.service";

//Get Dashboard

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const dashboard = await adminService.getDashboard();

  res.status(200).json({
    success: true,
    dashboard,
  });
});

//Get all users

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const isBlocked = req.query.isBlocked !== undefined ? req.query.isBlocked === "true" : undefined;

  const result = await adminService.getAllUsers({
    page,
    limit,
    isBlocked,
  });

  res.status(200).json(result);
});

//Get User by Id

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.id as string;

  const user = await adminService.getUserDetail(userId);

  res.status(200).json({
    success: true,
    user,
  });
});

//Get User Daily Log

export const getUserDailyLog = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.id as string;
  const date = (req.query.date as string) || new Date().toISOString().split("T")[0];

  const log = await adminService.getUserDailyLog(userId, date);

  res.status(200).json({
    success: true,
    log,
  });
});

//Block User

export const blockUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.id as string;

  const user = await adminService.toggleBlockUser(userId);

  res.status(200).json({
    success: true,
    user,
  });
});

//Delete User

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.id as string;

  await adminService.softDeleteUser(userId);

  res.status(200).json({
    success: true,
    message: "User deleted",
  });
});

//Adding Food

export const createFood = asyncHandler(async (req, res) => {
  const food = await adminService.createFood(req.body, req.file);

  res.status(201).json({
    success: true,
    food,
  });
});

//Get all foods

export const getAllFoods = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const search = (req.query.search as string) || "";

  const result = await adminService.getAllFoods({
    page,
    limit,
    search,
  });

  res.status(200).json(result);
});

//Delete Food

export const deleteFood = asyncHandler(async (req, res) => {
  const foodId = req.params.id as string;

  await adminService.deleteFood(foodId);

  res.status(200).json({
    success: true,
    message: "Food deleted successfully",
  });
});
