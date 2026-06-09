"use client";

import { RootState } from "@/store";
import { getRedirectPath } from "@/utils/getRedirectPath";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

export default function GuestRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const [isChecking, setIsChecking] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    if (user) {
      router.push(getRedirectPath(user));
    } else {
      setIsChecking(false);
    }
  }, [user, router, isMounted]);

  if (!isMounted || isChecking || user) {
    return <div className="min-h-screen bg-[#f8fafc]" />;
  }

  return <>{children}</>;
}
