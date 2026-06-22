import { z } from "zod";

const timeSlotSchema = z.object({
  id: z.string(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

const dayAvailabilitySchema = z.object({
  day: z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]),
  isAvailable: z.boolean(),
  slots: z.array(timeSlotSchema),
});

export const updateDoctorProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  specialization: z.string().optional(),
  experience: z.number().min(0).optional(),
  qualifications: z.array(z.string()).optional(),
  about: z.string().max(2000).optional(),
  services: z.array(z.string()).optional(),
  consultationFee: z.number().min(0).optional(),
  gstPercent: z.number().min(0).max(30).optional(),
  razorpayAccountId: z.string().optional(),
});

export const updateAvailabilitySchema = z.object({
  availability: z.array(dayAvailabilitySchema).length(7),
});

export const createBookingSchema = z.object({
  doctorProfileId: z.string(),
  slotId: z.string(),
  slotDate: z.string(), // ISO date string "2024-06-20"
  slotDay: z.string(),
});

export const verifyPaymentSchema = z.object({
  bookingId: z.string(),
  razorpayPaymentId: z.string().optional(),
  razorpayOrderId: z.string().optional(),
  razorpaySignature: z.string().optional(),
  mockPaymentSuccess: z.boolean().optional(),
});

export type UpdateDoctorProfileInput = z.infer<typeof updateDoctorProfileSchema>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
