"use client";

import { api } from "@/lib/axios";
import { logoutAction, setInitialized, setUser } from "@/store/slices/auth.slice";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";

export default function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const { isInitialized } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isInitialized) return;

    const initialize = async () => {
      try {
        const { data } = await api.get("/auth/me");
        dispatch(setUser({ user: data.user }));
      } catch {
        dispatch(logoutAction());
      } finally {
        dispatch(setInitialized());
      }
    };

    initialize();
  }, [dispatch, isInitialized]);

  return <>{children}</>;
}
