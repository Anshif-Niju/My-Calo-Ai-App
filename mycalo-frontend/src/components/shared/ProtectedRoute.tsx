"use client";

import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<"user" | "doctor" | "subadmin" | "admin">;
  requireOnboarding?: boolean;
}

export default function ProtectedRoute({ children, allowedRoles, requireOnboarding = true }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { accessToken, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // 1. Not logged in
    if (!accessToken || !user) {
      router.push(`/login?redirect=${pathname}`);
      return;
    }

    // 2. Onboarding not done → role-specific onboarding
    if (requireOnboarding && !user.onboardingCompleted) {
      router.push(user.role === "doctor" ? "/onboarding/doctor" : "/onboarding/user");
      return;
    }

    // 3. RBAC check
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      if (user.role === "admin") router.push("/admin/dashboard");
      else if (user.role === "doctor") router.push(user.isVerified ? "/doctor/dashboard" : "/doctor/verification");
      else router.push("/home");
      return;
    }

    // 4. Doctor not verified — block access to protected doctor routes
    if (user.role === "doctor" && !user.isVerified && pathname !== "/doctor/verification") {
      router.push("/doctor/verification");
      return;
    }
  }, [accessToken, user, allowedRoles, requireOnboarding, router, pathname]);

  // Render nothing while redirecting
  if (!accessToken || !user) return null;
  if (requireOnboarding && !user.onboardingCompleted) return null;
  if (allowedRoles && !allowedRoles.includes(user.role)) return null;
  if (user.role === "doctor" && !user.isVerified && pathname !== "/doctor/verification") return null;

  return <>{children}</>;
}
