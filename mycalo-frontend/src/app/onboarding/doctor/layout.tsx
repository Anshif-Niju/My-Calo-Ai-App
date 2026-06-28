"use client";
import ProtectedRoute from "../../../guard/ProtectedRoute";

export default function DoctorOnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ProtectedRoute allowedRoles={["doctor"]}>{children}</ProtectedRoute>
    </>
  );
}
