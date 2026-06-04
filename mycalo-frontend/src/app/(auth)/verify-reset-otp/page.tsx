import VerifyOtpForm from "@/components/auth/VerifyOtpForm";
import { Suspense } from "react";

export default function VerifyResetOtpPage() {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="w-12 h-12 bg-blue-50 rounded-[18px] flex items-center justify-center mb-4 border border-blue-100 shadow-sm">
          <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-950 tracking-tight">Enter reset code</h1>
        <p className="text-sm text-slate-500 font-medium mt-2 max-w-[280px]">Check your email for the 6-digit reset code.</p>
      </div>

      <Suspense fallback={<div className="w-full h-[300px] bg-white rounded-[32px] animate-pulse" />}>
        <VerifyOtpForm />
      </Suspense>
    </div>
  );
}
