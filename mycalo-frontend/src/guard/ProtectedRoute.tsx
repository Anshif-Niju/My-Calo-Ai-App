"use client";

import { RootState } from "@/store";
import { getRedirectPath } from "@/utils/getRedirectPath";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSelector } from "react-redux";

export default function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isInitialized } = useSelector((state: RootState) => state.auth);

  function computeRedirect(): string | null {

    if (!isInitialized) return null;


    if (!user) return `/login?redirect=${encodeURIComponent(pathname)}`;


    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return getRedirectPath(user);
    }

    const correctPath = getRedirectPath(user);
    const current = pathname.replace(/\/$/, "");
    const correct = correctPath.replace(/\/$/, "");

    if (isOnAllowedPath(current, correct)) return null;
    return correct;
  }


  function isOnAllowedPath(current: string, correct: string): boolean {

    if (current === correct) return true;

 
    if (correct === "/onboarding/user/profile" && current === "/onboarding/user/goal") return true;


    if (correct === "/home") {
      return (
        current.startsWith("/home") ||
        current.startsWith("/ai") ||
        current.startsWith("/doctors") ||
        current.startsWith("/settings")
      );
    }


    if (correct === "/doctor/dashboard") return current.startsWith("/doctor");

    if (correct.startsWith("/admin")) return current.startsWith("/admin");
    if (correct.startsWith("/subadmin")) return current.startsWith("/subadmin");

    return false;
  }

  const redirectTo = computeRedirect();


  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  if (!isInitialized || redirectTo) {
    return (
      <div className="min-h-screen w-full bg-[#f8fafc] flex items-center justify-center">
        <p className="text-xs font-semibold text-slate-400">MyCalo AI</p>
      </div>
    );
  }

  return <>{children}</>;
}
