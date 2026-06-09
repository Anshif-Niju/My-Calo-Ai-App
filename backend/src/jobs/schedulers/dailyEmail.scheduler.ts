import { emailNotificationQueue } from "../queues/emailNotification.queue";
import { DailyLog } from "../../models/DailyLog.model";
import { User } from "../../models/User.model";
import { logger } from "../../utils/logger";

// Run at 6 AM every day
export const startDailyEmailScheduler = async () => {
  // BullMQ repeatable job — cron: "0 6 * * *" = 6 AM daily
  await emailNotificationQueue.add(
    "daily-morning-check",
    { type: "scheduler_trigger" },
    {
      repeat: { pattern: "0 6 * * *" },
      jobId: "daily-morning-email",
    },
  );
  logger.info("📅 Daily email scheduler started (6 AM)");
};

// Called by the worker when it processes "scheduler_trigger"
export const processMorningEmails = async () => {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  // Get all verified users
  const users = await User.find({
    isVerified: true,
    role: "user",
    isEmailVerified: true,
  }).select("_id dailyTargets");

  logger.info(`📧 Processing morning emails for ${users.length} users`);

  for (const user of users) {
    const userId = user._id.toString();

    // Check yesterday's log
    const yesterdayLog = await DailyLog.findOne({ userId, date: yesterday });
    const yesterdayStatus = !yesterdayLog || yesterdayLog.mealCount === 0
      ? "missed"
      : yesterdayLog.status;

    // Don't send if already sent today
    const todayLog = await DailyLog.findOne({ userId, date: today });
    if (todayLog?.emailSent.morning) continue;

    // Queue email
    await emailNotificationQueue.add("morning-reminder", {
      type: "morning_reminder",
      userId,
      data: {
        yesterdayStatus,
        todayTarget: user.dailyTargets?.calories || 2000,
      },
    });

    // Mark as sent
    await DailyLog.findOneAndUpdate(
      { userId, date: today },
      { $set: { "emailSent.morning": true } },
      { upsert: true },
    );
  }
};
