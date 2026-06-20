// // src/modules/doctor/doctor.service.ts
// import { v4 as uuidv4 } from "uuid";
// import { Booking } from "../../models/booking.model";
// import { DoctorProfile } from "../../models/doctor-profile.model";
// import { CreateBookingInput, UpdateAvailabilityInput, UpdateDoctorProfileInput } from "./doctor.validation";

// // ─── Doctor Profile ─────────────────────────────────────────────────────────

// export async function getDoctorProfileByDoctorId(doctorId: string) {
//   return DoctorProfile.findOne({ doctorId });
// }

// export async function createOrGetDoctorProfile(doctorId: string, name: string, email: string) {
//   let profile = await DoctorProfile.findOne({ doctorId });
//   if (!profile) {
//     // create default availability with 7 days (all disabled)
//     const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
//     const availability = days.map((day) => ({ day, isAvailable: false, slots: [] }));
//     profile = await DoctorProfile.create({
//       doctorId,
//       name,
//       email,
//       availability,
//       isProfileComplete: false,
//     });
//   }
//   return profile;
// }

// export async function updateDoctorProfile(doctorId: string, data: UpdateDoctorProfileInput) {
//   const profile = await DoctorProfile.findOneAndUpdate({ doctorId }, { $set: data }, { new: true });
//   if (!profile) throw new Error("Doctor profile not found");

//   // Check if profile is complete
//   const isComplete = !!(profile.name && profile.specialization && profile.experience > 0 && profile.about && profile.consultationFee > 0);
//   if (isComplete !== profile.isProfileComplete) {
//     profile.isProfileComplete = isComplete;
//     await profile.save();
//   }
//   return profile;
// }

// export async function updateAvailability(doctorId: string, data: UpdateAvailabilityInput) {
//   // Add IDs to new slots if missing
//   const availability = data.availability.map((day) => ({
//     ...day,
//     slots: day.slots.map((slot) => ({
//       ...slot,
//       id: slot.id || uuidv4(),
//       isBooked: false,
//     })),
//   }));

//   const profile = await DoctorProfile.findOneAndUpdate({ doctorId }, { $set: { availability } }, { new: true });
//   if (!profile) throw new Error("Doctor profile not found");
//   return profile;
// }

// // ─── Public Doctor Listing ───────────────────────────────────────────────────

// export async function listDoctors(filters: { specialization?: string; search?: string; page?: number; limit?: number }) {
//   const { specialization, search, page = 1, limit = 12 } = filters;
//   const query: any = { isProfileComplete: true, isActive: true };

//   if (specialization) query.specialization = specialization;
//   if (search) {
//     query.$or = [{ name: { $regex: search, $options: "i" } }, { specialization: { $regex: search, $options: "i" } }, { services: { $elemMatch: { $regex: search, $options: "i" } } }];
//   }

//   const skip = (page - 1) * limit;
//   const [doctors, total] = await Promise.all([DoctorProfile.find(query).select("name profilePhoto specialization experience qualifications services consultationFee about").skip(skip).limit(limit).lean(), DoctorProfile.countDocuments(query)]);

//   return {
//     doctors,
//     pagination: { page, limit, total, pages: Math.ceil(total / limit) },
//   };
// }

// export async function getDoctorPublicProfile(profileId: string) {
//   const profile = await DoctorProfile.findOne({
//     _id: profileId,
//     isProfileComplete: true,
//     isActive: true,
//   }).lean();
//   if (!profile) throw new Error("Doctor not found");
//   return profile;
// }

// export async function getAvailableSlots(profileId: string, date: string) {
//   // date: "2024-06-20" (ISO)
//   const profile = await DoctorProfile.findById(profileId).lean();
//   if (!profile) throw new Error("Doctor not found");

//   const dateObj = new Date(date);
//   const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
//   const dayName = dayNames[dateObj.getDay()];

//   const dayAvailability = profile.availability.find((d) => d.day === dayName);
//   if (!dayAvailability?.isAvailable) return [];

//   // Check which slots are already booked on this date
//   const startOfDay = new Date(date);
//   startOfDay.setHours(0, 0, 0, 0);
//   const endOfDay = new Date(date);
//   endOfDay.setHours(23, 59, 59, 999);

//   const bookedSlots = await Booking.find({
//     doctorProfileId: profileId,
//     slotDate: { $gte: startOfDay, $lte: endOfDay },
//     status: { $in: ["confirmed", "pending_payment"] },
//   })
//     .select("slotId")
//     .lean();

//   const bookedSlotIds = new Set(bookedSlots.map((b) => b.slotId));

//   return dayAvailability.slots.map((slot) => ({
//     ...slot,
//     isBooked: bookedSlotIds.has(slot.id),
//   }));
// }

// // ─── Booking ─────────────────────────────────────────────────────────────────

// export async function createBookingOrder(userId: string, userEmail: string, userName: string, data: CreateBookingInput) {
//   const profile = await DoctorProfile.findById(data.doctorProfileId);
//   if (!profile) throw new Error("Doctor not found");

//   // Verify slot is available
//   const slots = await getAvailableSlots(data.doctorProfileId, data.slotDate);
//   const slot = slots.find((s) => s.id === data.slotId);
//   if (!slot) throw new Error("Slot not found");
//   if (slot.isBooked) throw new Error("Slot already booked");

//   const gstAmount = Math.round((profile.consultationFee * profile.gstPercent) / 100);
//   const totalAmount = profile.consultationFee + gstAmount;

