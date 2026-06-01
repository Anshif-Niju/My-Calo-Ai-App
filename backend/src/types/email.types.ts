export interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
}

export interface EmailJobData {
  type: "verify_email" | "forgot_password" | "login_success";
  to: string;
  subject: string;
  otp?: string; // optional — login_success email has no OTP
}
