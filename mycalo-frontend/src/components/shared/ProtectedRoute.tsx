"use client";

import { ProtectedRouteProps } from "@/types/protectedRoute.types";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

export default function ProtectedRoute({ children, allowedRoles, requireOnboarding = true }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { accessToken, user } = useSelector((state: RootState) => state.auth);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (!accessToken || !user) {
      router.push(`/login?redirect=${pathname}`);
      return;
    }
    if (requireOnboarding && !user.onboardingCompleted) {
      router.push(user.role === "doctor" ? "/onboarding/doctor" : "/onboarding/user");
      return;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      if (user.role === "admin") router.push("/admin/dashboard");
      else if (user.role === "subadmin") router.push("/subadmin/dashboard");
      else if (user.role === "doctor") router.push(user.isVerified ? "/doctor/dashboard" : "/doctor/verification");
      else router.push("/home");
      return;
    }
    if (user.role === "doctor" && !user.isVerified && pathname !== "/doctor/verification") {
      router.push("/doctor/verification");
      return;
    }
  }, [accessToken, user, allowedRoles, requireOnboarding, router, pathname, isMounted]);

  if (!isMounted) return <div className="min-h-screen bg-[#f8fafc]" />;
  if (!accessToken || !user) return null;
  if (requireOnboarding && !user.onboardingCompleted) return null;
  if (allowedRoles && !allowedRoles.includes(user.role)) return null;
  if (user.role === "doctor" && !user.isVerified && pathname !== "/doctor/verification") return null;

  return <>{children}</>;
}
