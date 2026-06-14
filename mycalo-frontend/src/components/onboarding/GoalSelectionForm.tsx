"use client";

import { api } from "@/lib/axios";
import { updateUser } from "@/store/slices/auth.slice";
import { getRedirectPath } from "@/utils/getRedirectPath";
import { goalSchema } from "@/validators/onboarding.schema";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";

const GOALS = [
  { value: "weight_loss", label: "Lose Weight", icon: "🔥", desc: "Calorie deficit — burn more than you eat" },
  { value: "weight_gain", label: "Gain Weight", icon: "💪", desc: "Calorie surplus — build muscle and mass" },
  { value: "maintain", label: "Stay Fit", icon: "⚖️", desc: "Maintain current weight and health" },
];

export default function GoalSelectionForm() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [goalType, setGoalType] = useState("maintain");
  const [targetWeight, setTargetWeight] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const result = goalSchema.safeParse({
        type: goalType,
        targetWeight: targetWeight ? parseFloat(targetWeight) : undefined,
      });

      if (!result.success) {
        throw new Error(result.error.issues[0].message);
      }
      const healthProfile = JSON.parse(sessionStorage.getItem("healthProfile") || "{}");
      const response = await api.post("/onboarding/user-verification", {
        ...healthProfile,
        height: parseFloat(healthProfile.height),
        weight: parseFloat(healthProfile.weight),
        age: parseFloat(healthProfile.age),
        goalType,
        targetWeight: parseFloat(targetWeight) || parseFloat(healthProfile.weight),
      });
      return response.data;
    },
    onSuccess: async () => {
      sessionStorage.removeItem("healthProfile");

      try {
        // Get latest user from backend
        const res = await api.get("/auth/me");

        dispatch(updateUser(res.data.user));

        toast.success("Profile setup complete! 🎉");

        setIsRedirecting(true);

        router.replace(getRedirectPath(res.data.user));
      } catch (error) {
        toast.error("Failed to sync profile.");
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Something went wrong");
    },
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-950 transition-colors shadow-sm">
            ←
          </button>
          <div className="flex gap-1.5">
            <div className="w-4 h-1.5 rounded-full bg-slate-200" />
            <div className="w-8 h-1.5 rounded-full bg-slate-950" />
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Step 2 of 2</span>
        </div>

        {/* Heading */}
        <div className="mb-6">
          <h1 className="text-3xl font-black text-slate-950 mb-1">What's Your Goal?</h1>
          <p className="text-sm font-medium text-slate-400">We'll tailor your daily calorie and macro targets.</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 sm:p-8 space-y-4">
          {/* Goal options */}
          {GOALS.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => setGoalType(g.value)}
              className={`w-full p-4 rounded-2xl text-left transition-all border flex items-center gap-4 ${goalType === g.value ? "bg-slate-950 border-slate-950" : "bg-slate-50 border-transparent hover:border-slate-200"}`}>
              <span className="text-2xl">{g.icon}</span>
              <div className="flex-1">
                <p className={`font-bold text-sm ${goalType === g.value ? "text-white" : "text-slate-700"}`}>{g.label}</p>
                <p className={`text-xs mt-0.5 ${goalType === g.value ? "text-slate-400" : "text-slate-400"}`}>{g.desc}</p>
              </div>
              {goalType === g.value && (
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0">
                  <span className="text-slate-950 text-xs font-black">✓</span>
                </div>
              )}
            </button>
          ))}

          {/* Target weight */}
          {goalType !== "maintain" && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 ml-1">Target Weight</label>
              <div className="relative">
                <input
                  type="number"
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(e.target.value)}
                  placeholder="e.g. 65"
                  className="w-full h-14 pl-5 pr-12 rounded-2xl bg-slate-50 text-slate-900 font-bold text-base outline-none focus:ring-2 focus:ring-slate-950 transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">kg</span>
              </div>
            </div>
          )}

          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || isRedirecting}
            className="w-full h-14 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all shadow-md active:scale-[0.98] disabled:opacity-70 flex items-center justify-center">
            {mutation.isPending || isRedirecting ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Complete Setup 🎉"}
          </button>
        </div>
      </div>
    </div>
  );
}
