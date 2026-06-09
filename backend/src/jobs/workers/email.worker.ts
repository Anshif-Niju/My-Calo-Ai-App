import { Job, Worker } from "bullmq";
import { redis } from "../../config/redis";
import { User } from "../../models/User.model";
import { EmailJobData } from "../../types/index";
import * as emailTemplate from "../../utils/email.template";
import { logger } from "../../utils/logger";

export const emailWorker = new Worker<EmailJobData>(
  "emailQueue",
  async (job: Job<EmailJobData>) => {
    const { type, to, subject, otp } = job.data;
    console.log(`📧 Processing email job [${job.id}] type="${type}" → ${to}`);

    const user = await User.findOne({ email: to });
    const userName = user?.name ?? "Health Enthusiast";

    let emailHtml: string;

    switch (type) {
      case "verify_email":
        // otp is guaranteed to exist for this type (TypeScript + runtime check)
        if (!otp) throw new Error("OTP missing for verify_email job");
        emailHtml = emailTemplate.getEmailVerificationTemplate({ name: userName, otp });
        break;

      case "forgot_password":
        if (!otp) throw new Error("OTP missing for forgot_password job");
        emailHtml = emailTemplate.getForgotPasswordTemplate({ name: userName, otp });
        break;

      case "login_success": {
        // Format current date/time nicely for the email body
        const loginTime = new Date().toLocaleString("en-IN", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Kolkata",
        });
        emailHtml = emailTemplate.getLoginSuccessTemplate({ name: userName, loginTime });
        break;
      }

      default:
        throw new Error(`Unknown email job type: ${(job.data as any).type}`);
    }

    await emailTemplate.sendEmail({ to, subject, html: emailHtml });
    logger.info(`Email delivered [${job.id}] type="${type}" → ${to}`);
  },
  {
    connection: redis as any,
    concurrency: 5,
  },
);

emailWorker.on("failed", (job, err) => {
  console.error(`Email job failed [${job?.id}] type="${job?.data.type}": ${err.message}`);
});

emailWorker.on("completed", (job) => {
  console.log(`✅ Email job completed [${job.id}] type="${job.data.type}"`);
});
