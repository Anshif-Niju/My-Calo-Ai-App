import ProtectedRoute from "@/guard/ProtectedRoute";
import AdminNavbar from "@/components/layouts/AdminNavbar";

export default function SubadminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ProtectedRoute allowedRoles={["admin"]}>
        <div className="min-h-screen bg-[#f8fafc] pt-20 pb-24 lg:pt-24 lg:pb-12">
          <AdminNavbar />
          <main className="">{children}</main>
        </div>
      </ProtectedRoute>
    </>
  );
}
