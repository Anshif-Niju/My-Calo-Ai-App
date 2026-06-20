import ProtectedRoute from "../../components/guard/ProtectedRoute";

export default function SubadminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ProtectedRoute allowedRoles={["subadmin"]}>{children}</ProtectedRoute>
    </>
  );
}
