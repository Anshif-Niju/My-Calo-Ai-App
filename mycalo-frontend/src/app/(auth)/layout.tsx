import React from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[#f8fafc] flex flex-col items-center justify-center p-4 selection:bg-slate-900 selection:text-white">
      {/*
        This main container mimics the mobile screen boundary on desktops
        and takes full width on mobile devices.
      */}
      <main className="w-full max-w-[400px] flex flex-col justify-center relative z-10">
        {children}
      </main>

      <div className="absolute bottom-6 text-center">
        <p className="text-xs font-semibold text-slate-400">MyCalo AI • Secure Login</p>
      </div>
    </div>
  );
}
