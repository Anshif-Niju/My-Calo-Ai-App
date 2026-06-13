"use client";

import { api } from "@/lib/axios";
import { setAuthInitialized, setCredentials } from "@/store/slices/auth.slice";
import { getRedirectPath } from "@/utils/getRedirectPath";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

export default function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      router.push("/login?error=auth_failed");
      return;
    }

    // Fetch user info using the token
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        dispatch(
          setCredentials({
            accessToken: token,
            user: res.data.user,
          }),
        );

        dispatch(setAuthInitialized());

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
