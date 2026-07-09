"use client";

import { api } from "@/lib/axios";
import { getErrorMessage } from "@/utils/errorHandler";
import { setUser } from "@/store/slices/auth.slice";
import { getRedirectPath } from "@/utils/getRedirectPath";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import Link from "next/link";

const OTP_LENGTH = 6;
const RESEND_TIME = 60;
const OTP_TYPE = "email_verify";

export default function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();

  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [timeLeft, setTimeLeft] = useState<number>(RESEND_TIME);

  const resetOtp = () => {
    setOtp(Array(OTP_LENGTH).fill(""));
    setTimeLeft(RESEND_TIME);
    inputRefs.current[0]?.focus();
  };

  // Timer one second
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

  // Verify Mutation
  const verifyMutation = useMutation({
    mutationFn: async (otp: { otp: string }) => {
      const response = await api.post("/auth/verify-otp", {
        email: email,
        otp,
        type: OTP_TYPE,
      });
      return response.data;
    },
    onSuccess: (data) => {
      dispatch(setUser({ user: data.user }));
      router.replace(getRedirectPath(data.user));
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Invalid code. Please try again later"));
    },
  });

  // Resend Otp Mutation
  const resendMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/auth/resend-Otp", {
        email,
        type: OTP_TYPE,
      });
      return response.data;
    },
    onSuccess: () => {
      resetOtp();
      toast.success("A new code has been sent!");
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
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  // Otp Copy and Paste
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").slice(0, OTP_LENGTH).split("");
    if (!/^\d+$/.test(pastedData.join(""))) return;

    const newOtp = [...otp];
    pastedData.forEach((char, index) => {
      if (index < 6) newOtp[index] = char;
    });
    setOtp(newOtp);

    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  //On submit
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
        <p className="text-slate-500 font-medium text-sm">Invalid request. Please register again.</p>
        <Link href="/register" className="mt-4 text-slate-950 font-bold underline">
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
          <button type="button" onClick={() => resendMutation.mutate()} disabled={resendMutation.isPending} className="text-sm font-bold text-slate-950 hover:text-slate-700 transition-colors">
            {resendMutation.isPending ? "Sending..." : "Resend Code"}
          </button>
        )}
      </div>
    </div>
  );
}
