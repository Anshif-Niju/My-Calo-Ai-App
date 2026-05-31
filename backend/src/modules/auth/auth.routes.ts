import { Router } from "express";
import { authenticate, validate } from "../../middlewares/authenticate";
import * as authController from "./auth.controller";
import { loginSchema, registerSchema, twoFactorSchema, verifyEmailSchema } from "./auth.validator";

const router = Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/verify-email", validate(verifyEmailSchema), authController.verifyEmail);
router.post("/login", validate(loginSchema), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

// 2FA Routes (Require Authentication or Temp Token)
router.post("/setup-2fa", authenticate, authController.setup2FA);
router.post("/verify-2fa", validate(twoFactorSchema), authController.verify2FA);

export default router;
