"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { resetPasswordSchema, ResetPasswordFormData } from "@/validators/auth.schema";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: emailParam, // Automatically populate the hidden email field
    },
  });

  const resetMutation = useMutation({
    mutationFn: async (data: ResetPasswordFormData) => {
      const response = await api.post("/auth/reset-password", data);
      return response.data;
    },
    onSuccess: () => {
      // Upon successful password change, redirect to login
      router.push("/login?message=Password reset successfully");
    },
    onError: (error: any) => {
      setServerError(error.response?.data?.message || "Failed to reset password.");
    },
  });

  const onSubmit = (data: ResetPasswordFormData) => {
    setServerError(null);
    resetMutation.mutate(data);
  };

  return (
    <div className="w-full bg-white p-6 sm:p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative z-20">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-[20px] text-sm font-semibold text-red-600">
            {serverError}
          </div>
        )}

        {/* Hidden Email Field (Required for Backend verification) */}
        <input type="hidden" {...register("email")} />

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-2">
            6-Digit Code
          </label>
          <input
            type="text"
            maxLength={6}
            {...register("otp")}
            placeholder="123456"
            className="w-full h-[60px] px-6 rounded-[24px] border border-slate-100 bg-slate-50/50 text-slate-950 font-bold tracking-[0.5em] placeholder:text-slate-300 placeholder:tracking-normal focus:ring-2 focus:ring-slate-950 transition-all outline-none"
          />
          {errors.otp && (
            <p className="text-[11px] font-semibold text-red-500 mt-2 ml-2">{errors.otp.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-2">
            New Password
          </label>
          <input
            type="password"
            {...register("newPassword")}
            placeholder="••••••••"
            className="w-full h-[60px] px-6 rounded-[24px] border border-slate-100 bg-slate-50/50 text-slate-900 font-medium placeholder:text-slate-300 focus:ring-2 focus:ring-slate-950 transition-all outline-none"
          />
          {errors.newPassword && (
            <p className="text-[11px] font-semibold text-red-500 mt-2 ml-2">{errors.newPassword.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-2">
            Confirm Password
          </label>
          <input
            type="password"
            {...register("confirmPassword")}
            placeholder="••••••••"
            className="w-full h-[60px] px-6 rounded-[24px] border border-slate-100 bg-slate-50/50 text-slate-900 font-medium placeholder:text-slate-300 focus:ring-2 focus:ring-slate-950 transition-all outline-none"
          />
          {errors.confirmPassword && (
            <p className="text-[11px] font-semibold text-red-500 mt-2 ml-2">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={resetMutation.isPending}
          className="w-full h-[60px] mt-6 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-[24px] transition-all shadow-[0_10px_20px_rgba(0,0,0,0.1)] active:scale-[0.98] disabled:opacity-70 flex items-center justify-center text-sm"
        >
          {resetMutation.isPending ? (
            <div className="w-6 h-6 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
          ) : (
            "Update Password"
          )}
        </button>
      </form>
    </div>
  );
}
