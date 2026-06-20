import Navbar from "@/components/shared/user/UserNavbar";
import ProtectedRoute from "../../components/guard/ProtectedRoute";

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
