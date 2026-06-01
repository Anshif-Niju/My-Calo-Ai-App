import { Queue } from "bullmq";
import { redis } from "../../config/redis";

// ക്യൂവിലേക്ക് പാസ്സ് ചെയ്യുന്ന ഡാറ്റയുടെ കൃത്യമായ ടൈപ്പ്
interface EmailJobData {
  to: string;
  subject: string;
  otp: string;
}

// BullMQ-ന്റെ ഷെയർഡ് റെഡിസ് ഇൻസ്റ്റൻസ് വെച്ച് പുതിയ ക്യൂ നിർമ്മിക്കുന്നു
export const emailQueue = new Queue<EmailJobData>("emailQueue", {
  connection: redis as any,
  defaultJobOptions: {
    attempts: 3, // ഇമെയിൽ സെൻഡിങ് പരാജയപ്പെട്ടാൽ 3 തവണ വീണ്ടും ശ്രമിക്കും (Retry Mechanism)
    backoff: {
      type: "exponential",
      delay: 5000, // ഓരോ പരാജയത്തിന് ശേഷവും 5 സെക്കൻഡ്, 10 സെക്കൻഡ് എന്നിങ്ങനെ ഗ്യാപ്പ് എടുക്കും
    },
    removeOnComplete: true, // ജോലി കഴിഞ്ഞാൽ റെഡിസ് മെമ്മറിയിൽ നിന്ന് ഡാറ്റ ക്ലീൻ ചെയ്യും
  },
});
