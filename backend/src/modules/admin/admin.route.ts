import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/authenticate";
import { createDiskUploader } from "../../middlewares/upload.middleware";
import * as adminController from "./admin.controller";

const router = Router();

const foodUpload = createDiskUploader("foods", 10, (_req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only images allowed"));
});

router.get("/dashboard", authenticate, authorize(["admin"]), adminController.getDashboard);
router.get("/users", authenticate, authorize(["admin"]), adminController.getAllUsers);
router.get("/users/:id", authenticate, authorize(["admin"]), adminController.getUserById);
router.get("/users/:id/daily-log", authenticate, authorize(["admin"]), adminController.getUserDailyLog);
router.patch("/users/:id/block", authenticate, authorize(["admin"]), adminController.blockUser);
router.delete("/users/:id", authenticate, authorize(["admin"]), adminController.deleteUser);
router.post(
  "/foods",
  authenticate,
  authorize(["admin"]),
  foodUpload.single("image"),
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
  adminController.createFood,
);
router.get("/foods", authenticate, authorize(["admin"]), adminController.getAllFoods);
router.delete("/foods/:id", authenticate, authorize(["admin"]), adminController.deleteFood);
export default router;
