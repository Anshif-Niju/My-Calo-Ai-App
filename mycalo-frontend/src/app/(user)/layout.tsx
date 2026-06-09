import BottomNavbar from "@/components/shared/BottomNavbar";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <BottomNavbar />
    </>
  );
}
