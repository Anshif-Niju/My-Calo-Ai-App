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
      router.replace(getRedirectPath(user));
    }
  }, [user, isInitialized, router]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen w-full bg-[#f8fafc] text-slate-900 flex flex-col items-center justify-start sm:justify-center py-12 px-4 relative overflow-x-hidden">
        <div className=" bg-[#f8fafc] text-center pb-6 shrink-0">
          <p className="text-xs font-semibold text-slate-400">MyCalo AI • Secure Platform</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen w-full bg-[#f8fafc] text-slate-900 flex flex-col items-center justify-start sm:justify-center py-12 px-4 relative overflow-x-hidden">
        <div className=" bg-[#f8fafc] text-center pb-6 shrink-0">
          <p className="text-xs font-semibold text-slate-400">MyCalo AI • Secure Platform</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
