import ProtectedRoute from "../../components/shared/ProtectedRoute";

export default function DocotrLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ProtectedRoute allowedRoles={["doctor"]}>{children}</ProtectedRoute>
    </>
  );
}
