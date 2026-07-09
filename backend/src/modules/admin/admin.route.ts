import { Router } from "express";
import { verifyAccessToken } from "../../middlewares/authenticate.middleware";
import { authorize } from "../../middlewares/authorize.middleware";
import { createDiskUploader } from "../../middlewares/upload.middleware";
import * as adminController from "./admin.controller";

const router = Router();

const foodUpload = createDiskUploader("foods", 10, (_req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only images allowed"));
});

router.get("/dashboard", verifyAccessToken, authorize(["admin"]), adminController.getDashboard);
router.get("/users", verifyAccessToken, authorize(["admin"]), adminController.getAllUsers);
router.get("/users/:id", verifyAccessToken, authorize(["admin"]), adminController.getUserById);
router.get("/users/:id/daily-log", verifyAccessToken, authorize(["admin"]), adminController.getUserDailyLog);
router.patch("/users/:id/block", verifyAccessToken, authorize(["admin"]), adminController.blockUser);
router.delete("/users/:id", verifyAccessToken, authorize(["admin"]), adminController.deleteUser);
router.post(
  "/foods",
  verifyAccessToken,
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
router.get("/foods", verifyAccessToken, authorize(["admin"]), adminController.getAllFoods);
router.delete("/foods/:id", verifyAccessToken, authorize(["admin"]), adminController.deleteFood);
export default router;
