import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/authenticate";
import * as ctrl from "./doctor.controller";

const router = Router();

// ─── Doctor Routes (authenticate + authorize(['doctor'])) ─────────────────────
router.get("/doctor/profile", authenticate, authorize(["doctor"]), ctrl.getMyProfile);
router.put("/doctor/profile", authenticate, authorize(["doctor"]), ctrl.updateMyProfile);
router.put("/doctor/availability", authenticate, authorize(["doctor"]), ctrl.updateMyAvailability);
router.get("/doctor/bookings", authenticate, authorize(["doctor"]), ctrl.getMyBookings);
router.get("/doctor/chat-access/:bookingId", authenticate, authorize(["doctor"]), ctrl.doctorChatAccess);

// ─── User Routes ──────────────────────────────────────────────────────────────
router.post("/book", authenticate, authorize(["user"]), ctrl.createBooking);
router.post("/payment/verify", authenticate, authorize(["user"]), ctrl.verifyPayment);
router.get("/bookings/my", authenticate, authorize(["user"]), ctrl.getUserBookings);
router.get("/chat-access/:bookingId", authenticate, authorize(["user"]), ctrl.userChatAccess);

// ─── Public Routes (last!) ────────────────────────────────────────────────────
router.get("/list", ctrl.listDoctors);
router.get("/:profileId/slots", ctrl.getAvailableSlots);
router.get("/:profileId", ctrl.getDoctorDetail);

export default router;
