import React from "react";
import LoginForm from "@/components/auth/LoginForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | MyCalo AI",
  description: "Log in to your personalized health assistant.",
};

export default function LoginPage() {
  return (
    <div className="w-full flex flex-col items-center">
      {/* Branding Header matching your reference image's clean top area */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 bg-slate-950 rounded-[18px] flex items-center justify-center mb-4 shadow-lg shadow-slate-900/20">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 10c0-4.42-3.58-8-8-8s-8 3.58-8 8c0 4.42 3.58 8 8 8s8-3.58 8-8zM12 4c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6 2.69-6 6-6z"/>
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-950 tracking-tight">MyCalo AI</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Welcome back, let's track!</p>
      </div>

      <LoginForm />
    </div>
  );
}
