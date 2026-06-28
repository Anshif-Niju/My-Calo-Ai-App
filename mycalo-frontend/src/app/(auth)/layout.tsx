"use client";

import GuestRoute from "@/guard/GuestRoute";
import React from "react";
import { usePathname } from "next/navigation";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWidePage = pathname === "/login" || pathname === "/register";

  return (
    <GuestRoute>
      <div className="min-h-screen w-full bg-[#f8fafc] text-slate-900 flex flex-col items-center justify-center py-6 md:py-12 px-4 relative overflow-x-hidden">
        <main
          className={`w-full flex-shrink-0 z-10 mb-8 mt-4 sm:mt-0 transition-all duration-300 ${
            isWidePage ? "max-w-[1000px]" : "max-w-[400px]"
          }`}
        >
          {children}
        </main>

        <div className="text-center pb-6 shrink-0 z-10">
          <p className="text-xs font-semibold text-slate-400">MyCalo AI • Secure Platform</p>
        </div>
      </div>
    </GuestRoute>
  );
}


