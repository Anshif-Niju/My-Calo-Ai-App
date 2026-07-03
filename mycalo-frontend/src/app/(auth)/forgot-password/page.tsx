import { Metadata } from "next";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Forgot Password | MyCalo AI",
  description: "Reset your MyCalo AI account password.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="w-12 h-12 bg-amber-50 rounded-[18px] flex items-center justify-center mb-4 border border-amber-100 shadow-sm">
          <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-950 tracking-tight">Forgot password?</h1>
        <p className="text-sm text-slate-500 font-medium mt-2 max-w-[280px]">
         Enter your email and we'll send you a reset code.
        </p>
      </div>

      <Suspense fallback={<div className="w-full h-[260px] bg-white rounded-[32px] animate-pulse" />}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
