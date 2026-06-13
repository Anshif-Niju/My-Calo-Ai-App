"use client";

import { RootState } from "@/store";
import { getRedirectPath } from "@/utils/getRedirectPath";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSelector } from "react-redux";

export default function GuestRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const { user, isAuthInitialized } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!isAuthInitialized) return;

    if (user) {
      router.replace(getRedirectPath(user));
    }
  }, [user, router, isAuthInitialized]);

  if (!isAuthInitialized) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (user) return null;

  return <>{children}</>;
}
