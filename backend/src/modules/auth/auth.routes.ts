import { Router } from "express";
import passport from "passport";
import "../../config/passport";
import { verifyAccessToken,verifyRefreshToken,verifyTemp2FAToken} from "../../middlewares/authenticate.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { authLimiter } from "../../middlewares/rateLimiter";
import * as authController from "./auth.controller";
import * as zod from "./auth.validator";

const router = Router();

// Registration
router.post("/register", authLimiter, validate(zod.registerSchema), authController.register);
router.post("/verify-otp", authLimiter, validate(zod.verifyOtpSchema), authController.verifyOtp);
router.post("/resend-otp", authLimiter, validate(zod.resendOtpSchema), authController.resendOtp);

// Login
router.post("/login", authLimiter, validate(zod.loginSchema), authController.login);
router.post("/refresh",verifyRefreshToken, authController.refresh);
router.post("/logout", authController.logout);

// Password Recovery
router.post("/forgot-password", authLimiter, validate(zod.forgotPasswordSchema), authController.forgotPassword);
router.post("/new-password", authLimiter, validate(zod.resetPasswordSchema), authController.newPassword);

// 2FA
router.post("/setup-2fa", verifyAccessToken, authController.setup2FA);
router.post("/verify-2fa",verifyTemp2FAToken, validate(zod.twoFactorVerifySchema), authController.verify2FA);
router.post("/disable-2fa", verifyAccessToken, validate(zod.disable2FASchema), authController.disable2FA);

// Google OAuth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));
router.get("/google/callback", passport.authenticate("google", { failureRedirect: "/login", session: false }), authController.googleCallback);

// User Detail
router.get("/me", verifyAccessToken, authController.getMe);

export default router;
