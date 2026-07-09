import { Router } from "express";
import { verifyAccessToken } from "../../middlewares/authenticate.middleware";
import { authorize } from "../../middlewares/authorize.middleware";

import * as ctrl from "./doctor.controller";

const router = Router();

// Doctor Routes
router.get("/doctor/profile", verifyAccessToken, authorize(["doctor"]), ctrl.getMyProfile);
router.put("/doctor/profile", verifyAccessToken, authorize(["doctor"]), ctrl.updateMyProfile);
router.put("/doctor/availability", verifyAccessToken, authorize(["doctor"]), ctrl.updateMyAvailability);
router.get("/doctor/bookings", verifyAccessToken, authorize(["doctor"]), ctrl.getMyBookings);
router.get("/doctor/chat-access/:bookingId", verifyAccessToken, authorize(["doctor"]), ctrl.doctorChatAccess);

// User Routes
router.post("/book", verifyAccessToken, authorize(["user"]), ctrl.createBooking);
router.post("/payment/verify", verifyAccessToken, authorize(["user"]), ctrl.verifyPayment);
router.get("/bookings/my", verifyAccessToken, authorize(["user"]), ctrl.getUserBookings);
router.get("/chat-access/:bookingId", verifyAccessToken, authorize(["user"]), ctrl.userChatAccess);

// Shared Consultation Routes
router.get("/bookings/:bookingId", verifyAccessToken, authorize(["doctor", "user"]), ctrl.getBookingDetails);
router.get("/bookings/:bookingId/messages", verifyAccessToken, authorize(["doctor", "user"]), ctrl.getBookingMessages);
router.patch("/bookings/:bookingId/complete", verifyAccessToken, authorize(["doctor"]), ctrl.completeBooking);

// Public Routes
router.get("/list", ctrl.listDoctors);
router.get("/:profileId/slots", ctrl.getAvailableSlots);
router.get("/:profileId", ctrl.getDoctorDetail);

export default router;
