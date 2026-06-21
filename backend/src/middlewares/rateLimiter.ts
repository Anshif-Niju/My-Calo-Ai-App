import rateLimit from "express-rate-limit";

// Global — all routes: max 200 requests per minute per IP
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 200,
  message: { success: false, message: "Too many requests, please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth routes — max 10 requests per 15 minutes per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 11,
  message: { success: false, message: "Too many login attempts. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Food scan — max 10 scans per minute per IP
export const scanLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 10,
  message: { success: false, message: "Scan limit reached. Wait a moment." },
  standardHeaders: true,
  legacyHeaders: false,
});
