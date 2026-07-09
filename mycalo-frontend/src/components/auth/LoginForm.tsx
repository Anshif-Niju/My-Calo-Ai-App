"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/axios";
import { getRedirectPath } from "@/utils/getRedirectPath";
import { getErrorMessage } from "@/utils/errorHandler";
import { LoginFormData, loginSchema } from "@/validators/auth.schema";

interface LoginFormProps {
  onNavigate: (mode: "login" | "register") => void;
}

export default function LoginForm({ onNavigate }: LoginFormProps) {
  const router = useRouter();

  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await api.post("/auth/login", data);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.requiresTwoFactor) {
        router.replace("/two-factor");
        return;
      }
      router.replace(getRedirectPath(data.user));
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Something went wrong. Please try again later"));
    },
  });

  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/google`;
  };

  const handleGithubLogin = () => {
    toast.info("GitHub Login is currently not configured for this project.");
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 tracking-tight">Welcome back</h2>
        <p className="text-xs font-semibold text-slate-400 mt-1">Sign in to your workspace</p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={handleGoogleLogin}
          type="button"
          className="flex-1 h-11 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-xs shadow-sm cursor-pointer">
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google
        </button>
        <button
          onClick={handleGithubLogin}
          type="button"
          className="flex-1 h-11 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-xs shadow-sm cursor-pointer">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z"
            />
          </svg>
          GitHub
        </button>
      </div>
      <div className="relative my-2 flex items-center justify-center">
        <hr className="w-full border-slate-100" />
        <span className="absolute bg-white px-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">or sign in with email</span>
      </div>
      <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-3.5">
        <div>
          <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1 ml-0.5">Email address</label>
          <input
            type="email"
            autoFocus
            autoComplete="email"
            {...loginRegister("email")}
            placeholder="Enter Your Email"
            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 transition-all outline-none text-sm"
          />
          {loginErrors.email && <p className="text-[10px] font-semibold text-red-500 mt-1 ml-0.5">{loginErrors.email.message}</p>}
        </div>
        <div>
          <div className="flex justify-between items-center mb-1 ml-0.5">
            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Password</label>
            <Link href="/forgot-password" className="text-[10px] font-bold text-slate-400 hover:text-slate-950 transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showLoginPassword ? "text" : "password"}
              autoComplete="current-password"
              {...loginRegister("password")}
              placeholder="Enter your password"
              className="w-full h-11 pl-4 pr-10 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 transition-all outline-none text-sm"
            />
            <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
              {showLoginPassword ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                  />
                </svg>
              )}
            </button>
          </div>
          {loginErrors.password && <p className="text-[10px] font-semibold text-red-500 mt-1 ml-0.5">{loginErrors.password.message}</p>}
        </div>
        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full h-11 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-[0_4px_12px_rgba(15,23,42,0.15)] active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 text-xs cursor-pointer">
          {loginMutation.isPending ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              Sign in to workspace
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </>
          )}
        </button>
      </form>
      <p className="text-center text-xs font-medium text-slate-500 pt-2">
        Don&apos;t have a account?{" "}
        <button onClick={() => onNavigate("register")} className="font-bold text-slate-950 hover:underline cursor-pointer">
          Create one free
        </button>
      </p>
    </div>
  );
}
