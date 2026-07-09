import { NextFunction, Request, Response } from "express";
import { AuthUserPayload } from "../types/index.js";

//Checking the role
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as AuthUserPayload | undefined;

    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    }
    next();
  };
};
