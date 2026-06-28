"use client";

import ProtectedRoute from "@/guard/ProtectedRoute";

export default function UserOnboardingLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={["user"]}>{children}</ProtectedRoute>;
}
