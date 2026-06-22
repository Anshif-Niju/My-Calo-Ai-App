import { Router } from "express";
import { authenticate, validate } from "../../middlewares/authenticate";
import { createDiskUploader } from "../../middlewares/upload.middleware";
import * as settingsController from "./settings.controller";
import * as zod from "./settings.validator";

const router = Router();

const profileUpload = createDiskUploader("profiles", 5, (_req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only images allowed"));
});

// Profile Update
router.patch(
  "/profile",
  authenticate,
  profileUpload.single("image"),
  (req, res, next) => {
    if (req.body.data) {
      try {
        req.body = JSON.parse(req.body.data);
      } catch (error) {
        return res.status(400).json({ message: "Invalid data format" });
      }
    }
    next();
  },
  validate(zod.updateProfileSchema),
  settingsController.updateProfile
);

// Account Deletion
router.delete("/account", authenticate, settingsController.deleteAccount);

export default router;
