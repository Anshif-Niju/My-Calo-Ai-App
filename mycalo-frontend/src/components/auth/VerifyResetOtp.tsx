"use client";

import { api } from "@/lib/axios";
import { getErrorMessage } from "@/utils/errorHandler";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";


const OTP_LENGTH = 6;
const RESEND_TIME = 60;
const OTP_TYPE = "forgot_password";


export default function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [timeLeft, setTimeLeft] = useState<number>(RESEND_TIME);

    const resetOtp = () => {
    setOtp(Array(OTP_LENGTH).fill(""));
    setTimeLeft(RESEND_TIME);
    inputRefs.current[0]?.focus();
  };

  // 1 min showing for resend
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // NEW: Auto-focus the first input box on page load
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Verify Otp Mutation
  const verifyMutation = useMutation({
    mutationFn: async ({ otp }: { otp: string }) => {
      const res = await api.post("/auth/verify-otp", {
        email: email,
        otp: otp,
        type: OTP_TYPE,
      });
      return res.data;
    },
    onSuccess: (data) => {
      router.push(`/new-password?resetToken=${encodeURIComponent(data.resetToken)}`);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Invalid code. Please try again."));
    },
  });

  // Resend Mutation
  const resendMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/auth/resend-otp", { email, type: OTP_TYPE });
      return res.data;
    },
    onSuccess: () => {
      toast.success("A new code has been sent.");

  resetOtp()
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to resend code."));
    },
  });

  // Otp Inbox next going
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    if (!/^[0-9]*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Otp Inbox Back going
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Otp Copy and Paste
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").slice(0, 6).split("");
    if (!/^\d+$/.test(pastedData.join(""))) return;
    const newOtp = [...otp];
    pastedData.forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);
    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  // On Submit
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      toast.error("Please enter all 6 digits.");
      return;
    }
    verifyMutation.mutate({ otp: otpString });
  };

  if (!email) {
    return (
      <div className="w-full bg-white p-8 rounded-[32px] text-center border border-slate-100">
        <p className="text-slate-500 font-medium text-sm">Invalid request. Please try again.</p>
        <Link href="/login" className="mt-4 text-slate-950 font-bold underline">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full bg-white p-6 sm:p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative z-20">
      <p className="text-center text-xs font-bold text-slate-400 mb-6 tracking-wide">
        SENT TO: <span className="text-slate-900">{email}</span>
      </p>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="flex justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="
w-10 h-12
sm:w-12 sm:h-14
text-center
text-xl
font-black
rounded-2xl
border
border-slate-100
bg-slate-50
focus:border-slate-950
focus:ring-2
focus:ring-slate-950/20
focus:bg-white
outline-none
transition-all
"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={verifyMutation.isPending || otp.join("").length !== 6}
          className="w-full h-[60px] bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-[24px] transition-all shadow-[0_10px_20px_rgba(0,0,0,0.1)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm">
          {verifyMutation.isPending ? <div className="w-6 h-6 border-2 border-slate-400 border-t-white rounded-full animate-spin" /> : "Verify & Continue"}
        </button>
      </form>

      <div className="mt-8 text-center">
        {timeLeft > 0 ? (
          <p className="text-xs font-semibold text-slate-400">
            Resend code in <span className="text-slate-900 w-8 inline-block">00:{timeLeft.toString().padStart(2, "0")}</span>
          </p>
        ) : (
          <button type="button" onClick={() => resendMutation.mutate()} disabled={resendMutation.isPending} className="text-sm font-bold text-slate-950 hover:text-slate-700 transition-colors">
            {resendMutation.isPending ? "Sending..." : "Resend Code"}
          </button>
        )}
      </div>
    </div>
  );
}
