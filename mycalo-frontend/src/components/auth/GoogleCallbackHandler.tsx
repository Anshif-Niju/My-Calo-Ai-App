"use client";

import { api } from "@/lib/axios";
import { setCredentials } from "@/store/slices/auth.slice";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

export default function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      router.push("/login?error=auth_failed");
      return;
    }

    // Fetch user info using the token
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        dispatch(setCredentials({ accessToken: token, user: res.data.user }));

        const { role, onboardingCompleted, isVerified } = res.data.user;

        if (role === "admin") {
          router.push("/admin/dashboard");
          return;
        }
        if (role === "subadmin") {
          router.push("/subadmin/dashboard");
          return;
        }

        if (!onboardingCompleted) {
          router.push(role === "doctor" ? "/onboarding/doctor" : "/onboarding/user");
          return;
        }

        if (!isVerified) {
          router.push(role === "doctor" ? "/onboarding/doctor/profile" : "/onboarding/user/profile");
          return;
        }

        if (role === "doctor") {
          router.push("/doctor/dashboard");
          return;
        }
        router.push("/home");
      } catch {
        router.push("/login?error=auth_failed");
      }
    };

    fetchUser();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-950 rounded-full animate-spin" />
    </div>
  );
}
