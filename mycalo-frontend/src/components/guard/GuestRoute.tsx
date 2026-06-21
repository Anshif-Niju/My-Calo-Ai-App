"use client";

import { RootState } from "@/store";
import { getRedirectPath } from "@/utils/getRedirectPath";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSelector } from "react-redux";

/**
 * GuestRoute (thin version with client-side guard)
 * ------------------------------------------------
 * The Next.js middleware (middleware.ts) already redirects logged-in users
 * away from guest-only pages at the edge. This component handles client-side
 * history navigation (like browser back/forward buttons) to ensure logged-in
 * users are client-redirected without exposing guest page contents.
 */
export default function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isInitialized, user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && user) {
      router.replace(getRedirectPath(user));
    }
  }, [isInitialized, user, router]);

  if (!isInitialized || user) {
    return (
      <div className="min-h-screen w-full bg-[#f8fafc] text-slate-900 flex flex-col items-center justify-center py-12 px-4">
        <p className="text-xs font-semibold text-slate-400">MyCalo AI • Secure Platform</p>
      </div>
    );
  }

  return <>{children}</>;
}
