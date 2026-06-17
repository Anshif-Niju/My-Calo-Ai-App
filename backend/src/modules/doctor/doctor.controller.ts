// src/modules/doctor/doctor.controller.ts
import { NextFunction, Request, Response } from "express";
import * as doctorService from "./doctor.service";
import { createBookingSchema, updateAvailabilitySchema, updateDoctorProfileSchema, verifyPaymentSchema } from "./doctor.validation";

// Doctor Side

export async function getMyProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const doctorId = req.user!._id.toString();
    const profile = await doctorService.createOrGetDoctorProfile(doctorId, req.user!.name, req.doctor!.email);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

export async function updateMyProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const doctorId = req.doctor!._id.toString();
    const validated = updateDoctorProfileSchema.parse(req.body);
    const profile = await doctorService.updateDoctorProfile(doctorId, validated);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

export async function updateMyAvailability(req: Request, res: Response, next: NextFunction) {
  try {
    const doctorId = req.doctor!._id.toString();
    const validated = updateAvailabilitySchema.parse(req.body);
    const profile = await doctorService.updateAvailability(doctorId, validated);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

export async function getMyBookings(req: Request, res: Response, next: NextFunction) {
  try {
    const doctorId = req.doctor!._id.toString();
    const bookings = await doctorService.getDoctorBookings(doctorId);
    res.json({ success: true, data: bookings });
  } catch (err) {
    next(err);
  }
}

export async function doctorChatAccess(req: Request, res: Response, next: NextFunction) {
  try {
    const doctorId = req.doctor!._id.toString();
    const { bookingId } = req.params;
    const result = await doctorService.checkDoctorChatAccess(doctorId, bookingId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ─── Public (User Side) ───────────────────────────────────────────────────────

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
    const { profileId } = req.params;
    const profile = await doctorService.getDoctorPublicProfile(profileId);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

export async function getAvailableSlots(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId } = req.params;
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: "date required" });
    const slots = await doctorService.getAvailableSlots(profileId, date as string);
    res.json({ success: true, data: slots });
  } catch (err) {
    next(err);
  }
}

// ─── Booking (Auth Required) ──────────────────────────────────────────────────

export async function createBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!._id.toString();
    const validated = createBookingSchema.parse(req.body);
    const result = await doctorService.createBookingOrder(userId, req.user!.email, req.user!.name, validated);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function verifyPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!._id.toString();
    const validated = verifyPaymentSchema.parse(req.body);

    // MOCK: In production, verify Razorpay signature here
    const paymentId = `pay_mock_${Date.now()}`;
    const booking = await doctorService.confirmBookingPayment(validated.bookingId, userId, paymentId);
    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
}

export async function getUserBookings(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!._id.toString();
    const bookings = await doctorService.getUserBookings(userId);
    res.json({ success: true, data: bookings });
  } catch (err) {
    next(err);
  }
}

export async function userChatAccess(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!._id.toString();
    const { bookingId } = req.params;
    const result = await doctorService.checkChatAccess(userId, bookingId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
