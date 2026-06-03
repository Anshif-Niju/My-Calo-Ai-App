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
    // 1. Check if logged in
    if (!accessToken || !user) {
      router.push(`/login?redirect=${pathname}`);
      return;
    }

    // 2. Check RBAC (Role-Based Access Control)
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect to their respective home if they try to access an unauthorized route
      if (user.role === "admin") router.push("/admin/dashboard");
      else if (user.role === "doctor") router.push("/doctor/dashboard");
      else router.push("/home");
      return;
    }

    // 3. Check Onboarding Status
    if (requireOnboarding && !user.onboardingCompleted) {
      router.push("/onboarding/role-select");
      return;
    }
  }, [accessToken, user, allowedRoles, requireOnboarding, router, pathname]);

  // Render nothing while redirecting to prevent UI flickering
  if (!accessToken || !user) return null;
  if (allowedRoles && !allowedRoles.includes(user.role)) return null;
  if (requireOnboarding && !user.onboardingCompleted) return null;

  return <>{children}</>;
}
