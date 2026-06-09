"use client";

import { setAuthInitialized , setCredentials } from "@/store/slices/auth.slice";
import axios from "axios";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

export default function AuthInitializer() {
  const dispatch = useDispatch();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await axios.post("http://localhost:5000/api/auth/refresh", {}, { withCredentials: true });

        dispatch(
          setCredentials({
            accessToken: res.data.accessToken,
            user: res.data.user,
          }),
        );
      } catch (error) {
        console.log("Not logged in");
      } finally {
        dispatch(setAuthInitialized());
      }
    };

    initAuth();
  }, []);

  return null;
}
