import { Suspense } from "react";
import VerifyEmailForm from "@/components/auth/VerifyEmailForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Email | MyCalo AI",
  description: "Verify your email address to continue.",
};

export default function VerifyEmailPage() {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="w-12 h-12 bg-emerald-50 rounded-[18px] flex items-center justify-center mb-4 border border-emerald-100 shadow-sm">
          <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-950 tracking-tight">Check your email</h1>
        <p className="text-sm text-slate-500 font-medium mt-2 max-w-[280px]">
          We've sent a 6-digit verification code to your email address.
        </p>
      </div>

      <Suspense fallback={<div className="w-full h-[300px] bg-white rounded-[32px] animate-pulse" />}>
        <VerifyEmailForm />
      </Suspense>
    </div>
  );
}
