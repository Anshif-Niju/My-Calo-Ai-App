"use client";
import ProtectedRoute from "../../../components/shared/ProtectedRoute";

export default function DoctorOnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ProtectedRoute allowedRoles={["doctor"]}>{children}</ProtectedRoute>
    </>
  );
}
