import { z } from "zod";

// Approve a doctor's verification
export const approveVerificationSchema = z.object({
  params: z.object({
    doctorId: z.string().min(1, "doctorId is required"),
  }),
});

// Reject a doctor's verification (requires reason)
export const rejectVerificationSchema = z.object({
  params: z.object({
    doctorId: z.string().min(1, "doctorId is required"),
  }),
  body: z.object({
    reason: z.string().min(5, "Rejection reason must be at least 5 characters"),
  }),
});

// Deactivate / reactivate a doctor account
export const toggleDoctorStatusSchema = z.object({
  params: z.object({
    userId: z.string().min(1, "userId is required"),
  }),
});

// Hard-delete a doctor
export const deleteDoctorSchema = z.object({
  params: z.object({
    userId: z.string().min(1, "userId is required"),
  }),
});

export type ApproveVerificationInput = z.infer<typeof approveVerificationSchema>;
export type RejectVerificationInput = z.infer<typeof rejectVerificationSchema>;

