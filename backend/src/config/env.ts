import dotenv from "dotenv";
dotenv.config();

import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  MONGODB_URI: z.string().url("MONGODB_URI must be a valid connection string"),
  REDIS_URL: z.string().url("REDIS_URL must be a valid connection string"),

  JWT_SECRET: z.string().min(8, "JWT_SECRET must be at least 8 characters long"),
  JWT_REFRESH_SECRET: z.string().min(8, "REFRESH_SECRET must be at least 8 characters long"),
  JWT_2FA_TEMP_SECRET: z.string().min(8, "JWT_2FA_TEMP_SECRET must be at least 8 characters long"),

  ADMIN_EMAIL: z.string(),
  ADMIN_PASSWORD: z.string().min(8, "Admin password must be at least 8 characters"),

  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),

  FRONTEND_URL: z.string().url("FRONTEND_URL must be a valid URL"),

  BREVO_API_KEY: z.string().min(1, "BREVO_API_KEY is required"),
  BREVO_SENDER_EMAIL: z.string().email(),

  GEMINI_API_KEY: z.string().min(1, "BREVO_API_KEY is required"),

  LOGMEAL_API_KEY: z.string().min(1, "BREVO_API_KEY is required"),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment configurations:");
  console.error(JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

export const env = parsedEnv.data;

export type EnvConfig = z.infer<typeof envSchema>;
