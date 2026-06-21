"use client";

import { api } from "@/lib/axios";
import { logoutAction } from "@/store/slices/auth.slice";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";

export default function SettingsPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");

      dispatch(logoutAction());

      router.replace("/login");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[32px] p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
        <div className="w-16 h-16 bg-slate-50 text-slate-700 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-sm border border-slate-100">⚙️</div>

        <h1 className="text-2xl font-black text-slate-900 mb-1">System Settings</h1>

        <p className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-6">
          Profile and preferences
        </p>

        <div className="border-t border-slate-50 pt-6 mb-8 text-left space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-slate-50">
            <span className="text-sm font-semibold text-slate-500">Platform Version</span>
            <span className="text-sm font-bold text-slate-900">v1.2.0</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-50">
            <span className="text-sm font-semibold text-slate-500">Database Connection</span>
            <span className="text-sm font-bold text-emerald-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm font-semibold text-slate-500">Administrator Role</span>
            <span className="text-sm font-bold text-slate-900 capitalize">Super Admin</span>
          </div>
        </div>

        {/* Temporary Logout Button */}
        <button onClick={handleLogout} className="w-full h-14 bg-red-50 border border-red-100 hover:bg-red-100 text-red-600 font-bold rounded-2xl transition-all active:scale-[0.98]">
          Logout from Platform
        </button>
      </div>
    </div>
  );
}
