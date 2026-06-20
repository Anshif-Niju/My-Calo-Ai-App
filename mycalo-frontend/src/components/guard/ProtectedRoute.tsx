"use client";

import { RootState } from "@/store";
import { getRedirectPath } from "@/utils/getRedirectPath";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { ProtectedRouteProps } from "../../types/protectedRoute.types";

/**
 * How this guard works
 * --------------------
 * Authorization is computed SYNCHRONOUSLY during render (not in a useEffect).
 * This means:
 *   - No useState for isAuthorized  → no race condition between two effects
 *   - No flicker where isAuthorized briefly resets to false
 *   - Forward / back / refresh all behave correctly
 *
 * The only useEffect is the redirect side-effect (calling router.replace),
 * which must be in an effect because it is a side-effect outside React's
 * render cycle.
 */
export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isInitialized } = useSelector((state: RootState) => state.auth);

  // ── Compute redirect target synchronously ──────────────────────────────
  // Returns the URL to redirect to, or null if the user is allowed here.
  const getRedirectTarget = (): string | null => {
    if (!isInitialized) return null; // still loading — don't redirect yet

    // 1. Not logged in
    if (!user) return `/login?redirect=${pathname}`;

    // 2. Wrong role for this section
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return getRedirectPath(user);
    }

    const correctPath = getRedirectPath(user).replace(/\/$/, "");
    const currentPath = pathname.replace(/\/$/, "");

    // 3. User must be in onboarding but is somewhere else
    if (correctPath.includes("/onboarding") && !currentPath.includes("/onboarding")) {
      return correctPath;
    }

    // 4. User is on ANY onboarding URL but it is not their required step
    //    (covers: going back to completed steps, or forward to a future step)
    if (currentPath.includes("/onboarding") && currentPath !== correctPath) {
      return correctPath;
    }

    // 5. Authorized — no redirect needed
    return null;
  };

  const redirectTarget = getRedirectTarget();

  // Derived booleans — computed synchronously, no extra state
  const isLoading = !isInitialized;
  const needsRedirect = isInitialized && redirectTarget !== null;
  const isAuthorized = isInitialized && redirectTarget === null;

  // ── Side-effect: perform the redirect ─────────────────────────────────
  useEffect(() => {
    if (needsRedirect && redirectTarget) {
      router.replace(redirectTarget);
    }
  }, [needsRedirect, redirectTarget, router]);

  // ── Render ─────────────────────────────────────────────────────────────
  if (isLoading || needsRedirect) {
    return (
      <div className="min-h-screen w-full bg-[#f8fafc] text-slate-900 flex flex-col items-center justify-start sm:justify-center py-12 px-4 relative overflow-x-hidden">
        <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mb-4" />
        <div className="bg-[#f8fafc] text-center pb-6 shrink-0">
          <p className="text-xs font-semibold text-slate-400">MyCalo AI • Secure Platform</p>
        </div>
      </div>
    );
  }

  if (isAuthorized) {
    return <>{children}</>;
  }

  // Fallback (should never reach here)
  return null;
}
