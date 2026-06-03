import React, { Suspense } from "react";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create New Password | MyCalo AI",
  description: "Set a new password for your account.",
};

export default function ResetPasswordPage() {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="w-12 h-12 bg-slate-950 rounded-[18px] flex items-center justify-center mb-4 shadow-lg shadow-slate-900/20">
          <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-950 tracking-tight">Secure Account</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Create your new password below</p>
      </div>

      {/* Suspense is required by Next.js when using useSearchParams() inside the component */}
      <Suspense fallback={<div className="w-full h-[300px] bg-white rounded-[32px] animate-pulse" />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
