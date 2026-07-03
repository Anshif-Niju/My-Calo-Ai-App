"use client";

import { useState, useEffect } from "react";
import LoginForm from "./LoginForm"; // Ensure path matches your setup
import RegisterForm from "./RegisterForm"; // Ensure path matches your setup

interface AuthContainerProps {
  initialMode: "login" | "register";
}

export default function AuthContainer({ initialMode }: AuthContainerProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">(initialMode);

  useEffect(() => {
    setActiveTab(initialMode);
  }, [initialMode]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === "/register") {
        setActiveTab("register");
      } else if (path === "/login") {
        setActiveTab("login");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Safe navigation function that runs slide animation and pushes state without layout unmount
  const navigateTo = (mode: "login" | "register") => {
    setActiveTab(mode);
    window.history.pushState(null, "", `/${mode}`);
  };

  return (
    <div className="w-full flex justify-center items-center py-4">
      <div className="hidden md:flex w-full max-w-[1000px] h-[660px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.06)] border border-slate-100 relative overflow-hidden flex-row transition-all duration-300">

        {/* Animated Sliding Overlay */}
        <div
          className={`absolute top-0 bottom-0 w-1/2 bg-slate-950 text-white z-20 flex flex-col justify-between p-12 transition-all duration-700 ease-in-out ${activeTab === "login" ? "left-0 transform translate-x-0" : "left-0 transform translate-x-full"}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <span className="font-sans font-bold tracking-tight text-lg">MyCalo AI</span>
          </div>
          <div className="relative py-4 flex flex-col items-center justify-center">
            <div className="absolute w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl -z-10" />
            <div className="w-72 bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-[0_15px_30px_rgba(0,0,0,0.3)] space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Calories Tracker</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">Today</span>
              </div>
              <div className="flex flex-col items-center py-2 relative">
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle cx="56" cy="56" r="48" className="stroke-slate-800" strokeWidth="6" fill="transparent" />
                  <circle cx="56" cy="56" r="48" className="stroke-emerald-400 transition-all duration-1000" strokeWidth="8" fill="transparent" strokeDasharray={301.6} strokeDashoffset={301.6 * (1 - 1450 / 2200)} strokeLinecap="round" />
                </svg>
                <div className="absolute flex flex-col items-center justify-center inset-0">
                  <span className="text-lg font-bold text-white font-mono">1,450</span>
                  <span className="text-[10px] text-slate-400 font-medium">/ 2,200 kcal</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-slate-400">
                <div className="p-1.5 bg-slate-800/40 rounded-lg">
                  <p className="text-emerald-400">180g</p>
                  <p className="text-[8px] text-slate-500">Carbs</p>
                </div>
                <div className="p-1.5 bg-slate-800/40 rounded-lg">
                  <p className="text-sky-400">110g</p>
                  <p className="text-[8px] text-slate-500">Protein</p>
                </div>
                <div className="p-1.5 bg-slate-800/40 rounded-lg">
                  <p className="text-amber-400">45g</p>
                  <p className="text-[8px] text-slate-500">Fat</p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight leading-tight">Manage your health with clarity.</h2>
              <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-[340px]">Everything you need to track, analyze, and optimize your nutrition and health goals — in one place.</p>
            </div>
            <ul className="space-y-2 text-xs font-semibold text-slate-300">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 bg-white/10 text-white rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
                Real-time calorie & macro logging
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 bg-white/10 text-white rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
                AI-powered personalized advice
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 bg-white/10 text-white rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
                Smart analytics and weekly reports
              </li>
            </ul>
          </div>
        </div>

        {/* Login Form Wrapper */}
        <div
          className={`w-1/2 h-full flex flex-col justify-center px-12 md:px-14 absolute right-0 top-0 transition-all duration-700 ease-in-out ${activeTab === "login" ? "opacity-100 translate-x-0 pointer-events-auto z-10" : "opacity-0 translate-x-12 pointer-events-none z-0"}`}>
          <LoginForm onNavigate={navigateTo} />
        </div>

        {/* Register Form Wrapper */}
        <div
          className={`w-1/2 h-full flex flex-col justify-center px-12 md:px-14 absolute left-0 top-0 transition-all duration-700 ease-in-out ${activeTab === "register" ? "opacity-100 translate-x-0 pointer-events-auto z-10" : "opacity-0 -translate-x-12 pointer-events-none z-0"}`}>
          <RegisterForm onNavigate={navigateTo} isActive={activeTab === "register"} />
        </div>
      </div>

      {/* Mobile view block */}
      <div className="md:hidden w-full max-w-[400px] flex flex-col items-center px-2">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-slate-950 rounded-[18px] flex items-center justify-center mb-4 shadow-lg shadow-slate-900/20">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 10c0-4.42-3.58-8-8-8s-8 3.58-8 8c0 4.42 3.58 8 8 8s8-3.58 8-8zM12 4c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6 2.69-6 6-6z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-950 tracking-tight">{activeTab === "login" ? "MyCalo AI" : "Join MyCalo AI"}</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">{activeTab === "login" ? "Welcome back, let's track!" : "Create your health companion"}</p>
        </div>
        <div className="w-full bg-white p-6 sm:p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative z-20">
          {activeTab === "login" ? <LoginForm onNavigate={navigateTo} /> : <RegisterForm onNavigate={navigateTo} isActive={activeTab === "register"} />}
        </div>
      </div>
    </div>
  );
}
