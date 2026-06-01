import { Resend } from "resend";
import { env } from "../config/env";

const resend = new Resend(env.RESEND_API_KEY);

interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: SendEmailArgs): Promise<void> => {
  if (env.NODE_ENV === "test") {
    console.log(`✉️  [Mock Email] To: ${to} | Subject: ${subject}`);
    return;
  }

  const { error } = await resend.emails.send({
    from: "MyCalo AI <onboarding@resend.dev>",
    to: [to],
    subject,
    html,
  });

  if (error) {
    // Throwing here causes BullMQ to mark the job as failed and retry it
    throw new Error(`Resend API Error: ${error.message}`);
  }
};

//  Template 1: Email Verification OTP

export const getEmailVerificationTemplate = ({
  name,
  otp,
}: {
  name: string;
  otp: string;
}): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background-color:#0f0f1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f1a;padding:48px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(124,58,237,0.15),rgba(79,70,229,0.1));border:1px solid rgba(124,58,237,0.3);border-radius:20px;overflow:hidden;">
        <tr>
          <td style="padding:36px 40px 28px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
            <div style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:16px;padding:12px 24px;margin-bottom:16px;">
              <span style="color:#ffffff;font-size:22px;font-weight:700;">🥗 MyCalo AI</span>
            </div>
            <p style="margin:0;color:rgba(255,255,255,0.5);font-size:13px;letter-spacing:0.5px;">YOUR PERSONAL HEALTH COMPANION</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <h2 style="margin:0 0 12px;color:#ffffff;font-size:24px;font-weight:600;">Welcome, ${name}! 👋</h2>
            <p style="margin:0 0 32px;color:rgba(255,255,255,0.6);font-size:15px;line-height:1.7;">
              You're one step away from starting your health journey. Use the verification code below to confirm your email address.
            </p>
            <div style="background:rgba(124,58,237,0.2);border:2px dashed rgba(124,58,237,0.6);border-radius:16px;padding:32px;text-align:center;margin-bottom:32px;">
              <p style="margin:0 0 12px;color:rgba(167,139,250,0.9);font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">YOUR OTP CODE</p>
              <p style="margin:0;color:#ffffff;font-size:48px;font-weight:800;letter-spacing:14px;font-variant-numeric:tabular-nums;">${otp}</p>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:10px;margin-bottom:24px;">
              <tr>
                <td style="padding:14px 18px;">
                  <p style="margin:0;color:rgba(252,211,77,0.9);font-size:13px;line-height:1.6;">
                    ⏰ <strong>This code expires in 1 minute.</strong> Do not share it with anyone.
                  </p>
                </td>
              </tr>
            </table>
            <p style="margin:0;color:rgba(255,255,255,0.35);font-size:13px;line-height:1.6;">
              If you didn't create a MyCalo AI account, you can safely ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p style="margin:0;color:rgba(255,255,255,0.25);font-size:12px;">© ${new Date().getFullYear()} MyCalo AI. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

// Template 2: Forgot Password OTP

export const getForgotPasswordTemplate = ({
  name,
  otp,
}: {
  name: string;
  otp: string;
}): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background-color:#0f0f1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f1a;padding:48px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(220,38,38,0.12),rgba(239,68,68,0.08));border:1px solid rgba(220,38,38,0.3);border-radius:20px;overflow:hidden;">
        <tr>
          <td style="padding:36px 40px 28px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
            <div style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:16px;padding:12px 24px;margin-bottom:16px;">
              <span style="color:#ffffff;font-size:22px;font-weight:700;">🥗 MyCalo AI</span>
            </div>
            <p style="margin:0;color:rgba(255,255,255,0.5);font-size:13px;letter-spacing:0.5px;">PASSWORD RESET REQUEST</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <h2 style="margin:0 0 12px;color:#ffffff;font-size:24px;font-weight:600;">Password Reset 🔐</h2>
            <p style="margin:0 0 32px;color:rgba(255,255,255,0.6);font-size:15px;line-height:1.7;">
              Hi ${name}, we received a request to reset your MyCalo AI password. Use the code below to proceed.
            </p>
            <div style="background:rgba(220,38,38,0.2);border:2px dashed rgba(220,38,38,0.6);border-radius:16px;padding:32px;text-align:center;margin-bottom:32px;">
              <p style="margin:0 0 12px;color:rgba(252,165,165,0.9);font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">RESET CODE</p>
              <p style="margin:0;color:#ffffff;font-size:48px;font-weight:800;letter-spacing:14px;">${otp}</p>
            </div>
            <p style="margin:0;color:rgba(255,255,255,0.35);font-size:13px;line-height:1.6;">
              ⏰ This code expires in <strong style="color:rgba(255,255,255,0.6);">1 minute</strong>.
              If you didn't request this, your account is safe — just ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p style="margin:0;color:rgba(255,255,255,0.25);font-size:12px;">© ${new Date().getFullYear()} MyCalo AI. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

// ─── Template 3: Login Success Notification (NEW) ─────────────────────────────
// Sent every time a user successfully logs in.
// Purpose: security notification — if the user didn't log in, they can act fast.

export const getLoginSuccessTemplate = ({
  name,
  loginTime,
}: {
  name: string;
  loginTime: string; // e.g. "Monday, 2 June 2025 at 10:34 AM"
}): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background-color:#0f0f1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f1a;padding:48px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,rgba(16,185,129,0.12),rgba(5,150,105,0.08));border:1px solid rgba(16,185,129,0.3);border-radius:20px;overflow:hidden;">
        <tr>
          <td style="padding:36px 40px 28px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
            <div style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:16px;padding:12px 24px;margin-bottom:16px;">
              <span style="color:#ffffff;font-size:22px;font-weight:700;">🥗 MyCalo AI</span>
            </div>
            <p style="margin:0;color:rgba(255,255,255,0.5);font-size:13px;letter-spacing:0.5px;">SECURITY NOTIFICATION</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <h2 style="margin:0 0 12px;color:#ffffff;font-size:24px;font-weight:600;">New Login Detected ✅</h2>
            <p style="margin:0 0 28px;color:rgba(255,255,255,0.6);font-size:15px;line-height:1.7;">
              Hi ${name}, we noticed a successful login to your MyCalo AI account.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.25);border-radius:12px;margin-bottom:28px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 8px;color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Login time</p>
                  <p style="margin:0;color:#ffffff;font-size:16px;font-weight:600;">${loginTime}</p>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);border-radius:10px;margin-bottom:24px;">
              <tr>
                <td style="padding:14px 18px;">
                  <p style="margin:0;color:rgba(252,165,165,0.9);font-size:13px;line-height:1.6;">
                    🚨 <strong>Not you?</strong> Change your password immediately and enable 2FA from your settings.
                  </p>
                </td>
              </tr>
            </table>
            <p style="margin:0;color:rgba(255,255,255,0.35);font-size:13px;line-height:1.6;">
              If this was you, no action needed. Stay healthy! 💪
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p style="margin:0;color:rgba(255,255,255,0.25);font-size:12px;">© ${new Date().getFullYear()} MyCalo AI. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
