import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import GuestRoute from "@/components/shared/GuestRoute"; 

export const metadata: Metadata = {
  title: "MyCalo AI | Your Health Companion",
  description: "Track calories, consult doctors, and stay healthy with AI.",
};

export default function LandingPage() {
  return (
    <GuestRoute>
      <div className="min-h-screen w-full bg-[#f8fafc] flex flex-col items-center justify-center p-4 selection:bg-slate-900 selection:text-white relative overflow-hidden">

        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-emerald-100 rounded-full mix-blend-multiply filter blur-[80px] opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-blue-100 rounded-full mix-blend-multiply filter blur-[80px] opacity-50"></div>

        <main className="w-full max-w-[480px] bg-white/80 backdrop-blur-2xl p-10 sm:p-12 rounded-[40px] shadow-[0_20px_60px_rgb(0,0,0,0.05)] border border-white/40 flex flex-col items-center text-center relative z-10">

          <div className="w-20 h-20 bg-slate-950 rounded-[24px] flex items-center justify-center mb-8 shadow-xl shadow-slate-900/20">
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
            </svg>
          </div>

          <div className="inline-block px-4 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold tracking-widest uppercase mb-6">
            The Future of Health
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight mb-4">
            Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-500">MyCalo AI</span>
          </h1>
          <p className="text-base font-medium text-slate-500 mb-10 leading-relaxed">
            Your personal health architect. Track your daily nutrition, consult verified doctors, and achieve your goals with advanced AI.
          </p>

          {/* Action Buttons */}
          <div className="w-full flex flex-col gap-4">
            <Link
              href="/register"
              className="w-full h-[60px] bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-[24px] transition-all shadow-[0_10px_20px_rgba(0,0,0,0.1)] active:scale-[0.98] flex items-center justify-center text-lg"
            >
              Get Started Free
            </Link>

            <Link
              href="/login"
              className="w-full h-[60px] bg-white hover:bg-slate-50 text-slate-900 font-bold rounded-[24px] transition-all border-2 border-slate-100 active:scale-[0.98] flex items-center justify-center text-lg"
            >
              Log In to Account
            </Link>
          </div>

        </main>

        <div className="absolute bottom-6 text-center z-10">
          <p className="text-xs font-semibold text-slate-400">© {new Date().getFullYear()} MyCalo AI Platform</p>
        </div>
      </div>
    </GuestRoute>
  );
}
