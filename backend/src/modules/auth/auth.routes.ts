import { Router } from "express";
import passport from "passport";
import "../../config/passport";
import { authenticate, validate } from "../../middlewares/authenticate";
import * as authController from "./auth.controller";
import {
  disable2FASchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendOtpSchema,
  resetPasswordSchema,
  twoFactorVerifySchema,
  verifyEmailSchema,
} from "./auth.validator";

const router = Router();

// Registration & Email Verification
router.post("/register", validate(registerSchema), authController.register);
router.post("/verify-email", validate(verifyEmailSchema), authController.verifyEmail); // BUG FIX: removed double validate()
router.post("/resend-otp", validate(resendOtpSchema), authController.resendOtp);       // was missing entirely

// Login & Session
router.post("/login", validate(loginSchema), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

// Password Recovery
router.post("/forgot-password", validate(forgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), authController.resetPassword);

// 2FA
router.post("/setup-2fa", authenticate, authController.setup2FA);
router.post("/verify-2fa", validate(twoFactorVerifySchema), authController.verify2FA);
router.post("/disable-2fa", authenticate, validate(disable2FASchema), authController.disable2FA); // was missing

// Google OAuth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login", session: false }),
  authController.googleCallback
);

export default router;
