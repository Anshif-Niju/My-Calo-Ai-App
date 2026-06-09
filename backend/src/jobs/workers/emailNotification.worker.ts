import { Worker } from "bullmq";
import { redis } from "../../config/redis";
import { User } from "../../models/User.model";
import * as emailTemplate from "../../utils/email.template";
import { logger } from "../../utils/logger";

export const emailNotificationWorker = new Worker(
  "email-notification",
  async (job) => {
    const { type, userId, data } = job.data;
    logger.info(`📧 Sending ${type} email [${job.id}] → ${userId}`);

    const user = await User.findById(userId).select("name email");
    if (!user?.email) return;

    if (type === "morning_reminder") {
      const { yesterdayStatus, todayTarget } = data;
      const subject = yesterdayStatus === "missed" ? "🌅 New day, fresh start! Track your meals today" : "🌅 Good morning! Start tracking your meals";

      const html = emailTemplate.getMorningReminderTemplate({
        name: user.name,
        yesterdayMissed: yesterdayStatus === "missed",
        todayTarget,
      });
      await emailTemplate.sendEmail({ to: user.email, subject, html });
    }

    if (type === "goal_hit") {
      await emailTemplate.sendEmail({
        to: user.email,
        subject: "🎉 Daily calorie goal achieved!",
        html: emailTemplate.getGoalHitTemplate({ name: user.name, calories: data.calories }),
      });
    }

    if (type === "goal_over") {
      await emailTemplate.sendEmail({
        to: user.email,
        subject: "⚠️ You've exceeded your daily calorie limit",
        html: emailTemplate.getGoalOverTemplate({ name: user.name, consumed: data.consumed, target: data.target }),
      });
    }

    logger.info(`✅ Email sent [${job.id}] type=${type}`);
  },
  { connection: redis as any, concurrency: 10 },
);
