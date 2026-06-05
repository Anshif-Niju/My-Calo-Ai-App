"use client";

import { api } from "@/lib/axios";
import { RootState } from "@/store";
import { setCredentials } from "@/store/slices/auth.slice";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

export default function TwoFactorForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const { tempToken } = useSelector((state: RootState) => state.auth);

  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [activeInput, setActiveInput] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const verifyMutation = useMutation({
    mutationFn: async (token: string) => {
      const res = await api.post("/auth/verify-2fa", {
        token,
        tempToken,
      });
      return res.data;
    },
    onSuccess: (data) => {
      dispatch(setCredentials({ accessToken: data.accessToken, user: data.user }));
      const { role, isVerified, onboardingCompleted } = data.user;

      if (!onboardingCompleted) {
        router.push(role === "doctor" ? "/onboarding/doctor" : "/onboarding/user");
        return;
      }
      if (role === "doctor") router.push(isVerified ? "/doctor/dashboard" : "/doctor/verification");
      else if (role === "admin") router.push("/admin/dashboard");
      else if (role === "subadmin") router.push("/subadmin/dashboard");
      else router.push("/home");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.response?.data?.errors?.[0]?.message || "Invalid Code. Try again";
      toast.error(message);    },
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
    if (newOtp.every((v) => v !== "") && newOtp.join("").length === 6) {
      verifyMutation.mutate(newOtp.join(""));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
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
    pastedData.forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);
    const focusIndex = Math.min(pastedData.length, 5);
    setActiveInput(focusIndex);
    inputRefs.current[focusIndex]?.focus();
    if (newOtp.join("").length === 6) verifyMutation.mutate(newOtp.join(""));
  };

  if (!tempToken) {
    return (
      <div className="w-full bg-white p-8 rounded-[32px] text-center border border-slate-100">
        <p className="text-slate-500 font-medium text-sm">Invalid session. Please login again.</p>
        <button onClick={() => router.push("/login")} className="mt-4 text-slate-950 font-bold underline">
          Back to login
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-white p-6 sm:p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative z-20">
      <p className="text-center text-xs font-bold text-slate-400 mb-6 tracking-wide">
        OPEN YOUR <span className="text-slate-900">AUTHENTICATOR APP</span>
      </p>
      
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

      <div className="mt-6">
        <button
          disabled={verifyMutation.isPending || otp.join("").length !== 6}
          onClick={() => verifyMutation.mutate(otp.join(""))}
          className="w-full h-[60px] bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-[24px] transition-all shadow-[0_10px_20px_rgba(0,0,0,0.1)] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center text-sm">
          {verifyMutation.isPending ? <div className="w-6 h-6 border-2 border-slate-400 border-t-white rounded-full animate-spin" /> : "Verify"}
        </button>
      </div>

      <p className="text-center text-xs font-semibold text-slate-400 mt-6">
        Lost access?{" "}
        <a href="/login" className="text-slate-900 hover:underline">
          Back to login
        </a>
      </p>
    </div>
  );
}
