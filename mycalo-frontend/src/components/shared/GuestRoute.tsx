"use client";

import { RootState } from "@/store";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

export default function GuestRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const [isChecking, setIsChecking] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
 
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (user) {
      const { role, isVerified, onboardingCompleted } = user;

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

      if (role === "doctor") router.push("/doctor/dashboard");
      else router.push("/home");
    } else {
      setIsChecking(false);
    }
  }, [user, router, isMounted]);

  if (!isMounted || isChecking || user) {
    return <div className="min-h-screen bg-[#f8fafc]" />;
  }

  return <>{children}</>;
}
