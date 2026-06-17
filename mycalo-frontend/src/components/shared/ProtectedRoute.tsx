"use client";

import { RootState } from "@/store";
import { getRedirectPath } from "@/utils/getRedirectPath";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { ProtectedRouteProps } from "../../types/protectedRoute.types";

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isInitialized } = useSelector((state: RootState) => state.auth);

  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!isInitialized) return;

    if (!user) {
      router.replace(`/login?redirect=${pathname}`);
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace(getRedirectPath(user));
      return;
    }

    const correctPath = getRedirectPath(user);

    if (correctPath.includes("/onboarding") && !pathname.includes("/onboarding")) {
      router.replace(correctPath);
      return;
    }

    if (!correctPath.includes("/onboarding") && pathname.includes("/onboarding")) {
      router.replace(correctPath);
      return;
    }

    setIsAuthorized(true);
  }, [isInitialized, user, pathname, router, allowedRoles]);

  if (!isInitialized || !isAuthorized) {
    return (
      <div className="min-h-screen w-full bg-[#f8fafc] text-slate-900 flex flex-col items-center justify-start sm:justify-center py-12 px-4 relative overflow-x-hidden">
        <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mb-4" />
        <div className="bg-[#f8fafc] text-center pb-6 shrink-0">
          <p className="text-xs font-semibold text-slate-400">MyCalo AI • Secure Platform</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
