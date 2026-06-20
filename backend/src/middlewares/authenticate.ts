import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AnyZodObject, ZodError } from "zod";
import { AuthUserPayload } from "../types/index.js";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as AuthUserPayload;

    req.user = decoded as Express.Request["user"];
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

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

// Generic validation middleware for Zod schemas

export const validate = (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    req.body = parsed.body;
    next();
  } catch (error: any) {
    if (error instanceof ZodError) {
      console.log("ZOD VALIDATION ERROR:", JSON.stringify(error.errors, null, 2));
      return res.status(400).json({ message: "Validation failed", errors: error.issues });
    }

    console.error("UNKNOWN MIDDLEWARE ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};



