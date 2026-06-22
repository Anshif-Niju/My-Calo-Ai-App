import ProtectedRoute from "../../components/guard/ProtectedRoute";
import DoctorNavbar from "../../components/doctor/DoctorNavbar";

export default function DocotrLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ProtectedRoute allowedRoles={["doctor"]}>
        <div className="min-h-screen bg-[#f8fafc] pt-20 pb-24 lg:pt-24 lg:pb-12">
          <DoctorNavbar />
          <main>{children}</main>
        </div>
      </ProtectedRoute>
    </>
  );
}
