"use client";

import { api } from "@/lib/axios";
import { setUser } from "@/store/slices/auth.slice";
import {getRedirectPath} from "@/utils/getRedirectPath";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";

export default function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();

  const emailParam = searchParams.get("email") || "";

  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [activeInput, setActiveInput] = useState<number>(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const verifyMutation = useMutation({
    mutationFn: async (data: { email: string; otp: string }) => {
      const response = await api.post("/auth/verify-otp", {
        email: data.email,
        otp: data.otp,
        type: "email_verify",
      });
      return response.data;
    },
    onSuccess: (data) => {
      dispatch(setUser({ user: data.user }));
      router.replace(getRedirectPath(data.user));
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data?.errors?.[0]?.message || "Invalid verification code.";
      toast.error(message);
    },
  });

  const resendMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await api.post("/auth/resend-Otp", {
        email,
        type: "email_verify",
      });
      return response.data;
    },
    onSuccess: () => {
      // clear all boxes and focus first
      setOtp(Array(6).fill(""));
      setActiveInput(0);
      inputRefs.current[0]?.focus();
      setSuccessMessage("A new code has been sent!");
      setTimeLeft(60);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to resend code.");
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    if (!/^[0-9]*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      setActiveInput(index + 1);
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        // box has value → clear it, stay on same box
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        // box is empty → move to previous and clear it
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        setActiveInput(index - 1);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").slice(0, 6).split("");
    if (!/^\d+$/.test(pastedData.join(""))) return;

    const newOtp = [...otp];
    pastedData.forEach((char, index) => {
      if (index < 6) newOtp[index] = char;
    });
    setOtp(newOtp);

    const focusIndex = Math.min(pastedData.length, 5);
    setActiveInput(focusIndex);
    inputRefs.current[focusIndex]?.focus();
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);

    const otpString = otp.join("");
    if (otpString.length !== 6) {
      toast.error("Please enter all 6 digits.");
      return;
    }

    verifyMutation.mutate({ email: emailParam, otp: otpString });
  };

  if (!emailParam) {
    return (
      <div className="w-full bg-white p-8 rounded-[32px] text-center border border-slate-100">
        <p className="text-slate-500 font-medium text-sm">Invalid request. Please register again.</p>
        <button onClick={() => router.push("/register")} className="mt-4 text-slate-950 font-bold underline">
          Go back to Registration
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-white p-6 sm:p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative z-20">
      <p className="text-center text-xs font-bold text-slate-400 mb-6 tracking-wide">
        SENT TO: <span className="text-slate-900">{emailParam}</span>
      </p>

      <form onSubmit={onSubmit} className="space-y-6">
        {successMessage && <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-[16px] text-xs font-semibold text-emerald-600 text-center animate-in fade-in zoom-in duration-300">{successMessage}</div>}

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
              onFocus={() => setActiveInput(index)}
              className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-black rounded-2xl border transition-all outline-none
                ${activeInput === index ? "border-slate-950 ring-2 ring-slate-950/20 bg-white" : "border-slate-100 bg-slate-50/70 text-slate-900"}`}
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={verifyMutation.isPending || otp.join("").length !== 6}
          className="w-full h-[60px] bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-[24px] transition-all shadow-[0_10px_20px_rgba(0,0,0,0.1)] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center text-sm">
          {verifyMutation.isPending ? <div className="w-6 h-6 border-2 border-slate-400 border-t-white rounded-full animate-spin" /> : "Verify & Continue"}
        </button>
      </form>

      <div className="mt-8 text-center">
        {timeLeft > 0 ? (
          <p className="text-xs font-semibold text-slate-400">
            Resend code in <span className="text-slate-900 w-8 inline-block">00:{timeLeft.toString().padStart(2, "0")}</span>
          </p>
        ) : (
          <button type="button" onClick={() => resendMutation.mutate(emailParam)} disabled={resendMutation.isPending} className="text-sm font-bold text-slate-950 hover:text-slate-700 transition-colors">
            {resendMutation.isPending ? "Sending..." : "Resend Code"}
          </button>
        )}
      </div>
    </div>
  );
}
