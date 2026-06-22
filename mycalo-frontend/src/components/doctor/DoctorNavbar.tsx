"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { api } from "@/lib/axios";
import { logoutAction } from "@/store/slices/auth.slice";

const NAV_ITEMS = [
  {
    href: "/doctor/dashboard",
    label: "Dashboard",
    icon: (active: boolean) => (
      <svg className="w-5 h-5" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    href: "/doctor/profile",
    label: "Profile",
    icon: (active: boolean) => (
      <svg className="w-5 h-5" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
];

export default function DoctorNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout API failed", error);
    } finally {
      dispatch(logoutAction());
      setLoading(false);
      setShowLogoutConfirm(false);
      router.replace("/login");
    }
  };

  return (
    <>
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[28px] shadow-2xl p-8 w-full max-w-sm border border-slate-100 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-2xl mx-auto mb-4">🚪</div>
            <h2 className="text-xl font-black text-slate-900 mb-1">Sign Out</h2>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to log out of your session?</p>
            <div className="flex gap-3">
              <button
                disabled={loading}
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 rounded-[14px] border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={loading}
                onClick={handleLogout}
                className="flex-1 py-3 rounded-[14px] bg-red-600 text-white font-bold text-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop navbar */}
      <nav
        className="hidden lg:flex fixed top-0 left-0 right-0 z-45 h-16 items-center px-8 justify-between border-b"
        style={{ background: "#ffffff", borderColor: "#e2e8f0" }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🩺</span>
          <span className="font-black text-xl leading-none text-slate-900">
            MyCalo AI Doctor Portal
          </span>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-[18px] border border-slate-100 shadow-inner">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-5 py-2.5 rounded-[14px] text-[13px] font-bold transition-all duration-300"
                style={{
                  background: active ? "#0f172a" : "transparent",
                  color: active ? "#ffffff" : "#64748b",
                }}
              >
                {item.icon(active)}
                {item.label}
              </Link>
            );
          })}
        </div>

        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="px-4 py-2 text-xs font-bold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-[12px] transition-colors"
        >
          Sign Out
        </button>
      </nav>

      {/* Mobile bottom navbar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-45 border-t backdrop-blur-sm"
        style={{ background: "rgba(255, 255, 255, 0.9)", borderColor: "#e2e8f0" }}
      >
        <div className="flex items-center justify-around h-16 px-3">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all"
                style={{ color: active ? "#0f172a" : "#94a3b8" }}
              >
                {item.icon(active)}
                <span className={`text-[10px] font-bold ${active ? "font-black" : ""}`}>{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all text-red-500"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            <span className="text-[10px] font-bold">Sign Out</span>
          </button>
        </div>
      </nav>
    </>
  );
}
