// src/jobs/queues/bookingEmail.queue.ts
import { Job, Queue, Worker } from "bullmq";
import { redis } from "../../config/redis";
import * as emailTemplate from "../../utils/email.template";
import { logger } from "../../utils/logger";

export interface BookingEmailJobData {
  type: "booking_confirmation";
  to: string;
  patientName: string;
  bookingId: string;
  doctorName: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
}

// ─── Queue ────────────────────────────────────────────────────────────────────
export const bookingEmailQueue = new Queue<BookingEmailJobData>("bookingEmailQueue", {
  connection: redis as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 3000 },
    removeOnComplete: true,
    removeOnFail: 100,
  },
});

// ─── Worker ───────────────────────────────────────────────────────────────────
export const bookingEmailWorker = new Worker<BookingEmailJobData>(
  "bookingEmailQueue",
  async (job: Job<BookingEmailJobData>) => {
    const { to, patientName, doctorName, slotDate, startTime, endTime, totalAmount } = job.data;

    console.log(`📧 Processing booking email [${job.id}] → ${to}`);

    const formattedDate = new Date(slotDate).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Kolkata",
    });

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #6366f1; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Booking Confirmed! 🎉</h1>
        </div>
        <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="color: #374151;">Hi <strong>${patientName}</strong>,</p>
          <p style="color: #374151;">Your consultation with <strong>Dr. ${doctorName}</strong> has been successfully booked.</p>
          <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 16px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Doctor</td>
                <td style="padding: 8px 0; color: #111827; font-weight: 600; text-align: right;">Dr. ${doctorName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Date</td>
                <td style="padding: 8px 0; color: #111827; font-weight: 600; text-align: right; border-top: 1px solid #f3f4f6;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Time</td>
                <td style="padding: 8px 0; color: #111827; font-weight: 600; text-align: right; border-top: 1px solid #f3f4f6;">${startTime} – ${endTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #f3f4f6;">Amount Paid</td>
                <td style="padding: 8px 0; color: #059669; font-weight: 700; text-align: right; border-top: 1px solid #f3f4f6;">₹${totalAmount}</td>
              </tr>
            </table>
          </div>
          <p style="color: #374151;">You can join the chat session from your MyCalo AI dashboard at the scheduled time.</p>
          <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">— Team MyCalo AI</p>
        </div>
      </div>
    `;

    // ✅ Uses your existing sendEmail util (same as emailWorker)
    await emailTemplate.sendEmail({
      to,
      subject: "Consultation Booking Confirmed - MyCalo AI",
      html,
    });

    logger.info(`Booking confirmation email delivered [${job.id}] → ${to}`);
  },
  {
    connection: redis as any,
    concurrency: 3,
  },
);

bookingEmailWorker.on("failed", (job, err) => {
  console.error(`Booking email job failed [${job?.id}]: ${err.message}`);
});

bookingEmailWorker.on("completed", (job) => {
  console.log(`✅ Booking email sent [${job.id}] → ${job.data.to}`);
});
