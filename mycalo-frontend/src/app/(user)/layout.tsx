import Navbar from "@/components/layouts/UserNavbar";
import ProtectedRoute from "@/guard/ProtectedRoute";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ProtectedRoute allowedRoles={["user"]}>
        <Navbar />
        <div className='min-h-screen bg-slate-50 pt-6 pb-24 lg:pt-24 lg:pb-12'>
          {children}
        </div>
      </ProtectedRoute>
    </>
  );
}
