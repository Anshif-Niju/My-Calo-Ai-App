
import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodError } from "zod";

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
