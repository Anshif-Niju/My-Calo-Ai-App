"use client";

import { logoutAction } from "@/store/slices/auth.slice";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";

export default function SettingsPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logoutAction());
    router.replace("/login");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center pb-20 lg:pt-16"
      style={{ background: "var(--bg)" }}
    >
      <div className="text-center">
        <div className="text-5xl mb-4">⚙️</div>

        <h1 className="text-2xl font-black text-white mb-2">
          Settings
        </h1>

        <p
          style={{ color: "var(--text2)" }}
          className="text-sm mb-8"
        >
          Profile and preferences
        </p>

        {/* Temporary Logout Button */}
        <button
          onClick={handleLogout}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-2xl transition-all active:scale-[0.98]"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
