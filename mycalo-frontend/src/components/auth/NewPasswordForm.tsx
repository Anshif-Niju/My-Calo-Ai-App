"use client";

import { api } from "@/lib/axios";
import { getErrorMessage } from "@/utils/errorHandler";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, ResetPasswordFormData } from "@/validators/auth.schema";

export default function NewPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetToken = searchParams.get("resetToken") || "";

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const newPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordFormData) => {
      const res = await api.post("/auth/new-password", {
        resetToken,
        newPassword: data.newPassword,
      });

      return res.data;
    },

    onSuccess: () => {
      router.push("/login?reset=success");
    },

    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Something went wrong."));
    },
  });

  const onSubmit = (data: ResetPasswordFormData) => {
    newPasswordMutation.mutate(data);
  };
  const eyeOpen = (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const eyeOff = (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
      />
    </svg>
  );

  if (!resetToken) {
    return (
      <div className="w-full bg-white p-8 rounded-[32px] text-center border border-slate-100">
        <p className="text-slate-500 font-medium text-sm">Invalid or expired reset link.</p>
        <button onClick={() => router.push("/forgot-password")} className="mt-4 text-slate-950 font-bold underline">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-white p-6 sm:p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative z-20 space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* New Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 tracking-wide uppercase">New password</label>
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              {...register("newPassword")}
              autoComplete="new-password"
              autoFocus
              placeholder="Min 8 characters"
              className="w-full px-4 py-3.5 pr-12 rounded-[16px] border border-slate-100 bg-slate-50/70 text-slate-900 font-medium text-sm focus:border-slate-950 focus:ring-2 focus:ring-slate-950/20 focus:bg-white outline-none transition-all"
            />
            {errors.newPassword && <p className="text-xs text-red-500">{errors.newPassword.message}</p>}

            <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
              {showNewPassword ? eyeOpen : eyeOff}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 tracking-wide uppercase">Confirm password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              {...register("confirmPassword")}
              autoComplete="new-password"
              placeholder="Repeat your password"
              className="w-full px-4 py-3.5 pr-12 rounded-[16px] border border-slate-100 bg-slate-50/70 text-slate-900 font-medium text-sm focus:border-slate-950 focus:ring-2 focus:ring-slate-950/20 focus:bg-white outline-none transition-all"
            />
            {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
              {showConfirmPassword ? eyeOpen : eyeOff}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={newPasswordMutation.isPending || !isValid}
          className="w-full h-[60px] bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-[24px] transition-all shadow-[0_10px_20px_rgba(0,0,0,0.1)] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center text-sm">
          {newPasswordMutation.isPending ? <div className="w-6 h-6 border-2 border-slate-400 border-t-white rounded-full animate-spin" /> : "Reset password"}
        </button>
      </form>
    </div>
  );
}
