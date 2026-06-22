"use client";

import { api } from "@/lib/axios";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);

  const mutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await api.post("/auth/forgot-password", { email });
      return res.data;
    },
    onSuccess: () => {
      setIsRedirecting(true);

      router.push(`/verify-reset-otp?type=forgot_password&email=${encodeURIComponent(email)}`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data?.errors?.[0]?.message || "Something went wrong.";
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(email);
  };

  return (
    <div className="w-full bg-white p-6 sm:p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative z-20 space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 tracking-wide uppercase">Email address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="enter your email"
            className="w-full px-4 py-3.5 rounded-[16px] border border-slate-100 bg-slate-50/70 text-slate-900 font-medium text-sm focus:border-slate-950 focus:ring-2 focus:ring-slate-950/20 focus:bg-white outline-none transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={mutation.isPending || isRedirecting || !email}
          className="w-full h-[60px] bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-[24px] transition-all shadow-[0_10px_20px_rgba(0,0,0,0.1)] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center text-sm">
          {mutation.isPending ? <div className="w-6 h-6 border-2 border-slate-400 border-t-white rounded-full animate-spin" /> : "Send reset code"}
        </button>
      </form>

      <p className="text-center text-xs font-semibold text-slate-400">
        Remembered it?{" "}
        <a href="/login" className="text-slate-900 hover:text-slate-700 transition-colors">
          Back to login
        </a>
      </p>
    </div>
  );
}
