"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema } from "../../validators/auth.schema";
import { z } from "zod";
import { api } from "../../lib/axios";
import { useRouter, useSearchParams } from "next/navigation";

type FormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setServerError(null);
    try {
      const response = await api.post("/auth/reset-password", {
        email,
        otp: data.otp,
        newPassword: data.newPassword,
      });
      setSuccessMessage(response.data.message || "Password updated successfully!");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: any) {
      setServerError(error.response?.data?.message || "Verification code validation failure.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-slate-100">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Set New Password</h2>
        <p className="text-sm text-slate-500 mt-1">Verify your 6-digit recovery code to assign a new secure passphrase</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-medium text-red-600">
            {serverError}
          </div>
        )}
        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-medium text-emerald-600">
            {successMessage}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Reset OTP Token</label>
          <input
            type="text"
            maxLength={6}
            {...register("otp")}
            placeholder="000000"
            className="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-slate-900 transition-colors"
          />
          {errors.otp && <p className="text-xs font-medium text-red-500 mt-1">{errors.otp.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">New Password</label>
          <input
            type="password"
            {...register("newPassword")}
            placeholder="Minimum 8 characters"
            className="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-slate-900 transition-colors"
          />
          {errors.newPassword && <p className="text-xs font-medium text-red-500 mt-1">{errors.newPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-[#12141c] hover:bg-[#1e222f] text-white font-semibold rounded-xl text-sm transition-all shadow-sm active:scale-[0.99] disabled:opacity-50"
        >
          {loading ? "Updating credentials..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}
