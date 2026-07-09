"use client";

import { api } from "@/lib/axios";
import { getErrorMessage } from "@/utils/errorHandler";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, ForgotPasswordFormData } from "@/validators/auth.schema";

export default function ForgotPasswordForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordFormData) => {
      const response = await api.post("/auth/forgot-password", data);

      return response.data;
    },
    onSuccess: (_, variables) => {

      router.push(`/verify-reset-otp?email=${encodeURIComponent(variables.email)}`);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Something went wrong."));
    },
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    forgotPasswordMutation.mutate(data);
  };

  return (
    <div className="w-full bg-white p-6 sm:p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative z-20 space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 tracking-wide uppercase">Email address</label>
          <input
            type="email"
            autoComplete="email"
            autoFocus
            {...register("email")}
            placeholder="enter your email"
            className="w-full px-4 py-3.5 rounded-[16px] border border-slate-100 bg-slate-50/70 text-slate-900 font-medium text-sm focus:border-slate-950 focus:ring-2 focus:ring-slate-950/20 focus:bg-white outline-none transition-all"
          />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>

        <button
          type="submit"
          disabled={forgotPasswordMutation.isPending }
          className="w-full h-[60px] bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-[24px] transition-all shadow-[0_10px_20px_rgba(0,0,0,0.1)] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center text-sm">
          {forgotPasswordMutation.isPending ? <div className="w-6 h-6 border-2 border-slate-400 border-t-white rounded-full animate-spin" /> : "Send reset code"}
        </button>
      </form>

      <p className="text-center text-xs font-semibold text-slate-400">
        Remembered it?{" "}
        <Link href="/login" className="text-slate-900 hover:text-slate-700 transition-colors">
          Back to login
        </Link>
      </p>
    </div>
  );
}
