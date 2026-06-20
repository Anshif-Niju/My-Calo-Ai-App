"use client";

import ProtectedRoute from "@/components/guard/ProtectedRoute";

export default function UserOnboardingLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedRoles={["user"]}>{children}</ProtectedRoute>;
}
