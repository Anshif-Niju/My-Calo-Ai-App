"use client";
import ProtectedRoute from "../../../components/shared/ProtectedRoute";

import { useEffect } from "react";

export default function UserOnboardingLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <>
      <ProtectedRoute allowedRoles={["user"]}>{children}</ProtectedRoute>
    </>
  );
}
