"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "../../lib/axios";
import { forgotPasswordSchema } from "../../validators/auth.schema";

type FormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setServerError(null);
    try {
      await api.post("/auth/forgot-password", data);
      // Pass the target email context cleanly inside params to the next screen
      router.push(`/reset-password?email=${encodeURIComponent(data.email)}`);
    } catch (error: any) {
      setServerError(error.response?.data?.message || "Failed to trigger recovery sequence.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-[32px] p-6 sm:p-8 shadow-sm border border-slate-100">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Recover Password</h2>
        <p className="text-sm text-slate-500 mt-1">Enter your account email to receive a secure 6-digit reset token</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-medium text-red-600">{serverError}</div>}

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Registered Email</label>
          <input
            type="email"
            {...register("email")}
            placeholder="name@example.com"
            className="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-slate-900 transition-colors"
          />
          {errors.email && <p className="text-xs font-medium text-red-500 mt-1">{errors.email.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-[#12141c] hover:bg-[#1e222f] text-white font-semibold rounded-xl text-sm transition-all shadow-sm active:scale-[0.99] disabled:opacity-50">
          {loading ? "Sending token..." : "Send Reset Link"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Remember credentials?{" "}
        <a href="/login" className="font-semibold text-slate-900 underline underline-offset-4">
          Log in
        </a>
      </p>
    </div>
  );
}
