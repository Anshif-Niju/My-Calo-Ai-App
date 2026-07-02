"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/axios";
import { setTwoFactorRequired, setUser } from "@/store/slices/auth.slice";
import { getRedirectPath } from "@/utils/getRedirectPath";
import { getErrorMessage } from "@/utils/errorHandler";
import { LoginFormData, RegisterFormData, loginSchema, registerSchema } from "@/validators/auth.schema";

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

interface AuthContainerProps {
  initialMode: "login" | "register";
}

export default function AuthContainer({ initialMode }: AuthContainerProps) {
  const router = useRouter();
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState<"login" | "register">(initialMode);
  const [registerStep, setRegisterStep] = useState<1 | 2 | 3>(1);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);


  useEffect(() => {
    setActiveTab(initialMode);
    if (initialMode === "register") {
      setRegisterStep(1);
    }
  }, [initialMode]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === "/register") {
        setActiveTab("register");
        setRegisterStep(1);
      } else if (path === "/login") {
        setActiveTab("login");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Safe navigation function that runs slide animation and pushes state without layout unmount
  const navigateTo = (mode: "login" | "register") => {
    setActiveTab(mode);
    if (mode === "register") {
      setRegisterStep(1);
    }
    window.history.pushState(null, "", `/${mode}`);
  };

  // 1. Login Form Setup
  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });



  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await api.post("/auth/login", data);

      return response.data;
    },
    onSuccess: (data) => {
      console.log(data)
      if (data.requiresTwoFactor) {
        setIsRedirecting(true);
        dispatch(setTwoFactorRequired({ tempToken: data.tempToken }));
        router.replace("/two-factor");
        return;
      }
      dispatch(setUser({ user: data.user }));
      setIsRedirecting(true);
      router.replace(getRedirectPath(data.user));
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, "Something went wrong. Please try again later"));
    },
  });

  const onLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  // 2. Register Form Setup
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

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/auth/google`;
  };

  const handleGithubLogin = () => {
    toast.info("GitHub Login is currently not configured for this project.");
  };

  const renderLoginFormFields = () => {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 tracking-tight">Welcome back</h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">Sign in to your workspace</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleGoogleLogin}
            type="button"
            className="flex-1 h-11 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-xs shadow-sm cursor-pointer">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>
          <button
            onClick={handleGithubLogin}
            type="button"
            className="flex-1 h-11 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-xs shadow-sm cursor-pointer">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z"
              />
            </svg>
            GitHub
          </button>
        </div>
        <div className="relative my-2 flex items-center justify-center">
          <hr className="w-full border-slate-100" />
          <span className="absolute bg-white px-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">or sign in with email</span>
        </div>
        <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-3.5">
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1 ml-0.5">Email address</label>
            <input
              type="email"
              {...loginRegister("email")}
              placeholder="Enter Your Email"
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 transition-all outline-none text-sm"
            />
            {loginErrors.email && <p className="text-[10px] font-semibold text-red-500 mt-1 ml-0.5">{loginErrors.email.message}</p>}
          </div>
          <div>
            <div className="flex justify-between items-center mb-1 ml-0.5">
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">Password</label>
              <a href="/forgot-password" className="text-[10px] font-bold text-slate-400 hover:text-slate-950 transition-colors">
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <input
                type={showLoginPassword ? "text" : "password"}
                {...loginRegister("password")}
                placeholder="Enter your password"
                className="w-full h-11 pl-4 pr-10 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 transition-all outline-none text-sm"
              />
              <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                {showLoginPassword ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                )}
              </button>
            </div>
            {loginErrors.password && <p className="text-[10px] font-semibold text-red-500 mt-1 ml-0.5">{loginErrors.password.message}</p>}
          </div>
          <button
            type="submit"
            disabled={loginMutation.isPending || isRedirecting}
            className="w-full h-11 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-[0_4px_12px_rgba(15,23,42,0.15)] active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 text-xs cursor-pointer">
            {loginMutation.isPending || isRedirecting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Sign in to workspace
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </>
            )}
          </button>
        </form>
        <p className="text-center text-xs font-medium text-slate-500 pt-2">
          Don&apos;t have a workspace?{" "}
          <button onClick={() => navigateTo("register")} className="font-bold text-slate-950 hover:underline cursor-pointer">
            Create one free
          </button>
        </p>
      </div>
    );
  };

  const renderRegisterFormFields = () => {
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
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                    />
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
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                        />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                        />
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
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                        />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                        />
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
          <button onClick={() => navigateTo("login")} className="font-bold text-slate-950 hover:underline cursor-pointer">
            Log in here
          </button>
        </p>
      </div>
    );
  };

  return (
    <div className="w-full flex justify-center items-center py-4">
      <div className="hidden md:flex w-full max-w-[1000px] h-[660px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.06)] border border-slate-100 relative overflow-hidden flex-row transition-all duration-300">
        <div
          className={`absolute top-0 bottom-0 w-1/2 bg-slate-950 text-white z-20 flex flex-col justify-between p-12 transition-all duration-700 ease-in-out ${activeTab === "login" ? "left-0 transform translate-x-0" : "left-0 transform translate-x-full"}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <span className="font-sans font-bold tracking-tight text-lg">MyCalo AI</span>
          </div>
          <div className="relative py-4 flex flex-col items-center justify-center">
            <div className="absolute w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl -z-10" />
            <div className="w-72 bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-[0_15px_30px_rgba(0,0,0,0.3)] space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Calories Tracker</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">Today</span>
              </div>
              <div className="flex flex-col items-center py-2 relative">
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle cx="56" cy="56" r="48" className="stroke-slate-800" strokeWidth="6" fill="transparent" />
                  <circle cx="56" cy="56" r="48" className="stroke-emerald-400 transition-all duration-1000" strokeWidth="8" fill="transparent" strokeDasharray={301.6} strokeDashoffset={301.6 * (1 - 1450 / 2200)} strokeLinecap="round" />
                </svg>
                <div className="absolute flex flex-col items-center justify-center inset-0">
                  <span className="text-lg font-bold text-white font-mono">1,450</span>
                  <span className="text-[10px] text-slate-400 font-medium">/ 2,200 kcal</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-slate-400">
                <div className="p-1.5 bg-slate-800/40 rounded-lg">
                  <p className="text-emerald-400">180g</p>
                  <p className="text-[8px] text-slate-500">Carbs</p>
                </div>
                <div className="p-1.5 bg-slate-800/40 rounded-lg">
                  <p className="text-sky-400">110g</p>
                  <p className="text-[8px] text-slate-500">Protein</p>
                </div>
                <div className="p-1.5 bg-slate-800/40 rounded-lg">
                  <p className="text-amber-400">45g</p>
                  <p className="text-[8px] text-slate-500">Fat</p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight leading-tight">Manage your health with clarity.</h2>
              <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-[340px]">Everything you need to track, analyze, and optimize your nutrition and health goals — in one place.</p>
            </div>
            <ul className="space-y-2 text-xs font-semibold text-slate-300">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 bg-white/10 text-white rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
                Real-time calorie & macro logging
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 bg-white/10 text-white rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
                AI-powered personalized advice
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 bg-white/10 text-white rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
                Smart analytics and weekly reports
              </li>
            </ul>
          </div>
        </div>
        <div
          className={`w-1/2 h-full flex flex-col justify-center px-12 md:px-14 absolute right-0 top-0 transition-all duration-700 ease-in-out ${activeTab === "login" ? "opacity-100 translate-x-0 pointer-events-auto z-10" : "opacity-0 translate-x-12 pointer-events-none z-0"}`}>
          {renderLoginFormFields()}
        </div>
        <div
          className={`w-1/2 h-full flex flex-col justify-center px-12 md:px-14 absolute left-0 top-0 transition-all duration-700 ease-in-out ${activeTab === "register" ? "opacity-100 translate-x-0 pointer-events-auto z-10" : "opacity-0 -translate-x-12 pointer-events-none z-0"}`}>
          {renderRegisterFormFields()}
        </div>
      </div>
      <div className="md:hidden w-full max-w-[400px] flex flex-col items-center px-2">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-slate-950 rounded-[18px] flex items-center justify-center mb-4 shadow-lg shadow-slate-900/20">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 10c0-4.42-3.58-8-8-8s-8 3.58-8 8c0 4.42 3.58 8 8 8s8-3.58 8-8zM12 4c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6 2.69-6 6-6z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-950 tracking-tight">{activeTab === "login" ? "MyCalo AI" : "Join MyCalo AI"}</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">{activeTab === "login" ? "Welcome back, let's track!" : "Create your health companion"}</p>
        </div>
        <div className="w-full bg-white p-6 sm:p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative z-20">{activeTab === "login" ? renderLoginFormFields() : renderRegisterFormFields()}</div>
      </div>
    </div>
  );
}



