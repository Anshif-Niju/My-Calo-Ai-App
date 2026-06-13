"use client";

import { RootState } from "@/store";
import { setAuthInitialized, setCredentials } from "@/store/slices/auth.slice";
import axios from "axios";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function AuthInitializer() {
  const dispatch = useDispatch();

  const { accessToken, isAuthInitialized } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isAuthInitialized) return;

    const initAuth = async () => {
      try {
        const res = await axios.post("http://localhost:5000/api/auth/refresh", {}, { withCredentials: true });

        dispatch(
          setCredentials({
            accessToken: res.data.accessToken,
            user: res.data.user,
          }),
        );
      } catch {
        console.log("Not logged in");
      } finally {
        dispatch(setAuthInitialized());
      }
    };

    initAuth();
  }, [dispatch, isAuthInitialized]);

  return null;
}
