"use client";

import { RootState } from "@/store";
import { getRedirectPath } from "@/utils/getRedirectPath";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSelector } from "react-redux";

/**
 * ProtectedRoute
 * --------------
 * Client-side guard for protected pages.
 * - Runs synchronously during render to avoid loading spinners/flashes.
 * - If the user is not logged in or is on the wrong step (e.g. went back in history),
 *   it client-side redirects them to the correct path.
 */
export default function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isInitialized } = useSelector((state: RootState) => state.auth);

  // Compute redirect target synchronously
  const getRedirectTarget = (): string | null => {
    if (!isInitialized) return null; // Wait until initialized to make decisions

    // 1. Not logged in -> redirect to login
    if (!user) {
      return `/login?redirect=${pathname}`;
    }

    // 2. Wrong role for this section -> redirect to their correct dashboard/onboarding
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return getRedirectPath(user);
    }

    const correctPath = getRedirectPath(user).replace(/\/$/, "");
    const currentPath = pathname.replace(/\/$/, "");

    // 3. User must be in onboarding but is somewhere else
    if (correctPath.includes("/onboarding") && !currentPath.includes("/onboarding")) {
      return correctPath;
    }

    // 4. User is on an onboarding page, but it's not their correct onboarding step
    if (currentPath.includes("/onboarding") && currentPath !== correctPath) {
      return correctPath;
    }

    // 5. User has finished onboarding but is trying to access onboarding page
    if (!correctPath.includes("/onboarding") && currentPath.includes("/onboarding")) {
      return correctPath;
    }

    return null;
  };

  const redirectTarget = getRedirectTarget();

  useEffect(() => {
    if (redirectTarget) {
      router.replace(redirectTarget);
    }
  }, [redirectTarget, router]);

  // If we are currently redirecting, we render a placeholder/loader to avoid flashing wrong content
  if (redirectTarget) {
    return (
      <div className="min-h-screen w-full bg-[#f8fafc] text-slate-900 flex flex-col items-center justify-center py-12 px-4">
        <p className="text-xs font-semibold text-slate-400">MyCalo AI • Secure Platform</p>
      </div>
    );
  }

  return <>{children}</>;
}
