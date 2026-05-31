import * as Express from "express";

export interface AuthUserPayload {
  userId: string;
  role: "user" | "doctor" | "subadmin" | "admin";
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user: AuthUserPayload;
    }
  }
}
