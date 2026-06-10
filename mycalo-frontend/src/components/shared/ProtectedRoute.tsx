"use client";

import { RootState } from "@/store";
import { getRedirectPath } from "@/utils/getRedirectPath";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { ProtectedRouteProps } from "../../types/protectedRoute.types";

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();

  const { accessToken, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Not authenticated

    if (!accessToken || !user) {
      router.replace(`/login?redirect=${pathname}`);
      return;
    }

    //Role check

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace(getRedirectPath(user));
      return;
    }

    // Correct page check

    const correctPath = getRedirectPath(user);

    if (pathname !== correctPath) {
      // Allow nested pages under dashboard/home

      const allowed = pathname.startsWith(correctPath);

      if (!allowed) {
        router.replace(correctPath);
      }
    }
  }, [accessToken, user, pathname, router, allowedRoles]);

  if (!accessToken || !user) {
    return null;
  }

  return <>{children}</>;
}
