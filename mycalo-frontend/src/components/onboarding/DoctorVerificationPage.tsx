"use client";

import { api } from "@/lib/axios";
import { RootState } from "@/store";
import { logoutAction, updateUser } from "@/store/slices/auth.slice";
import { getRedirectPath } from "@/utils/getRedirectPath";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

export default function DoctorVerificationPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const { user } = useSelector((state: RootState) => state.auth);

  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!user) return;

    const correctPath = getRedirectPath(user);
    console.log("Redux User:", user);
    console.log("Redirect:", getRedirectPath(user));
    if (correctPath !== "/onboarding/doctor/verification") {
      router.replace(correctPath);
    }
  }, [user, router]);

  // Auto check every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await api.get("/auth/me");

        const updatedUser = res.data.user;

        // Keep Redux in sync
        dispatch(updateUser(updatedUser));

        // Redirect only when approved
        if (updatedUser.verificationStatus === "approved") {
          router.replace("/doctor/dashboard");
        }
      } catch (error) {
        console.error("Verification polling failed:", error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [dispatch, router]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");

      dispatch(logoutAction());

      router.replace("/login");
    } catch (error) {
      console.error(error);
    }
  };
  const handleCheckStatus = async () => {
    setChecking(true);

    try {
      const res = await api.get("/auth/me");

      const updatedUser = res.data.user;

      // Update Redux
      dispatch(updateUser(updatedUser));

      if (updatedUser.verificationStatus === "approved") {
        toast.success("Verification approved!");

        router.replace("/doctor/dashboard");
      } else {
        toast.info("Still under review. Check back soon.");
      }
    } catch (error) {
      console.error(error);

      toast.error("Failed to check verification status.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="w-24 h-24 rounded-[32px] bg-slate-950 flex items-center justify-center text-4xl mx-auto mb-6">🩺</div>

        {/* Text */}
        <h1 className="text-3xl font-black text-slate-950 mb-3">Application Under Review</h1>

        <p className="text-slate-500 text-sm leading-relaxed mb-2">
          Hi <strong className="text-slate-700">{user?.name}</strong>, your verification is being reviewed by our team.
        </p>

        <p className="text-slate-400 text-sm mb-8">
          This usually takes <strong className="text-slate-600">24–48 hours</strong>. We'll notify you once approved.
        </p>

        {/* Status Card */}
        <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.04)] p-6 mb-6 text-left space-y-3">
          {[
            {
              icon: "✅",
              label: "Application submitted",
              done: true,
            },
            {
              icon: "🔍",
              label: "Under admin review",
              done: true,
              active: true,
            },
            {
              icon: "⏳",
              label: "Approval pending",
              done: false,
            },
            {
              icon: "🎉",
              label: "Access granted",
              done: false,
            },
          ].map((step, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-2xl ${step.active ? "bg-slate-50" : ""}`}>
              <span className="text-lg">{step.icon}</span>

              <p className={`text-sm font-semibold ${step.done ? "text-slate-700" : "text-slate-300"}`}>{step.label}</p>

              {step.active && (
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />

                  <span className="text-xs font-bold text-amber-500">In Progress</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <button
          onClick={handleCheckStatus}
          disabled={checking}
          className="w-full h-14 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all shadow-md active:scale-[0.98] disabled:opacity-70 flex items-center justify-center mb-3">
          {checking ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Check Status"}
        </button>

        <button onClick={handleLogout} className="w-full h-12 text-slate-400 font-semibold text-sm hover:text-slate-600 transition-colors">
          Logout & Come Back Later
        </button>
      </div>
    </div>
  );
}
