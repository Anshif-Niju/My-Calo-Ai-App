import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as adminService from "./admin.service";

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const dashboard = await adminService.getDashboard();

  res.status(200).json({
    success: true,
    dashboard,
  });
});

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

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.id as string;

  const user = await adminService.getUserDetail(userId);

  res.status(200).json({
    success: true,
    user,
  });
});

export const blockUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.id as string;

  const user = await adminService.toggleBlockUser(userId);

  res.status(200).json({
    success: true,
    user,
  });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.id as string;

  await adminService.softDeleteUser(userId);

  res.status(200).json({
    success: true,
    message: "User deleted",
  });
});
