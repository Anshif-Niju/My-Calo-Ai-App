"use client";

import { api } from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import CalorieRing from "./CalorieRing";
import FoodScanModal from "./FoodScanModal";
import MealHistoryItem from "./MealHistoryItem";

type MealType = "breakfast" | "lunch" | "dinner" | "custom";
type Tab = "today" | "lastday";

const MEAL_SECTIONS: { type: MealType; label: string; icon: string }[] = [
  { type: "breakfast", label: "Breakfast", icon: "🌅" },
  { type: "lunch", label: "Lunch", icon: "☀️" },
  { type: "dinner", label: "Dinner", icon: "🌙" },
  { type: "custom", label: "Custom", icon: "➕" },
];

export default function HomeScreen() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split("T")[0];
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [expandedMeal, setExpandedMeal] = useState<MealType | null>(null);
  const [scanModal, setScanModal] = useState<{ open: boolean; mealType: MealType }>({
    open: false,
    mealType: "breakfast",
  });

  // Today dashboard
  const { data: todayData } = useQuery({
    queryKey: ["dashboard", today],
    queryFn: async () => {
      const res = await api.get(`/nutrition/dashboard?date=${today}`);
      return res.data;
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Last day data
  const { data: lastDayData } = useQuery({
    queryKey: ["lastday"],
    queryFn: async () => {
      const res = await api.get("/nutrition/last-day");
      return res.data;
    },
    staleTime: 300000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (mealId: string) => {
      await api.delete(`/nutrition/meal/${mealId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", today] });
      toast.success("Meal removed");
    },
  });

  const activeData = activeTab === "today" ? todayData : lastDayData;
  const rawConsumed = activeData?.consumed || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

  const consumed = {
    calories: Math.round(rawConsumed.calories),
    protein: Math.round(rawConsumed.protein * 10) / 10,
    carbs: Math.round(rawConsumed.carbs * 10) / 10,
    fat: Math.round(rawConsumed.fat * 10) / 10,
    fiber: Math.round(rawConsumed.fiber * 10) / 10,
  };

  const targets = activeData?.user?.dailyTargets || { calories: 2000, protein: 150, carbs: 200, fat: 65 };
  const meals = activeData?.meals || { breakfast: [], lunch: [], dinner: [], custom: [] };
  const status = activeData?.status || "under";

  const isOver = status === "over";
  const isHit = status === "hit";

  const mealHasEntry = (type: MealType) => (type === "custom" ? false : (meals[type] || []).length > 0);
  const allMeals = [...(meals.breakfast || []), ...(meals.lunch || []), ...(meals.dinner || []), ...(meals.custom || [])].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const hasLastDayData = lastDayData?.hasData !== false && lastDayData?.date;

  return (
    <div className="min-h-screen pb-24 lg:pb-10 lg:pt-20 bg-slate-50 font-sans">
      <div className="max-w-lg mx-auto px-5 pt-6 lg:max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 text-xl">🥗</div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Good Morning</p>
              <h1 className="text-xl font-black text-slate-900 leading-none">MyCalo AI</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white rounded-full shadow-sm border border-slate-100">
            <span className="text-sm font-bold text-slate-600">Streak</span>
            <span className="text-base">🔥</span>
            <span className="text-sm font-black text-orange-500">{todayData?.totalMeals || 0}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 p-1.5 bg-white rounded-[20px] w-fit shadow-sm border border-slate-100">
          <button
            onClick={() => setActiveTab("today")}
            className="px-6 py-2.5 rounded-[16px] text-sm font-bold transition-all"
            style={{
              background: activeTab === "today" ? "#1e293b" : "transparent",
              color: activeTab === "today" ? "#ffffff" : "#64748b",
            }}>
            Today
          </button>
          <button
            onClick={() => setActiveTab("lastday")}
            className="px-6 py-2.5 rounded-[16px] text-sm font-bold transition-all"
            style={{
              background: activeTab === "lastday" ? "#1e293b" : "transparent",
              color: activeTab === "lastday" ? "#ffffff" : "#64748b",
            }}>
            {hasLastDayData ? lastDayData.date : "Last Day"}
          </button>
        </div>

        {activeTab === "lastday" && !hasLastDayData && (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-[32px] border border-slate-100 shadow-sm">
            <span className="text-5xl mb-4">📋</span>
            <p className="text-slate-900 font-bold text-lg">No previous data</p>
            <p className="text-sm mt-2 text-slate-500">Start logging meals today to see history here.</p>
          </div>
        )}

        {(activeTab === "today" || hasLastDayData) && (
          <>
            {/* Main calorie card Section*/}

            <div className="bg-white rounded-[32px] p-6 mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden">
              <div className="flex items-center justify-between relative z-10">
                <div className="flex-1">
                  {isOver ? (
                    <>
                      <p className="text-5xl font-black text-red-500 tracking-tighter">+{(consumed.calories - targets.calories).toLocaleString()}</p>
                      <p className="text-sm font-bold text-red-400 mt-1 uppercase tracking-wider">over limit ⚠️</p>
                    </>
                  ) : (
                    <>
                      <p className="text-5xl font-black text-slate-900 tracking-tighter">{Math.max(0, targets.calories - consumed.calories).toLocaleString()}</p>
                      <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-wider">{isHit ? "Goal reached! 🎉" : "Kcal Remaining"}</p>
                    </>
                  )}
                  <div className="mt-4 inline-block px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-[11px] font-bold text-slate-500">
                      <span className="text-slate-900">{consumed.calories}</span> / {targets.calories} consumed
                    </p>
                  </div>
                </div>
                <div className="drop-shadow-md">
                  <CalorieRing consumed={consumed.calories} target={targets.calories} size={110} isOver={isOver} />
                </div>
              </div>
            </div>

            {/* Top Macros Sectiom */}

            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { label: "Protein", c: consumed.protein, t: targets.protein, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
                { label: "Carbs", c: consumed.carbs, t: targets.carbs, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
                { label: "Fat", c: consumed.fat, t: targets.fat, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" },
              ].map((macro) => {
                const percent = Math.min(100, Math.round((macro.c / macro.t) * 100));
                const remaining = macro.t - macro.c;
                const isOver = remaining < 0;

                const absRemaining = Math.abs(Math.round(remaining));

                return (
                  <div key={macro.label} className={`p-4 rounded-[24px] ${macro.bg} ${macro.border} border flex flex-col justify-between shadow-sm transition-transform hover:-translate-y-1 duration-300`}>
                    <div className="flex items-start justify-between mb-3">
                      <span className={`text-[11px] font-black uppercase tracking-wider ${macro.color} opacity-80 mt-1`}>{macro.label}</span>
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-[0_2px_8px_rgb(0,0,0,0.04)] shrink-0">
                        <span className={`text-[10px] font-black ${macro.color}`}>{percent}%</span>
                      </div>
                    </div>
                    <div className="mb-3">
                      <p className={`text-3xl font-black ${isOver ? "text-red-500" : macro.color} leading-none tracking-tight`}>
                        {isOver ? "+" : ""}
                        {absRemaining}
                        <span className="text-[12px] ml-0.5 font-bold">gram</span>
                      </p>
                      <p className={`text-[10px] font-bold mt-1 opacity-80 ${isOver ? "text-red-400" : macro.color}`}>{isOver ? "over limit" : "remaining"}</p>
                    </div>

                    <div className={`pt-2.5 border-t ${macro.border} border-opacity-60`}>
                      <p className="text-[10px] font-bold text-black">
                        <span className={isOver ? "text-red-500" : macro.color}>{macro.c}g</span> / <span className={macro.color}> {macro.t}g</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Meal Accordion sections */}
            <div className="mb-8 space-y-3">
              <h2 className="text-[13px] font-black uppercase tracking-wider mb-4 text-slate-800 ml-2">{activeTab === "today" ? "Log Meals" : "Meals"}</h2>
              {MEAL_SECTIONS.map(({ type, label, icon }) => {
                const mealItems = meals[type] || [];
                const mealCalories = mealItems.reduce((s: number, m: any) => s + m.calories, 0);
                const isExpanded = expandedMeal === type;

                return (
                  <div key={type} className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden transition-all duration-300">
                    <div className="flex items-center gap-3 p-4">
                      <button onClick={() => setExpandedMeal(isExpanded ? null : type)} className="flex items-center gap-4 flex-1 text-left">
                        <div className="w-12 h-12 rounded-[16px] bg-slate-50 border border-slate-100 flex items-center justify-center text-xl shrink-0">{icon}</div>
                        <div>
                          <p className="text-base font-bold text-slate-900">{label}</p>
                          <p className="text-[12px] font-medium text-slate-500 mt-0.5">{mealItems.length > 0 ? `${mealItems.length} item${mealItems.length > 1 ? "s" : ""} · ${mealCalories} kcal` : "Nothing logged"}</p>
                        </div>
                      </button>

                      {/* + button */}
                      {activeTab === "today" && (
                        <button
                          disabled={mealHasEntry(type)}
                          onClick={() => {
                            if (!mealHasEntry(type)) setScanModal({ open: true, mealType: type });
                          }}
                          className={`w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 transition-all ${
                            mealHasEntry(type) ? "bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed" : "bg-[#f97316] text-white shadow-md hover:bg-[#ea580c] hover:-translate-y-0.5"
                          }`}>
                          {mealHasEntry(type) ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                          )}
                        </button>
                      )}

                      <svg className={`w-4 h-4 transition-transform text-slate-400 ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>

                    {isExpanded && mealItems.length > 0 && (
                      <div className="px-4 pb-4 pt-1 space-y-2 border-t border-slate-50">
                        {mealItems.map((meal: any) => (
                          <MealHistoryItem key={meal._id} {...meal} onDelete={activeTab === "today" ? () => deleteMutation.mutate(meal._id) : undefined} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Today's Full History List */}

            {allMeals.length > 0 && (
              <div className="mb-8">
                <h2 className="text-[13px] font-black uppercase tracking-wider mb-4 text-slate-800 ml-2">{activeTab === "today" ? "Today's History" : `${lastDayData?.date} History`}</h2>
                <div className="space-y-3">
                  {allMeals.map((meal: any) => (
                    <MealHistoryItem key={meal._id} {...meal} onDelete={activeTab === "today" ? () => deleteMutation.mutate(meal._id) : undefined} />
                  ))}
                </div>
              </div>
            )}

            {/* Daily Summary  Section */}

            <div className="mb-8 p-6 rounded-[32px] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h2 className="text-[13px] font-black uppercase tracking-wider mb-5 text-slate-800">Daily Summary</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Calories", consumed: consumed.calories, target: targets.calories, unit: "kcal", color: "#059669" }, // Orange
                  { label: "Protein", consumed: Number(consumed.protein.toFixed(1)), target: targets.protein, unit: "g", color: "#059669" }, // Purple
                  { label: "Carbs", consumed: Number(consumed.carbs.toFixed(1)), target: targets.carbs, unit: "g", color: "#059669" }, // Emerald
                  { label: "Fats", consumed: Number(consumed.fat.toFixed(1)), target: targets.fat, unit: "g", color: "#059669" }, // Dark Orange
                ].map(({ label, consumed: c, target: t, unit, color }) => {
                  const isOver = c > t;
                  const percentage = Math.min(Math.round((c / t) * 100), 100);
                  const radius = 28;
                  const circumference = 2 * Math.PI * radius;
                  const strokeDash = (percentage / 100) * circumference;

                  return (
                    <div key={label} className="p-4 rounded-[20px] flex items-center gap-4 bg-slate-50 border border-slate-100 transition-hover hover:bg-slate-100/50">
                      {/* Mini ring (Light Theme) */}
                      <div className="relative shrink-0" style={{ width: 64, height: 64 }}>
                        <svg width="64" height="64" viewBox="0 0 64 64">
                          <circle cx="32" cy="32" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="6" />
                          <circle
                            cx="32"
                            cy="32"
                            r={radius}
                            fill="none"
                            stroke={isOver ? "#ef4444" : color}
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={`${strokeDash} ${circumference}`}
                            transform="rotate(-90 32 32)"
                            style={{ transition: "stroke-dasharray 0.8s ease" }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[13px] font-black" style={{ color: isOver ? "#ef4444" : color }}>
                            {percentage}%
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-500">{label}</p>
                        <p className="text-[12px] text-slate-400 font-medium">
                          Goal: <span className="text-[18px] font-bold mt-0.5  text-black">{t}</span>
                          <span className=" text-black text-[14px]"> {unit}</span>
                        </p>
                        <p className={`text-[15px]  mt-0.5 text-green-800`}>
                          <span className="text-[12px] text-slate-400 font-medium">Consumed: </span>
                          <span className=" text-slate-800 font-medium text-[14px]"> {c}</span>
                          <span className=" text-black font-medium text-[12px]"> {unit}</span>
                        </p>
                        <p className={`text-[12px] font-semibold mt-1 ${isOver ? "text-red-400" : "text-green-700"}`}>{isOver ? `+${Number((c - t).toFixed(1))} ${unit} over limit` : `${Number((t - c).toFixed(1))}${unit} remaining`}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Empty state */}
            {activeTab === "today" && allMeals.length === 0 && (
              <div className="flex flex-col items-center py-12 text-center bg-white rounded-[32px] border border-slate-100 border-dashed">
                <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-3xl mb-4">📸</div>
                <p className="text-slate-900 font-bold text-lg">Scan your first meal</p>
                <p className="text-[13px] mt-1.5 text-slate-500 font-medium max-w-[200px]">Tap the orange + button to let AI track your calories</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Scan modal */}
      {scanModal.open && (
        <FoodScanModal
          mealType={scanModal.mealType}
          date={today}
          onClose={() => setScanModal({ open: false, mealType: "breakfast" })}
          onAdded={() => {
            queryClient.invalidateQueries({ queryKey: ["dashboard", today] });
            setScanModal({ open: false, mealType: "breakfast" });
          }}
        />
      )}
    </div>
  );
}
