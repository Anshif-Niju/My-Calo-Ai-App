import { NextFunction, Request, Response } from "express";
import * as doctorService from "./doctor.service";
import { createBookingSchema, updateAvailabilitySchema, updateDoctorProfileSchema, verifyPaymentSchema } from "./doctor.validation";
import { User } from "../../models/User.model";
import { AuthUserPayload } from "../../types";
import crypto from "crypto";
import { env } from "../../config/env";


// Doctor Side

export async function getMyProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const doctorId = (req.user as AuthUserPayload).userId;
    const profile = await doctorService.createOrGetDoctorProfile(doctorId);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

export async function updateMyProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const doctorId = (req.user as AuthUserPayload).userId;
    const validated = updateDoctorProfileSchema.parse(req.body);
    const profile = await doctorService.updateDoctorProfile(doctorId, validated);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

export async function updateMyAvailability(req: Request, res: Response, next: NextFunction) {
  try {
    const doctorId = (req.user as AuthUserPayload).userId;
    const validated = updateAvailabilitySchema.parse(req.body);
    const profile = await doctorService.updateAvailability(doctorId, validated);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

export async function getMyBookings(req: Request, res: Response, next: NextFunction) {
  try {
    const doctorId = (req.user as AuthUserPayload).userId;
    const bookings = await doctorService.getDoctorBookings(doctorId);
    res.json({ success: true, data: bookings });
  } catch (err) {
    next(err);
  }
}

export async function doctorChatAccess(req: Request, res: Response, next: NextFunction) {
  try {
    const doctorId = (req.user as AuthUserPayload).userId;
    const bookingId = req.params.bookingId as string;
    const result = await doctorService.checkDoctorChatAccess(doctorId, bookingId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// Public (User Side)

export async function listDoctors(req: Request, res: Response, next: NextFunction) {
  try {
    const { specialization, search, page, limit } = req.query;
    const result = await doctorService.listDoctors({
      specialization: specialization as string,
      search: search as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 12,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function getDoctorDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const profileId = req.params.profileId as string;
    const profile = await doctorService.getDoctorPublicProfile(profileId);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

export async function getAvailableSlots(req: Request, res: Response, next: NextFunction) {
  try {
    const profileId = req.params.profileId as string;
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: "date required" });
    const slots = await doctorService.getAvailableSlots(profileId, date as string);
    res.json({ success: true, data: slots });
  } catch (err) {
    next(err);
  }
}

// Booking (Auth Required)

export async function createBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as AuthUserPayload).userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const validated = createBookingSchema.parse(req.body);
    const result = await doctorService.createBookingOrder(userId, user.email, user.name, validated);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function verifyPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as AuthUserPayload).userId;
    const { bookingId, razorpayPaymentId, razorpayOrderId, razorpaySignature, mockPaymentSuccess } = verifyPaymentSchema.parse(req.body);

    let paymentId = razorpayPaymentId || `pay_mock_${Date.now()}`;

    // Verify signature if credentials and signature are provided
    if (razorpaySignature && razorpayOrderId && razorpayPaymentId) {
      if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_ID !== "rzp_test_placeholder") {
        const text = razorpayOrderId + "|" + razorpayPaymentId;
        const generatedSignature = crypto
          .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
          .update(text)
          .digest("hex");

        if (generatedSignature !== razorpaySignature) {
          return res.status(400).json({ success: false, message: "Payment signature verification failed" });
        }
      }
    }

    const booking = await doctorService.confirmBookingPayment(bookingId, userId, paymentId);
    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
}

export async function getUserBookings(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as AuthUserPayload).userId;
    const bookings = await doctorService.getUserBookings(userId);
    res.json({ success: true, data: bookings });
  } catch (err) {
    next(err);
  }
}

export async function userChatAccess(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as AuthUserPayload).userId;
    const bookingId = req.params.bookingId as string;
    const result = await doctorService.checkChatAccess(userId, bookingId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getBookingMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as AuthUserPayload).userId;
    const bookingId = req.params.bookingId as string;

    // Check membership
    const booking = await doctorService.getBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.userId.toString() !== userId && booking.doctorId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Access denied. You are not a member of this consultation." });
    }

    const messages = await doctorService.getBookingMessages(bookingId);
    res.json({ success: true, data: messages });
  } catch (err) {
    next(err);
  }
}

export async function completeBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const doctorId = (req.user as AuthUserPayload).userId;
    const bookingId = req.params.bookingId as string;

    const booking = await doctorService.completeBooking(bookingId, doctorId);
    res.json({ success: true, message: "Consultation marked as completed successfully", data: booking });
  } catch (err) {
    next(err);
  }
}

export async function getBookingDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req.user as AuthUserPayload).userId;
    const bookingId = req.params.bookingId as string;

    const booking = await doctorService.getBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.userId.toString() !== userId && booking.doctorId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Access denied. You are not a member of this consultation." });
    }

    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
}


