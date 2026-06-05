import { Router } from "express";
import passport from "passport";
import "../../config/passport";
import { authenticate, validate } from "../../middlewares/authenticate";
import * as authController from "./auth.controller";
import * as zod from "./auth.validator";

const router = Router();

// Registration & Verification
router.post("/register", validate(zod.registerSchema), authController.register);
router.post("/verify-otp", validate(zod.verifyOtpSchema), authController.verifyOtp);
router.post("/resend-otp", validate(zod.resendOtpSchema), authController.resendOtp);

// Login & Session
router.post("/login", validate(zod.loginSchema), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

// Password Recovery
router.post("/forgot-password", validate(zod.forgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password", validate(zod.resetPasswordSchema), authController.resetPassword);

// 2FA
router.post("/setup-2fa", authenticate, authController.setup2FA);
router.post("/verify-2fa", validate(zod.twoFactorVerifySchema), authController.verify2FA);
router.post("/disable-2fa", authenticate, validate(zod.disable2FASchema), authController.disable2FA);

// Google OAuth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));
router.get("/google/callback", passport.authenticate("google", { failureRedirect: "/login", session: false }), authController.googleCallback);

// User Detail
router.get("/me", authenticate, authController.getMe);

export default router;
