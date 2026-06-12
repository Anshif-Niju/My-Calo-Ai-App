import ProtectedRoute from "../../components/shared/ProtectedRoute";

export default function DocotrLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ProtectedRoute allowedRoles={["subadmin"]}>{children}</ProtectedRoute>
    </>
  );
}
