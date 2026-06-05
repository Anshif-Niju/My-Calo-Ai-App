"use client";

import { api } from "@/lib/axios";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function NewPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetToken = searchParams.get("resetToken") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/auth/reset-password", { resetToken, newPassword });
      return res.data;
    },
    onSuccess: () => {
      router.push("/login?reset=success");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data?.errors?.[0]?.message || "Something went wrong.";
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    mutation.mutate();
  };

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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 tracking-wide uppercase">New password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min 8 characters"
            className="w-full px-4 py-3.5 rounded-[16px] border border-slate-100 bg-slate-50/70 text-slate-900 font-medium text-sm focus:border-slate-950 focus:ring-2 focus:ring-slate-950/20 focus:bg-white outline-none transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 tracking-wide uppercase">Confirm password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat your password"
            className="w-full px-4 py-3.5 rounded-[16px] border border-slate-100 bg-slate-50/70 text-slate-900 font-medium text-sm focus:border-slate-950 focus:ring-2 focus:ring-slate-950/20 focus:bg-white outline-none transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={mutation.isPending || !newPassword || !confirm}
          className="w-full h-[60px] bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-[24px] transition-all shadow-[0_10px_20px_rgba(0,0,0,0.1)] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center text-sm">
          {mutation.isPending ? <div className="w-6 h-6 border-2 border-slate-400 border-t-white rounded-full animate-spin" /> : "Reset password"}
        </button>
      </form>
    </div>
  );
}
