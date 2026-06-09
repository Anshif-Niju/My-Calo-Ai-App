import BottomNavbar from "@/components/shared/user/BottomNavbar";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <BottomNavbar />
    </>
  );
}
