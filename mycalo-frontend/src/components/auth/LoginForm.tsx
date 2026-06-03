"use client";

import { api } from "@/lib/axios";
import { setCredentials, setTwoFactorRequired } from "@/store/slices/auth.slice";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { z } from "zod";

// Zod Schema for frontend validation
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // TanStack Query Mutation for the login API call

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await api.post("/auth/login", data);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.requiresTwoFactor) {
        dispatch(setTwoFactorRequired({ tempToken: data.tempToken }));
        router.push("/two-factor");
        return;
      }

      dispatch(setCredentials({ accessToken: data.accessToken, user: data.user }));

      if (data.user.onboardingCompleted) {
        router.push("/home");
      } else {
        router.push("/onboarding/role-select");
      }
    },
    onError: (error: any) => {
      setServerError(error.response?.data?.message || "Something went wrong. Please try again.");
    },
  });

  const onSubmit = (data: LoginFormData) => {
    setServerError(null);
    loginMutation.mutate(data);
  };

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/google`;
  };

  return (
    <div className="w-full bg-white p-6 sm:p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-sm font-semibold text-red-600">{serverError}</div>}

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 ml-1">Email</label>
          <input
            type="email"
            {...register("email")}
            placeholder="name@example.com"
            className="w-full h-14 px-5 rounded-2xl border-none bg-slate-50 text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-slate-950 transition-all outline-none"
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
          <input
            type="password"
            {...register("password")}
            placeholder="••••••••"
            className="w-full h-14 px-5 rounded-2xl border-none bg-slate-50 text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-slate-950 transition-all outline-none"
          />
          {errors.password && <p className="text-xs font-semibold text-red-500 mt-2 ml-1">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full h-14 mt-4 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all shadow-md active:scale-[0.98] disabled:opacity-70 flex items-center justify-center">
          {loginMutation.isPending ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Log In"}
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
          <path
            fill="#EA4335"
            d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.227C18.404 1.492 15.584 0 12.24 0 5.58 0 0 5.58 0 12.24s5.58 12.24 12.24 12.24c6.96 0 11.57-4.894 11.57-11.79 0-.795-.085-1.4-.195-1.905H12.24z"
          />
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
