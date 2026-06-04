"use client";

import { api } from "@/lib/axios";
import { RegisterFormData, registerSchema } from "@/validators/auth.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

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

export default function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "user",
      countryCode: "+91",
    },
  });

  const selectedRole = watch("role");
  const selectedCode = watch("countryCode");

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const { confirmPassword, ...payload } = data;
      const response = await api.post("/auth/register", payload);
      return response.data;
    },
    onSuccess: (_, variables) => {
      router.push(`/verify-email?email=${encodeURIComponent(variables.email)}`);
    },
    onError: (error: any) => {
      setServerError(error.response?.data?.message || "Registration failed. Please try again.");
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    setServerError(null);
    registerMutation.mutate(data);
  };

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/google`;
  };

  const eyeOpen = (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const eyeOff = (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
      />
    </svg>
  );

  return (
    <div className="w-full bg-white p-6 sm:p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-sm font-semibold text-red-600 animate-in fade-in zoom-in duration-300">{serverError}</div>}

        {/* Role Toggle */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 ml-1">I am a</label>
          <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl">
            {(["user", "doctor"] as const).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setValue("role", role)}
                className={`flex-1 h-11 flex items-center justify-center gap-2 rounded-xl font-bold text-sm transition-all ${selectedRole === role ? "bg-slate-950 text-white shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
                {role === "user" ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                    />
                  </svg>
                )}
                {role === "user" ? "User" : "Doctor"}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 ml-1">Full Name</label>
          <input
            type="text"
            {...register("name")}
            placeholder="Name"
            className="w-full h-14 px-5 rounded-2xl border-none bg-slate-50 text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-slate-950 transition-all outline-none"
          />
          {errors.name && <p className="text-xs font-semibold text-red-500 mt-2 ml-1">{errors.name.message}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 ml-1">Email</label>
          <input
            type="email"
            {...register("email")}
            placeholder="Enter your email"
            className="w-full h-14 px-5 rounded-2xl border-none bg-slate-50 text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-slate-950 transition-all outline-none"
          />
          {errors.email && <p className="text-xs font-semibold text-red-500 mt-2 ml-1">{errors.email.message}</p>}
        </div>

        {/* Phone + Country Code */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 ml-1">Phone Number</label>
          <div className="flex gap-2">
            {/* Country Code Selector */}
            <div className="relative">
              <select
                value={selectedCode}
                onChange={(e) => setValue("countryCode", e.target.value)}
                className="h-14 pl-3 pr-8 rounded-2xl border-none bg-slate-50 text-slate-900 font-bold text-sm appearance-none focus:ring-2 focus:ring-slate-950 transition-all outline-none cursor-pointer">
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>
              <svg className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
            {/* Phone Input */}
            <input
              type="tel"
              {...register("phone")}
              placeholder="Phone Number"
              className="flex-1 h-14 px-5 rounded-2xl border-none bg-slate-50 text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-slate-950 transition-all outline-none"
            />
          </div>
          {errors.phone && <p className="text-xs font-semibold text-red-500 mt-2 ml-1">{errors.phone.message}</p>}
          {errors.countryCode && <p className="text-xs font-semibold text-red-500 mt-1 ml-1">{errors.countryCode.message}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 ml-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              {...register("password")}
              placeholder="••••••••"
              className="w-full h-[60px] pl-6 pr-12 rounded-[24px] border border-slate-100 bg-slate-50/50 text-slate-900 font-medium placeholder:text-slate-300 focus:ring-2 focus:ring-slate-950 transition-all outline-none"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors">
              {showPassword ? eyeOpen : eyeOff}
            </button>
          </div>
          {errors.password && <p className="text-[11px] font-semibold text-red-500 mt-2 ml-2">{errors.password.message}</p>}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 ml-1">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              {...register("confirmPassword")}
              placeholder="••••••••"
              className="w-full h-[60px] pl-6 pr-12 rounded-[24px] border border-slate-100 bg-slate-50/50 text-slate-900 font-medium placeholder:text-slate-300 focus:ring-2 focus:ring-slate-950 transition-all outline-none"
            />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors">
              {showConfirmPassword ? eyeOpen : eyeOff}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-[11px] font-semibold text-red-500 mt-2 ml-2">{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={registerMutation.isPending}
          className="w-full h-14 mt-6 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all shadow-md active:scale-[0.98] disabled:opacity-70 flex items-center justify-center">
          {registerMutation.isPending ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Create Account"}
        </button>
      </form>

      <div className="relative my-6 flex items-center justify-center">
        <hr className="w-full border-slate-100" />
        <span className="absolute bg-white px-4 text-xs font-bold text-slate-300 uppercase tracking-widest">OR</span>
      </div>

      <button
        onClick={handleGoogleLogin}
        type="button"
        className="w-full h-14 bg-white border-2 border-slate-100 hover:bg-slate-50 hover:border-slate-200 text-slate-700 font-bold rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3">
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Sign up with Google
      </button>

      <p className="text-center text-sm font-medium text-slate-500 mt-8">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-slate-950 hover:underline">
          Log in here
        </Link>
      </p>
    </div>
  );
}
