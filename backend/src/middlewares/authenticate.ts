import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AuthUserPayload } from "../types/index.js";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as AuthUserPayload;

    req.user = decoded as Express.Request["user"];
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as AuthUserPayload | undefined;

    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    }
    next();
  };
};

// Generic validation middleware for Zod schemas

export const validate = (schema: any) => (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse({ body: req.body, query: req.query, params: req.params });
    next();
  }catch (error: any) {
    return res.status(400).json({ errors: error.errors });
  }
};
