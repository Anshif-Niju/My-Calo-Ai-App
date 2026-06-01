import { Resend } from "resend";
import { env } from "../config/env";

// env.ts-ൽ RESEND_API_KEY കൂടി ആഡ് ചെയ്യണം
const resend = new Resend(env.RESEND_API_KEY || "re_mock_key");

interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
}

/**
 * Resend API വഴി യഥാർത്ഥ ഇമെയിൽ അയക്കുന്ന കോർ ഫങ്ക്ഷൻ (Strictly Typed)
 */
export const sendEmail = async ({ to, subject, html }: SendEmailArgs): Promise<void> => {
  try {
    // പ്രൊഡക്ഷൻ മോഡിൽ അല്ലെങ്കിൽ ടെസ്റ്റിംഗിൽ കൺസോളിൽ മാത്രം കാണിക്കും
    if (env.NODE_ENV === "test") {
      console.log(`✉️ [Mock Email] Sent to ${to} | Subject: ${subject}`);
      return;
    }

    const { error } = await resend.emails.send({
      from: "MyCalo AI <onboarding@resend.dev>", // നാളെ കസ്റ്റം ഡൊമൈൻ വാങ്ങുമ്പോൾ ഇത് മാറ്റാം
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      throw new Error(`Resend API Error: ${error.message}`);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown email error occurred";
    console.error("❌ Failed to trigger Resend API:", errorMessage);
    throw error; // Worker-ന് റീ-ട്രൈ ചെയ്യാൻ എറർ തിരികെ നൽകുന്നു
  }
};


