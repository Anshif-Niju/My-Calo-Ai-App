import ProtectedRoute from "@/components/guard/ProtectedRoute";
import AdminNavbar from "@/components/shared/admin/AdminNavbar";

export default function SubadminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ProtectedRoute allowedRoles={["admin"]}>
        <div className="min-h-screen bg-slate-50 pt-5">
          <AdminNavbar />
          <main className="">{children}</main>
        </div>
      </ProtectedRoute>{" "}
    </>
  );
}
