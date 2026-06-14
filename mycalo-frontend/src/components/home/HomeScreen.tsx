"use client";

import { api } from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import CalorieRing from "./CalorieRing";
import FoodScanModal from "./FoodScanModal";
import MacroCard from "./MacroCard";
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
  const { data: todayData, isLoading: todayLoading } = useQuery({
    queryKey: ["dashboard", today],
    queryFn: async () => {
      const res = await api.get(`/nutrition/dashboard?date=${today}`);
      return res.data;
    },
    staleTime: 60 * 1000, // 1 minute
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

  // Check which meal types have been logged (for disabling add button)
  const mealHasEntry = (type: MealType) => (type === "custom" ? false : (meals[type] || []).length > 0);

  const allMeals = [...(meals.breakfast || []), ...(meals.lunch || []), ...(meals.dinner || []), ...(meals.custom || [])].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const hasLastDayData = lastDayData?.hasData !== false && lastDayData?.date;

  return (
    <div className="min-h-screen pb-24 lg:pb-10 lg:pt-20" style={{ background: "var(--bg)" }}>
      <div className="max-w-lg mx-auto px-4 pt-5 lg:max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🥗</span>
            <span className="text-xl font-black" style={{ color: "var(--text)", fontFamily: "var(--font-head)" }}>
              MyCalo AI
            </span>
          </div>
          {/* Streak / total meals today */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "var(--surface)" }}>
            <span className="text-base">🔥</span>
            <span className="text-sm font-black" style={{ color: "var(--lime)" }}>
              {todayData?.totalMeals || 0}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-2xl w-fit" style={{ background: "var(--surface)" }}>
          <button
            onClick={() => setActiveTab("today")}
            className="px-5 py-2 rounded-xl text-sm font-bold transition-all"
            style={{
              background: activeTab === "today" ? "var(--bg)" : "transparent",
              color: activeTab === "today" ? "var(--text)" : "var(--text3)",
            }}>
            Today
          </button>
          <button
            onClick={() => setActiveTab("lastday")}
            className="px-5 py-2 rounded-xl text-sm font-bold transition-all"
            style={{
              background: activeTab === "lastday" ? "var(--bg)" : "transparent",
              color: activeTab === "lastday" ? "var(--text)" : "var(--text3)",
            }}>
            {hasLastDayData ? lastDayData.date : "Last Day"}
          </button>
        </div>

        {/* Last day empty state */}
        {activeTab === "lastday" && !hasLastDayData && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">📋</span>
            <p className="text-white font-bold text-lg">No previous data</p>
            <p className="text-sm mt-2" style={{ color: "var(--text3)" }}>
              Start logging meals today to see history here.
            </p>
          </div>
        )}

        {(activeTab === "today" || hasLastDayData) && (
          <>
            {/* Main calorie card */}
            <div
              className="rounded-[28px] p-5 mb-4"
              style={{
                background: "var(--surface)",
                border: isOver ? "1px solid rgba(255,78,106,0.3)" : "none",
              }}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {isOver ? (
                    <>
                      <p className="text-4xl font-black leading-none" style={{ color: "#ff4e6a" }}>
                        +{(consumed.calories - targets.calories).toLocaleString()}
                      </p>
                      <p className="text-sm font-medium mt-1" style={{ color: "rgba(255,78,106,0.7)" }}>
                        over limit ⚠️
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-4xl font-black leading-none text-white">{Math.max(0, targets.calories - consumed.calories).toLocaleString()}</p>
                      <p className="text-sm font-medium mt-1" style={{ color: "var(--text2)" }}>
                        {isHit ? "Goal reached! 🎉" : "Calories left"}
                      </p>
                    </>
                  )}
                  <p className="text-xs mt-2" style={{ color: "var(--text3)" }}>
                    {consumed.calories} / {targets.calories} kcal consumed
                  </p>
                </div>
                <CalorieRing consumed={consumed.calories} target={targets.calories} size={100} isOver={isOver} />
              </div>
            </div>

            {/* Macros */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <MacroCard label="Protein" consumed={consumed.protein} target={targets.protein} unit="g" color="#ff6464" icon="⚡" />
              <MacroCard label="Carbs" consumed={consumed.carbs} target={targets.carbs} unit="g" color="#ffb432" icon="🌾" />
              <MacroCard label="Fats" consumed={consumed.fat} target={targets.fat} unit="g" color="#6496ff" icon="💧" />
            </div>

            {/* Meal sections — only on today tab */}
            <div className="mb-5 space-y-2">
              <h2 className="text-sm font-black uppercase tracking-wider mb-3" style={{ color: "var(--text2)", fontFamily: "var(--font-head)" }}>
                {activeTab === "today" ? "Log Meals" : "Meals"}
              </h2>
              {MEAL_SECTIONS.map(({ type, label, icon }) => {
                const mealItems = meals[type] || [];
                const mealCalories = mealItems.reduce((s: number, m: any) => s + m.calories, 0);
                const isExpanded = expandedMeal === type;

                return (
                  <div key={type} className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)" }}>
                    <div className="flex items-center gap-3 p-3.5">
                      <button className="flex items-center gap-3 flex-1 text-left" onClick={() => setExpandedMeal(isExpanded ? null : type)}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: "var(--bg3)" }}>
                          {icon}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{label}</p>
                          <p className="text-xs" style={{ color: "var(--text3)" }}>
                            {mealItems.length > 0 ? `${mealItems.length} item${mealItems.length > 1 ? "s" : ""} · ${mealCalories} kcal` : "Nothing logged"}
                          </p>
                        </div>
                      </button>

                      {/* + button — today only */}
                      {activeTab === "today" && (
                        <button
                          disabled={mealHasEntry(type)}
                          onClick={() => {
                            if (!mealHasEntry(type)) setScanModal({ open: true, mealType: type });
                          }}
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all"
                          style={{
                            background: mealHasEntry(type) ? "var(--bg3)" : "var(--lime)",
                            color: mealHasEntry(type) ? "var(--text3)" : "#000",
                            cursor: mealHasEntry(type) ? "not-allowed" : "pointer",
                            opacity: mealHasEntry(type) ? 0.5 : 1,
                          }}>
                          {mealHasEntry(type) ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                          )}
                        </button>
                      )}

                      {/* Chevron */}
                      <svg className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ color: "var(--text3)" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>

                    {isExpanded && mealItems.length > 0 && (
                      <div className="px-3 pb-3 space-y-2 border-t" style={{ borderColor: "var(--border)" }}>
                        {mealItems.map((meal: any) => (
                          <MealHistoryItem
                            key={meal._id}
                            foodName={meal.foodName}
                            calories={meal.calories}
                            protein={meal.protein}
                            carbs={meal.carbs}
                            fat={meal.fat}
                            imageUrl={meal.imageUrl}
                            mealType={meal.mealType}
                            createdAt={meal.createdAt}
                            // delete — today only
                            onDelete={activeTab === "today" ? () => deleteMutation.mutate(meal._id) : undefined}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Today history */}
            {allMeals.length > 0 && (
              <div className="mb-5">
                <h2>{activeTab === "today" ? "Today's History" : `${lastDayData?.date} History`}</h2>
                <div className="space-y-2">
                  {allMeals.map((meal: any) => (
                    <MealHistoryItem
                      key={meal._id}
                      foodName={meal.foodName}
                      calories={meal.calories}
                      protein={meal.protein}
                      carbs={meal.carbs}
                      fat={meal.fat}
                      imageUrl={meal.imageUrl}
                      mealType={meal.mealType}
                      createdAt={meal.createdAt}
                      onDelete={activeTab === "today" ? () => deleteMutation.mutate(meal._id) : undefined}
                    />
                  ))}
                </div>
              </div>
            )}
            {/* Daily Summary Ring Section */}
            <div className="mb-5 p-4 rounded-2xl" style={{ background: "var(--surface)" }}>
              <h2 className="text-sm font-black uppercase tracking-wider mb-4" style={{ color: "var(--text2)", fontFamily: "var(--font-head)" }}>
                Daily Summary
              </h2>

              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Calories",
                    consumed: consumed.calories,
                    target: targets.calories,
                    unit: "kcal",
                    color: "var(--lime)",
                  },
                  {
                    label: "Protein",
                    consumed: Number(consumed.protein.toFixed(1)),
                    target: targets.protein,
                    unit: "g",
                    color: "#ff6464",
                  },
                  {
                    label: "Carbs",
                    consumed: Number(consumed.carbs.toFixed(1)),
                    target: targets.carbs,
                    unit: "g",
                    color: "#ffb432",
                  },
                  {
                    label: "Fats",
                    consumed: Number(consumed.fat.toFixed(1)),
                    target: targets.fat,
                    unit: "g",
                    color: "#6496ff",
                  },
                ].map(({ label, consumed: c, target: t, unit, color }) => {
                  const isOver = c > t;
                  const percentage = Math.min(Math.round((c / t) * 100), 100);
                  const radius = 28;
                  const circumference = 2 * Math.PI * radius;
                  const strokeDash = (percentage / 100) * circumference;

                  return (
                    <div key={label} className="p-3 rounded-2xl flex items-center gap-3" style={{ background: "var(--bg3)" }}>
                      {/* Mini ring */}
                      <div className="relative shrink-0" style={{ width: 64, height: 64 }}>
                        <svg width="64" height="64" viewBox="0 0 64 64">
                          {/* Background ring */}
                          <circle cx="32" cy="32" r={radius} fill="none" stroke="var(--border)" strokeWidth="5" />
                          {/* Progress ring */}
                          <circle cx="32" cy="32" r={radius} fill="none" stroke={isOver ? "#ff4e6a" : color} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${strokeDash} ${circumference}`} transform="rotate(-90 32 32)" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-black" style={{ color: isOver ? "#ff4e6a" : color }}>
                            {percentage}%
                          </span>
                        </div>
                      </div>

                      {/* Text info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "var(--text3)" }}>
                          {label}
                        </p>
                        {/* Target */}
                        <p className="text-xs" style={{ color: "var(--text3)" }}>
                          Goal: {t}
                          {unit}
                        </p>
                        {/* Consumed */}
                        <p className="text-sm font-black mt-0.5" style={{ color: isOver ? "#ff4e6a" : "#4ade80" }}>
                          {c}
                          {unit} {isOver ? "▲ over" : "✓"}
                        </p>
                        {/* Remaining or over */}
                        <p className="text-xs mt-0.5" style={{ color: isOver ? "rgba(255,78,106,0.7)" : "var(--text3)" }}>
                          {isOver ? `+${Number((c - t).toFixed(1))}${unit} over` : `${Number((t - c).toFixed(1))}${unit} left`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Empty state */}
            {activeTab === "today" && allMeals.length === 0 && (
              <div className="flex flex-col items-center py-10 text-center">
                <span className="text-5xl mb-4">🍽️</span>
                <p className="text-white font-bold">No meals logged yet</p>
                <p className="text-sm mt-1" style={{ color: "var(--text3)" }}>
                  Tap + next to a meal to scan your food
                </p>
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
