"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/axios";
import { getErrorMessage } from "@/utils/errorHandler";
import { RegisterFormData, registerSchema } from "@/validators/auth.schema";

const COUNTRY_CODES = [
  { code: "+91", flag: "🇮🇳", name: "IN" },
  { code: "+1", flag: "🇺🇸", name: "US" },
  { code: "+44", flag: "🇬🇧", name: "GB" },
  { code: "+971", flag: "🇦🇪", name: "AE" },
  { code: "+61", flag: "🇦🇺", name: "AU" },
  { code: "+49", flag: "🇩🇪", name: "DE" },
  { code: "+33", flag: "🇫🇷", name: "FR" },
  { code: "+81", flag: "🇯🇵", name: "JP" },
  { code: "+86", flag: "🇨🇳", name: "CN" },
  { code: "+55", flag: "🇧🇷", name: "BR" },
];

interface RegisterFormProps {
  onNavigate: (mode: "login" | "register") => void;
  isActive: boolean;
}

export default function RegisterForm({ onNavigate, isActive }: RegisterFormProps) {
  const router = useRouter();

  const [registerStep, setRegisterStep] = useState<1 | 2 | 3>(1);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Reset step to 1 when navigating to this tab
  useEffect(() => {
    if (isActive) {
      setRegisterStep(1);
    }
  }, [isActive]);

  const {
    register: regRegister,
    handleSubmit: handleRegSubmit,
    setValue: setRegValue,
    watch: watchReg,
    trigger: triggerReg,
    formState: { errors: regErrors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "user",
      countryCode: "+91",
    },
  });

  const watchRole = watchReg("role");
  const watchCountryCode = watchReg("countryCode");

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const { confirmPassword, ...payload } = data;
      const response = await api.post("/auth/register", payload);
      return response.data;
    },
    onSuccess: (_, variables) => {
      toast.success("Account created successfully!");
      router.replace(`/verify-email?email=${encodeURIComponent(variables.email)}`);
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Registration failed. Please try again."));
    },
  });

  const onRegSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  const handleNextStep = async () => {
    if (registerStep === 1) {
      setRegisterStep(2);
    } else if (registerStep === 2) {
      const isStep2Valid = await triggerReg(["name", "email", "phone", "countryCode"]);
      if (isStep2Valid) {
        setRegisterStep(3);
      }
    }
  };

  const handlePrevStep = () => {
    if (registerStep > 1) {
      setRegisterStep((prev) => (prev - 1) as 1 | 2 | 3);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 tracking-tight">Create account</h2>
        <p className="text-xs font-semibold text-slate-400 mt-1">
          Step {registerStep} of 3: {registerStep === 1 ? "Choose role" : registerStep === 2 ? "Personal details" : "Security credentials"}
        </p>
      </div>
      <div className="flex gap-2 py-0.5">
        <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${registerStep >= 1 ? "bg-slate-950" : "bg-slate-100"}`} />
        <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${registerStep >= 2 ? "bg-slate-950" : "bg-slate-100"}`} />
        <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${registerStep >= 3 ? "bg-slate-950" : "bg-slate-100"}`} />
      </div>
      <form onSubmit={handleRegSubmit(onRegSubmit)} className="space-y-4 pt-1">
        {registerStep === 1 && (
          <div className="space-y-3 animate-fade-in">
            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1 ml-0.5">I want to register as</label>
            <button
              type="button"
              onClick={() => setRegValue("role", "user", { shouldValidate: true })}
              className={`w-full p-4 border rounded-2xl flex items-center gap-3.5 transition-all text-left cursor-pointer active:scale-[0.99] ${watchRole === "user" ? "border-slate-950 bg-slate-50/50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${watchRole === "user" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-500"}`}>
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-xs text-slate-900">Health Tracker (User)</p>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">Track metrics, log activities, and receive AI health tips.</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setRegValue("role", "doctor", { shouldValidate: true })}
              className={`w-full p-4 border rounded-2xl flex items-center gap-3.5 transition-all text-left cursor-pointer active:scale-[0.99] ${watchRole === "doctor" ? "border-slate-950 bg-slate-50/50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${watchRole === "doctor" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-500"}`}>
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-xs text-slate-900">Medical Professional (Doctor)</p>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">Consult diaries, review patient logs, and prescribe advice.</p>
              </div>
            </button>
            <div className="pt-2">
              <button type="button" onClick={handleNextStep} className="w-full h-11 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-xs cursor-pointer">
                Continue
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          </div>
        )}
        {registerStep === 2 && (
          <div className="space-y-3.5 animate-fade-in">
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1 ml-0.5">Full Name</label>
              <input
                type="text"
                {...regRegister("name")}
                placeholder="Name"
                className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 transition-all outline-none text-sm"
              />
              {regErrors.name && <p className="text-[10px] font-semibold text-red-500 mt-1 ml-0.5">{regErrors.name.message}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1 ml-0.5">Email</label>
              <input
                type="email"
                {...regRegister("email")}
                placeholder="Enter your email"
                className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 transition-all outline-none text-sm"
              />
              {regErrors.email && <p className="text-[10px] font-semibold text-red-500 mt-1 ml-0.5">{regErrors.email.message}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1 ml-0.5">Phone Number</label>
              <div className="flex gap-2">
                <div className="relative">
                  <select
                    value={watchCountryCode}
                    onChange={(e) => setRegValue("countryCode", e.target.value, { shouldValidate: true })}
                    className="h-11 pl-3 pr-8 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold text-xs appearance-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 transition-all outline-none cursor-pointer">
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                  <svg className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
                <input
                  type="tel"
                  {...regRegister("phone")}
                  placeholder="Phone Number"
                  className="flex-1 h-11 px-4 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 transition-all outline-none text-sm"
                />
              </div>
              {(regErrors.phone || regErrors.countryCode) && <p className="text-[10px] font-semibold text-red-500 mt-1 ml-0.5">{regErrors.phone?.message || regErrors.countryCode?.message}</p>}
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={handlePrevStep} className="flex-1 h-11 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all flex items-center justify-center text-xs cursor-pointer">
                Back
              </button>
              <button type="button" onClick={handleNextStep} className="flex-1 h-11 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-xl transition-all flex items-center justify-center text-xs cursor-pointer">
                Next
              </button>
            </div>
          </div>
        )}
        {registerStep === 3 && (
          <div className="space-y-3.5 animate-fade-in">
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1 ml-0.5">Password</label>
              <div className="relative">
                <input
                  type={showRegPassword ? "text" : "password"}
                  {...regRegister("password")}
                  placeholder="••••••••"
                  className="w-full h-11 pl-4 pr-10 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 transition-all outline-none text-sm"
                />
                <button type="button" onClick={() => setShowRegPassword(!showRegPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                  {showRegPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  )}
                </button>
              </div>
              {regErrors.password && <p className="text-[10px] font-semibold text-red-500 mt-1 ml-0.5 leading-tight">{regErrors.password.message}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1 ml-0.5">Confirm Password</label>
              <div className="relative">
                <input
                  type={showRegConfirmPassword ? "text" : "password"}
                  {...regRegister("confirmPassword")}
                  placeholder="••••••••"
                  className="w-full h-11 pl-4 pr-10 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 transition-all outline-none text-sm"
                />
                <button type="button" onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                  {showRegConfirmPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  )}
                </button>
              </div>
              {regErrors.confirmPassword && <p className="text-[10px] font-semibold text-red-500 mt-1 ml-0.5">{regErrors.confirmPassword.message}</p>}
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={registerMutation.isPending}
                onClick={handlePrevStep}
                className="flex-1 h-11 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all flex items-center justify-center text-xs cursor-pointer disabled:opacity-50">
                Back
              </button>
              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="flex-1 h-11 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-[0_4px_12px_rgba(15,23,42,0.15)] active:scale-[0.98] disabled:opacity-75 flex items-center justify-center text-xs cursor-pointer">
                {registerMutation.isPending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Create Account"}
              </button>
            </div>
          </div>
        )}
      </form>
      <p className="text-center text-xs font-medium text-slate-500 pt-1">
        Already have an account?{" "}
        <button onClick={() => onNavigate("login")} className="font-bold text-slate-950 hover:underline cursor-pointer">
          Log in here
        </button>
      </p>
    </div>
  );
}
