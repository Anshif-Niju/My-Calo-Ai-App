import GuestRoute from "@/components/shared/GuestRoute";
import React from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[#f8fafc] text-slate-900 flex flex-col items-center justify-start sm:justify-center py-12 px-4 relative overflow-x-hidden">
      <main className="w-full max-w-[400px] flex-shrink-0 z-10 mb-8 mt-4 sm:mt-0">
        <GuestRoute>{children}</GuestRoute>
      </main>
      <div className="fixed bottom-4 left-4 z-50">
        <img src="https://res.cloudinary.com/dagoi6mwq/image/upload/q_auto/f_auto/v1780740552/MyCalo_Ai_Logo_inmwn1.jpg" alt="MyCalo AI" className="w-10 h-10 rounded-xl" />
      </div>

      <div className="text-center pb-6 flex-shrink-0">
        <p className="text-xs font-semibold text-slate-400">MyCalo AI • Secure Platform</p>
      </div>
    </div>
  );
}
