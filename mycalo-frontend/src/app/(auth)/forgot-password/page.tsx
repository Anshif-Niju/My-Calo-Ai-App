import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password | MyCalo AI",
  description: "Reset your MyCalo AI password.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="w-12 h-12 bg-slate-950 rounded-[18px] flex items-center justify-center mb-4 shadow-lg shadow-slate-900/20">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-950 tracking-tight">Forgot Password?</h1>
        <p className="text-sm text-slate-500 font-medium mt-2 max-w-[260px]">
          Enter your registered email and we will send you a 6-digit reset code.
        </p>
      </div>

      <ForgotPasswordForm />
    </div>
  );
}
