"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { forgotPasswordSchema, ForgotPasswordFormData } from "@/validators/auth.schema";

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const forgotMutation = useMutation({
    mutationFn: async (data: ForgotPasswordFormData) => {
      const response = await api.post("/auth/forgot-password", data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Securely pass the email to the reset page via URL params
      router.push(`/reset-password?email=${encodeURIComponent(variables.email)}`);
    },
    onError: (error: any) => {
      setServerError(error.response?.data?.message || "Failed to send reset code.");
    },
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    setServerError(null);
    forgotMutation.mutate(data);
  };

  return (
    <div className="w-full bg-white p-6 sm:p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative z-20">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-[20px] text-sm font-semibold text-red-600">
            {serverError}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-2">
            Email Address
          </label>
          <input
            type="email"
            {...register("email")}
            placeholder="name@example.com"
            className="w-full h-[60px] px-6 rounded-[24px] border border-slate-100 bg-slate-50/50 text-slate-900 font-medium placeholder:text-slate-300 focus:ring-2 focus:ring-slate-950 transition-all outline-none"
          />
          {errors.email && (
            <p className="text-[11px] font-semibold text-red-500 mt-2 ml-2">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={forgotMutation.isPending}
          className="w-full h-[60px] mt-6 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-[24px] transition-all shadow-[0_10px_20px_rgba(0,0,0,0.1)] active:scale-[0.98] disabled:opacity-70 flex items-center justify-center text-sm"
        >
          {forgotMutation.isPending ? (
            <div className="w-6 h-6 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
          ) : (
            "Send Reset Code"
          )}
        </button>
      </form>

      <p className="text-center text-sm font-medium text-slate-500 mt-8">
        Remember your password?{" "}
        <Link href="/login" className="font-bold text-slate-950 hover:text-slate-700 transition-colors">
          Back to Login
        </Link>
      </p>
    </div>
  );
}
