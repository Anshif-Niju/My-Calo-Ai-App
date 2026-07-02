"use client";

import { api } from "@/lib/axios";
import { setUser } from "@/store/slices/auth.slice";
import { getRedirectPath } from "@/utils/getRedirectPath";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

export default function AuthCallbackHandler() {
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/me");

        dispatch(
          setUser({
            user: res.data.user,
          }),
        );

        router.replace(getRedirectPath(res.data.user));
      } catch {
        router.replace("/login?error=auth_failed");
      }
    };

    fetchUser();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-950 rounded-full animate-spin" />
    </div>
  );
}
