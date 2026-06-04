import { Metadata } from "next";
import NewPasswordForm from "@/components/auth/NewPasswordForm";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "New Password | MyCalo AI",
  description: "Set a new password for your MyCalo AI account.",
};

export default function NewPasswordPage() {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="w-12 h-12 bg-emerald-50 rounded-[18px] flex items-center justify-center mb-4 border border-emerald-100 shadow-sm">
          <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-950 tracking-tight">Set new password</h1>
        <p className="text-sm text-slate-500 font-medium mt-2 max-w-[280px]">
          Choose a strong password to keep your account secure.
        </p>
      </div>

      <Suspense fallback={<div className="w-full h-[320px] bg-white rounded-[32px] animate-pulse" />}>
        <NewPasswordForm />
      </Suspense>
    </div>
  );
}
