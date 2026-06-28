"use client";

import { api } from "@/lib/axios";
import { setTwoFactorRequired, setUser } from "@/store/slices/auth.slice";
import { getRedirectPath } from "@/utils/getRedirectPath";
import { LoginFormData, loginSchema } from "@/validators/auth.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { toast } from "sonner";

export default function LoginForm() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema), // Use imported schema
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await api.post("/auth/login", data);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.requiresTwoFactor) {
        setIsRedirecting(true);

        dispatch(
          setTwoFactorRequired({
            tempToken: data.tempToken,
          }),
        );

        router.replace("/two-factor");
        return;
      }
      dispatch(
        setUser({
          user: data.user,
        }),
      );

      setIsRedirecting(true);

      router.replace(getRedirectPath(data.user));
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data?.errors?.[0]?.message || "Something went wrong. Please try again later";
      toast.error(message);
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/google`;
  };

  return (
    <div className="w-full bg-white p-6 sm:p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative z-20">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 ml-1">Email</label>
          <input
            type="email"
            {...register("email")}
            placeholder="Enter your email"
            className="w-full h-14 px-5 rounded-2xl border-none bg-slate-50 border-slate-500  text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-slate-950 transition-all outline-none"
          />
          {errors.email && <p className="text-xs font-semibold text-red-500 mt-2 ml-1">{errors.email.message}</p>}
        </div>

        <div>
          <div className="flex justify-between items-center mb-2 ml-1 mr-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Password</label>
            <Link href="/forgot-password" className="text-xs font-bold text-slate-400 hover:text-slate-950 transition-colors">
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              {...register("password")}
              placeholder="••••••••"
              className="w-full h-14 px-5 rounded-2xl border-none border-slate-500  text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-slate-950 transition-all outline-none"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors">
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                  />
                </svg>
              )}
            </button>
          </div>
          {errors.password && <p className="text-[11px] font-semibold text-red-500 mt-2 ml-2">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loginMutation.isPending || isRedirecting}
          className="w-full h-14 mt-6 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all shadow-md active:scale-[0.98] disabled:opacity-70 flex items-center justify-center">
          {loginMutation.isPending || isRedirecting ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Login"}
        </button>
      </form>

      <div className="relative my-6 flex items-center justify-center">
        <hr className="w-full border-slate-100" />
        <span className="absolute bg-white px-4 text-xs font-bold text-slate-300 uppercase tracking-widest">OR</span>
      </div>

      <button
        onClick={handleGoogleLogin}
        type="button"
        className="w-full h-14 bg-white border-2 border-slate-100 hover:bg-slate-50 hover:border-slate-200 text-slate-700 font-bold rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3">
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </button>

      <p className="text-center text-sm font-medium text-slate-500 mt-8">
        New to MyCalo?{" "}
        <Link href="/register" className="font-bold text-slate-950 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
