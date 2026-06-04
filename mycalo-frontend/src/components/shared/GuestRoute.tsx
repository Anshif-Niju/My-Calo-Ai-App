"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

export default function GuestRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (user) {
      const { role, isVerified, onboardingCompleted } = user;

      if (!onboardingCompleted) {
        router.push(role === "doctor" ? "/onboarding/doctor" : "/onboarding/user");
        return;
      }

      if (role === "admin") {
        router.push("/admin/dashboard");
      } else if (role === "doctor") {
        router.push(isVerified ? "/doctor/dashboard" : "/doctor/verification");
      } else {
        router.push("/home");
      }
    } else {
      setIsChecking(false);
    }
  }, [user, router]);

  if (isChecking || user) {
    return <div className="min-h-screen bg-[#f8fafc]" />;
  }

  return <>{children}</>;
}
