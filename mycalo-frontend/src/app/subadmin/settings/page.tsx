"use client";

import { api } from "@/lib/axios";
import { logoutAction } from "@/store/slices/auth.slice";
import { RootState } from "@/store";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function SubadminSettingsPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await api.post("/auth/logout");
    } catch {
      // Even if the API call fails, clear local state and redirect
    } finally {
      dispatch(logoutAction());
      router.replace("/login");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-12 font-sans">

      {/* ─── Logout Confirm Modal ─── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[28px] shadow-2xl p-8 w-full max-w-sm border border-slate-100 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-3xl mx-auto mb-4">
              🚪
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2">Sign Out?</h2>
            <p className="text-sm text-slate-500 mb-7">
              You will be logged out of the sub-admin panel and redirected to the login page.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-[14px] border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={loggingOut}
                onClick={handleLogout}
                className="flex-1 py-3 rounded-[14px] bg-red-600 text-white font-bold text-sm hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {loggingOut ? "Signing out..." : "Yes, Sign Out"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Page Header ─── */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Settings</h1>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">
          Sub-Admin Account
        </p>
      </div>

      {/* ─── Profile Card ─── */}
      <div className="bg-white rounded-[28px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-8 mb-5">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-slate-800 to-slate-600 text-white flex items-center justify-center font-black text-2xl shadow-lg flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase() ?? "S"}
          </div>
          <div>
            <p className="text-xl font-black text-slate-900 leading-tight">{user?.name ?? "Sub Admin"}</p>
            <p className="text-sm font-medium text-slate-500 mt-0.5">{user?.email ?? ""}</p>
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-black text-indigo-600 uppercase tracking-wider">
              Sub Admin
            </span>
          </div>
        </div>
      </div>

      {/* ─── Info Rows ─── */}
      <div className="bg-white rounded-[28px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] divide-y divide-slate-50 mb-5 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-lg">🛡️</span>
            <div>
              <p className="text-[13px] font-bold text-slate-800">Role</p>
              <p className="text-[11px] font-medium text-slate-400">Access level</p>
            </div>
          </div>
          <span className="text-[13px] font-black text-slate-700">Sub Admin</span>
        </div>

        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-lg">🌐</span>
            <div>
              <p className="text-[13px] font-bold text-slate-800">Platform</p>
              <p className="text-[11px] font-medium text-slate-400">Version</p>
            </div>
          </div>
          <span className="text-[13px] font-black text-slate-700">v1.0.0</span>
        </div>

        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-lg">📡</span>
            <div>
              <p className="text-[13px] font-bold text-slate-800">Server</p>
              <p className="text-[11px] font-medium text-slate-400">Connection status</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-[13px] font-black text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        </div>
      </div>

      {/* ─── Logout Button ─── */}
      <div className="bg-white rounded-[28px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
        <button
          onClick={() => setShowConfirm(true)}
          className="w-full flex items-center justify-between px-6 py-5 hover:bg-red-50/60 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[14px] bg-red-50 border border-red-100 flex items-center justify-center text-lg">
              🚪
            </div>
            <div className="text-left">
              <p className="text-[14px] font-black text-red-600">Sign Out</p>
              <p className="text-[11px] font-medium text-slate-400">Log out from sub-admin panel</p>
            </div>
          </div>
          <svg
            className="w-5 h-5 text-red-300 group-hover:text-red-500 transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
