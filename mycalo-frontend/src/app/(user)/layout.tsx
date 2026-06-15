import Navbar from "@/components/shared/user/Navbar";
import ProtectedRoute from "../../components/shared/ProtectedRoute";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ProtectedRoute allowedRoles={["user"]}>
        {children}
        <Navbar />
      </ProtectedRoute>
    </>
  );
}