//   // Mock Razorpay order (replace with real Razorpay later)
//   const mockOrderId = `order_mock_${uuidv4().replace(/-/g, "").slice(0, 16)}`;

//   const booking = await Booking.create({
//     userId,
//     doctorId: profile.doctorId,
//     doctorProfileId: profile._id,
//     slotId: data.slotId,
//     slotDate: new Date(data.slotDate),
//     slotDay: data.slotDay,
//     startTime: slot.startTime,
//     endTime: slot.endTime,
//     patientName: userName,
//     patientEmail: userEmail,
//     consultationFee: profile.consultationFee,
//     gstAmount,
//     totalAmount,
//     paymentOrderId: mockOrderId,
//     status: "pending_payment",
//   });

//   return {
//     booking,
//     paymentDetails: {
//       orderId: mockOrderId,
//       amount: totalAmount,
//       currency: "INR",
//       doctorName: profile.name,
//       slotTime: `${slot.startTime} - ${slot.endTime}`,
//       slotDate: data.slotDate,
//       consultationFee: profile.consultationFee,
//       gstAmount,
//       gstPercent: profile.gstPercent,
//       totalAmount,
//     },
//   };
// }

// export async function confirmBookingPayment(bookingId: string, userId: string, paymentId: string) {
//   const booking = await Booking.findOne({ _id: bookingId, userId });
//   if (!booking) throw new Error("Booking not found");
//   if (booking.status !== "pending_payment") throw new Error("Invalid booking status");

//   const chatSessionId = uuidv4();

//   // Parse slot datetime for chat window
//   const [hours, minutes] = booking.startTime.split(":").map(Number);
//   const [endHours, endMinutes] = booking.endTime.split(":").map(Number);
//   const chatStart = new Date(booking.slotDate);
//   chatStart.setHours(hours, minutes, 0, 0);
//   const chatEnd = new Date(booking.slotDate);
//   chatEnd.setHours(endHours, endMinutes, 0, 0);

//   booking.paymentId = paymentId;
//   booking.status = "confirmed";
//   booking.chatSessionId = chatSessionId;
//   booking.chatStartTime = chatStart;
//   booking.chatEndTime = chatEnd;
//   await booking.save();

//   // Queue confirmation email
//   await bookingEmailQueue.add("booking-confirmation", {
//     type: "booking_confirmation",
//     to: booking.patientEmail,
//     patientName: booking.patientName,
//     doctorName: profile.name, // ← add this
//     bookingId: booking._id.toString(),
//     doctorProfileId: booking.doctorProfileId.toString(),
//     slotDate: booking.slotDate.toISOString(),
//     startTime: booking.startTime,
//     endTime: booking.endTime,
//     totalAmount: booking.totalAmount,
//   });
//   return booking;
// }

// export async function getUserBookings(userId: string) {
//   return Booking.find({ userId, status: { $in: ["confirmed", "completed"] } })
//     .populate({
//       path: "doctorProfileId",
//       select: "name profilePhoto specialization consultationFee",
//     })
//     .sort({ slotDate: -1 })
//     .lean();
// }

// export async function getDoctorBookings(doctorId: string) {
//   return Booking.find({ doctorId, status: { $in: ["confirmed", "completed"] } })
//     .populate({
//       path: "userId",
//       select: "name email",
//     })
//     .sort({ slotDate: -1 })
//     .lean();
// }

// // ─── Chat Gate ────────────────────────────────────────────────────────────────

// export async function checkChatAccess(userId: string, bookingId: string) {
//   const booking = await Booking.findOne({
//     _id: bookingId,
//     userId,
//     status: "confirmed",
//   });
//   if (!booking) return { allowed: false, reason: "Booking not found" };
//   if (!booking.chatStartTime || !booking.chatEndTime) {
//     return { allowed: false, reason: "Chat session not configured" };
//   }

//   const now = new Date();
//   // Allow 5 min early join
//   const earlyJoin = new Date(booking.chatStartTime.getTime() - 5 * 60 * 1000);

//   if (now < earlyJoin) {
//     return {
//       allowed: false,
//       reason: "Chat not started yet",
//       startsAt: booking.chatStartTime,
//     };
//   }
//   if (now > booking.chatEndTime) {
//     return {
//       allowed: false,
//       reason: "Consultation time ended",
//       endedAt: booking.chatEndTime,
//     };
//   }

//   return {
//     allowed: true,
//     chatSessionId: booking.chatSessionId,
//     startTime: booking.chatStartTime,
//     endTime: booking.chatEndTime,
//   };
// }

// export async function checkDoctorChatAccess(doctorId: string, bookingId: string) {
//   const booking = await Booking.findOne({
//     _id: bookingId,
//     doctorId,
//     status: "confirmed",
//   });
//   if (!booking) return { allowed: false, reason: "Booking not found" };
//   if (!booking.chatStartTime || !booking.chatEndTime) {
//     return { allowed: false, reason: "Chat session not configured" };
//   }

//   const now = new Date();
//   const earlyJoin = new Date(booking.chatStartTime.getTime() - 5 * 60 * 1000);

//   if (now < earlyJoin) {
//     return { allowed: false, reason: "Chat not started yet", startsAt: booking.chatStartTime };
//   }
//   if (now > booking.chatEndTime) {
//     return { allowed: false, reason: "Consultation time ended", endedAt: booking.chatEndTime };
//   }

//   return {
//     allowed: true,
//     chatSessionId: booking.chatSessionId,
//     patientName: booking.patientName,
//     startTime: booking.chatStartTime,
//     endTime: booking.chatEndTime,
//   };
// }
