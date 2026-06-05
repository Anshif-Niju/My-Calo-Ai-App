import { Suspense } from "react";
import { Metadata } from "next";
import TwoFactorForm from "@/components/auth/TwoFactorForm";

export const metadata: Metadata = {
  title: "Two-Factor Auth | MyCalo AI",
  description: "Verify your identity with two-factor authentication.",
};

export default function TwoFactorPage() {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="w-12 h-12 bg-slate-950 rounded-[18px] flex items-center justify-center mb-4 shadow-lg shadow-slate-900/20">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-950 tracking-tight">Two-Factor Auth</h1>
        <p className="text-sm text-slate-500 font-medium mt-2 max-w-[280px]">
          Enter the 6-digit code from your authenticator app.
        </p>
      </div>

      <Suspense fallback={<div className="w-full h-[300px] bg-white rounded-[32px] animate-pulse" />}>
        <TwoFactorForm />
      </Suspense>
    </div>
  );
}
