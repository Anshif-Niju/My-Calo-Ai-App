import ProtectedRoute from "../../components/guard/ProtectedRoute";
import SubadminNavbar from "../../components/subadmin/SubadminNavbar";

export default function SubadminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ProtectedRoute allowedRoles={["subadmin"]}>
        <div className="min-h-screen bg-[#f8fafc] pt-20 pb-24 lg:pt-24 lg:pb-12">
          <SubadminNavbar />
          <main>{children}</main>
        </div>
      </ProtectedRoute>
    </>
  );
}
