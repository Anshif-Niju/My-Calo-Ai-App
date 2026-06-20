import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/authenticate";
import * as adminController from "./admin.controller";

const router = Router();

router.get("/dashboard", authenticate, authorize(["admin"]), adminController.getDashboard);
router.get("/users", authenticate, authorize(["admin"]), adminController.getAllUsers);
router.get("/users/:id", authenticate, authorize(["admin"]), adminController.getUserById);
router.patch("/users/:id/block", authenticate, authorize(["admin"]), adminController.blockUser);
router.delete("/users/:id", authenticate, authorize(["admin"]), adminController.deleteUser);
router.post("/foods", authenticate, authorize(["admin"]), adminController.createFood);
export default router;
