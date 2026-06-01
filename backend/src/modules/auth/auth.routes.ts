import { Router } from "express";
import passport from "passport";
import "../../config/passport";
import { authenticate, validate } from "../../middlewares/authenticate";
import * as authController from "./auth.controller";
import { loginSchema, registerSchema, verifyEmailSchema } from "./auth.validator";

const router = Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/verify-email", validate(validate(verifyEmailSchema)), authController.verifyEmail);
router.post("/login", validate(loginSchema), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

// 2FA Routes
router.post("/setup-2fa", authenticate, authController.setup2FA);
router.post("/verify-2fa", authController.verify2FA); // Validations handled inside combined logic for tempToken support

// Google Auth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));
router.get("/google/callback",passport.authenticate("google", { failureRedirect: "/login", session: false }),authController.googleCallback);

export default router;
