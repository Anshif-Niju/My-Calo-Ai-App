import { Job, Worker } from "bullmq";
import { redis } from "../../config/redis";
import { User } from "../../models/User.model";
import { getEmailVerificationTemplate, sendEmail } from "../../utils/email.template";

interface EmailJobBody {
  to: string;
  subject: string;
  otp: string;
}

// പുതിയ വർക്കർ നിർമ്മിക്കുന്നു
export const emailWorker = new Worker<EmailJobBody>(
  "emailQueue",
  async (job: Job<EmailJobBody>) => {
    const { to, subject, otp } = job.data;
    console.log(`⚙️ Processing background email job: ${job.id} for ${to}`);

    // 1. ഡാറ്റാബേസിൽ നിന്ന് യൂസറുടെ പേര് കണ്ടുപിടിക്കുന്നു
    const user = await User.findOne({ email: to });
    const userName = user ? user.name : "Health Enthusiast";

    // 2. നമ്മുടെ ഗ്ലാസ്സ്മോർഫിസം HTML ടെംപ്ലേറ്റ് ജനറേറ്റ് ചെയ്യുന്നു
    const emailHtml = getEmailVerificationTemplate({
      name: userName,
      otp: otp,
    });

    // 3. റെസെൻഡ് സർവീസ് വഴി ഇമെയിൽ വിടുന്നു
    await sendEmail({
      to,
      subject,
      html: emailHtml,
    });

    console.log(`✅ Email successfully delivered to ${to}`);
  },
  {
    connection: redis,
    concurrency: 5, // ഒരേ സമയം 5 ഇമെയിലുകൾ വരെ പാരലൽ ആയി പ്രൊസസ്സ് ചെയ്യും (High Performance)
  }
);

// എറർ ട്രാക്കിംഗ് (Production Monitoring)
emailWorker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed with error: ${err.message}`);
});
