import Navbar from "@/components/shared/user/UserNavbar";
import ProtectedRoute from "../../components/guard/ProtectedRoute";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ProtectedRoute allowedRoles={["user"]}>
        <Navbar />
    <div className='lg:pb-10 bg-slate-50 lg:pt-20'>
        {children}
      </div>
      </ProtectedRoute>
    </>
  );
}
