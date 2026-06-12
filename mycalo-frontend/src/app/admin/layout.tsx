import ProtectedRoute from "../../components/shared/ProtectedRoute";

export default function SubadminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ProtectedRoute allowedRoles={["admin"]}>{children}</ProtectedRoute>
    </>
  );
}
