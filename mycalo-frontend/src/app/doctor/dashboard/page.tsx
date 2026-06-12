"use client";

import { logoutAction } from "@/store/slices/auth.slice";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";

export default function AdminDashboardPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logoutAction());

    // Optional: call backend logout API
    // await api.post("/auth/logout");

    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6">
      <h1 className="text-2xl font-bold">
        Doctor Dashboard
      </h1>

      <button
        onClick={handleLogout}
        className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-semibold transition-colors"
      >
        Logout
      </button>
    </div>
  );
}
