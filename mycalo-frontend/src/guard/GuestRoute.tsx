"use client";

import { RootState } from "@/store";
import { getRedirectPath } from "@/utils/getRedirectPath";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSelector } from "react-redux";
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
      <div className="min-h-screen w-full bg-[#f8fafc] flex items-center justify-center">
        <p className="text-xs font-semibold text-slate-400">MyCalo AI</p>
      </div>
    );
  }

  return <>{children}</>;
}
