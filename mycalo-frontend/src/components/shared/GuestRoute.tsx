"use client";

import { RootState } from "@/store";
import { getRedirectPath } from "@/utils/getRedirectPath";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSelector } from "react-redux";

export default function GuestRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const { user } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    if (user) {
      router.replace(getRedirectPath(user));
    }
  }, [user, router]);

  if (user) return null;

  return <>{children}</>;
}
