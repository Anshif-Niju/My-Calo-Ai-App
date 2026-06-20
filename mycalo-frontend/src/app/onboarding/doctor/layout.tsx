"use client";
import ProtectedRoute from "../../../components/guard/ProtectedRoute";

export default function DoctorOnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ProtectedRoute allowedRoles={["doctor"]}>{children}</ProtectedRoute>
    </>
  );
}
