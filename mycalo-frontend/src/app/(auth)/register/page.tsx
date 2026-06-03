import RegisterForm from "@/components/auth/RegisterForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account | MyCalo AI",
  description: "Join MyCalo AI and start your personalized health journey.",
};

export default function RegisterPage() {
  return (
    <div className="w-full flex flex-col items-center">
      {/* Branding Header matching your clean top area */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-12 h-12 bg-slate-950 rounded-[18px] flex items-center justify-center mb-4 shadow-lg shadow-slate-900/20">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-950 tracking-tight">Join MyCalo AI</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Create your health companion</p>
      </div>

      <RegisterForm />
    </div>
  );
}
