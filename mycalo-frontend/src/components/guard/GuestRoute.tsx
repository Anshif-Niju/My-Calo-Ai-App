"use client";

import { RootState } from "@/store";
import { getRedirectPath } from "@/utils/getRedirectPath";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSelector } from "react-redux";

export default function GuestRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const { user, isInitialized } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!isInitialized) return;

    if (user) {
      // Use replace so the browser back button from the logged-in area
      // does NOT bring the user back to the login/register page.
      router.replace(getRedirectPath(user));
    }
  }, [user, isInitialized, router]);

  // While auth is still being determined, show a blank loading screen
  // (same style as ProtectedRoute so there is no visual flash).
  if (!isInitialized) {
    return (
      <div className="min-h-screen w-full bg-[#f8fafc] text-slate-900 flex flex-col items-center justify-start sm:justify-center py-12 px-4 relative overflow-x-hidden">
        <div className="bg-[#f8fafc] text-center pb-6 shrink-0">
          <p className="text-xs font-semibold text-slate-400">MyCalo AI • Secure Platform</p>
        </div>
      </div>
    );
  }

  // If the user IS logged in, render nothing while the redirect is in flight.
  // This prevents a flash of the login/register UI before the router.replace fires.
  if (user) {
    return (
      <div className="min-h-screen w-full bg-[#f8fafc] text-slate-900 flex flex-col items-center justify-start sm:justify-center py-12 px-4 relative overflow-x-hidden">
        <div className="bg-[#f8fafc] text-center pb-6 shrink-0">
          <p className="text-xs font-semibold text-slate-400">MyCalo AI • Secure Platform</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
