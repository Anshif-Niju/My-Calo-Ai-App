"use client";

import { logoutAction } from "@/store/slices/auth.slice";
import { healthProfileSchema } from "@/validators/onboarding.schema";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {api} from '@/lib/axios'
import {useDispatch} from 'react-redux'

const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Sedentary", desc: "Little or no exercise" },
  { value: "light", label: "Light", desc: "1–3 days/week" },
  { value: "moderate", label: "Moderate", desc: "3–5 days/week" },
  { value: "active", label: "Active", desc: "6–7 days/week" },
];

const DISEASES = ["Diabetes", "Hypertension", "Heart Disease", "Obesity", "Thyroid", "None"];

export default function HealthProfileForm() {
    const dispatch = useDispatch();

  const router = useRouter();
  const [form, setForm] = useState({
    height: "",
    weight: "",
    age: "",
    gender: "male",
    activityLevel: "moderate",
    diseases: [] as string[],
    dob: "",
  });

  const set = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dobValue = e.target.value;
    setForm((p) => {
      let calculatedAge = "";
      if (dobValue) {
        const birthDate = new Date(dobValue);
        const today = new Date();
        let calculated = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          calculated--;
        }
        calculatedAge = calculated >= 0 ? calculated.toString() : "";
      }
      return {
        ...p,
        dob: dobValue,
        age: calculatedAge,
      };
    });
  };

  const toggleDisease = (d: string) => {
    setForm((p) => ({
      ...p,
      diseases: d === "None" ? ["None"] : p.diseases.includes(d) ? p.diseases.filter((x) => x !== d) : [...p.diseases.filter((x) => x !== "None"), d],
    }));
  };

  const h = parseFloat(form.height);
  const w = parseFloat(form.weight);
  const a = parseFloat(form.age);
  const bmr = h && w && a ? (form.gender === "male" ? Math.round(88.362 + 13.397 * w + 4.799 * h - 5.677 * a) : Math.round(447.593 + 9.247 * w + 3.098 * h - 4.33 * a)) : null;

  const handleNext = () => {
    const result = healthProfileSchema.safeParse({
      ...form,
      height: parseFloat(form.height),
      weight: parseFloat(form.weight),
      age: parseFloat(form.age),
    });

    if (!result.success) {
      const firstError = result.error.issues[0].message;
      toast.error(firstError);
      return;
    }
    sessionStorage.setItem("healthProfile", JSON.stringify(form));
    router.replace("/onboarding/user/goal");
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");

      dispatch(logoutAction());

      router.replace("/login");
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex gap-1.5">
            <div className="w-8 h-1.5 rounded-full bg-slate-950" />
            <div className="w-4 h-1.5 rounded-full bg-slate-200" />
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Step 1 of 2</span>
        </div>

        {/* Heading */}
        <div className="mb-6">
          <h1 className="text-3xl font-black text-slate-950 mb-1">Your Health Profile</h1>
          <p className="text-sm font-medium text-slate-400">We'll calculate your personalized nutrition targets.</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 sm:p-8 space-y-6">
          {/* Gender */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 ml-1">Gender</label>
            <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl">
              {["male", "female"].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => set("gender", g)}
                  className={`flex-1 h-11 flex items-center justify-center gap-2 rounded-xl font-bold text-sm transition-all ${form.gender === g ? "bg-slate-950 text-white shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
                  {g === "male" ? " Male" : " Female"}
                </button>
              ))}
            </div>
          </div>

          {/* Height / Weight */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "height", label: "Height", unit: "cm", placeholder: "0" },
              { key: "weight", label: "Weight", unit: "kg", placeholder: "0" },
            ].map(({ key, label, unit, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 ml-1">{label}</label>
                <div className="relative">
                  <input
                    type="number"
                    value={form[key as keyof typeof form] as string}
                    onChange={(e) => set(key, e.target.value)}
                    placeholder={placeholder}
                    className="w-full h-14 pl-4 pr-8 rounded-2xl bg-slate-50 text-slate-900 font-bold text-base outline-none focus:ring-2 focus:ring-slate-950 transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{unit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Date of Birth / Calculated Age */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 ml-1">Date of Birth</label>
              <input
                type="date"
                value={form.dob}
                onChange={handleDobChange}
                max={new Date().toISOString().split("T")[0]}
                className="w-full h-14 px-4 rounded-2xl bg-slate-50 text-slate-900 font-bold text-base outline-none focus:ring-2 focus:ring-slate-950 transition-all cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 ml-1">Calculated Age</label>
              <div className="w-full h-14 px-4 rounded-2xl bg-slate-100/70 border border-slate-100 text-slate-500 font-black text-base flex items-center justify-between">
                <span>{form.age || "—"}</span>
                <span className="text-xs font-bold text-slate-400">yrs</span>
              </div>
            </div>
          </div>

          {/* Activity Level */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 ml-1">Activity Level</label>
            <div className="grid grid-cols-2 gap-2">
              {ACTIVITY_LEVELS.map((al) => (
                <button
                  key={al.value}
                  type="button"
                  onClick={() => set("activityLevel", al.value)}
                  className={`p-3 rounded-2xl text-left transition-all border ${form.activityLevel === al.value ? "bg-slate-950 border-slate-950" : "bg-slate-50 border-transparent hover:border-slate-200"}`}>
                  <p className={`font-bold text-sm ${form.activityLevel === al.value ? "text-white" : "text-slate-700"}`}>{al.label}</p>
                  <p className={`text-xs mt-0.5 ${form.activityLevel === al.value ? "text-slate-400" : "text-slate-400"}`}>{al.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Health Conditions */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 ml-1">Health Conditions</label>
            <div className="flex flex-wrap gap-2">
              {DISEASES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDisease(d)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${form.diseases.includes(d) ? "bg-slate-950 border-slate-950 text-white" : "bg-slate-50 border-transparent text-slate-500 hover:border-slate-200"}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* BMR preview */}
          {bmr && (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Estimated BMR</p>
                <p className="text-2xl font-black text-slate-950">
                  {bmr} <span className="text-sm font-medium text-slate-400">kcal/day</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center text-xl">🔥</div>
            </div>
          )}

          {/* CTA */}
          <button onClick={handleNext} className="w-full h-14 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center">
            Continue →
          </button>

          <button onClick={handleLogout} className="w-full h-12 text-slate-400 font-semibold text-sm hover:text-slate-600 transition-colors">
            Logout & Come Back Later
          </button>
        </div>
      </div>
    </div>
  );
}
