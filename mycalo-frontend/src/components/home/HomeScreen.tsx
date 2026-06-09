"use client";

import { api } from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import CalorieRing from "./CalorieRing";
import MacroCard from "./MacroCard";
import MealHistoryItem from "./MealHistoryItem";

type MealType = "breakfast" | "lunch" | "dinner" | "custom";

const MEAL_SECTIONS: { type: MealType; label: string; icon: string }[] = [
  { type: "breakfast", label: "Breakfast", icon: "🌅" },
  { type: "lunch", label: "Lunch", icon: "☀️" },
  { type: "dinner", label: "Dinner", icon: "🌙" },
  { type: "custom", label: "Custom", icon: "➕" },
];

export default function HomeScreen() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split("T")[0];
  const [activeTab, setActiveTab] = useState<"today" | "yesterday">("today");
  const [expandedMeal, setExpandedMeal] = useState<MealType | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanJobId, setScanJobId] = useState<string | null>(null);

  const date = activeTab === "today" ? today : new Date(Date.now() - 86400000).toISOString().split("T")[0];

  // Fetch dashboard
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["dashboard", date],
    queryFn: async () => {
      const res = await api.get(`/nutrition/dashboard?date=${date}`);
      return res.data;
    },
    refetchInterval: 60000, // refetch every 60s
    staleTime: 30000,
  });

  // Delete meal
  const deleteMutation = useMutation({
    mutationFn: async (mealId: string) => {
      await api.delete(`/nutrition/meal/${mealId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", date] });
      toast.success("Meal removed");
    },
  });

  // Scan food
  const handleScan = async (file: File, mealType: MealType) => {
    setScanning(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("mealType", mealType);
      formData.append("date", date);

      const res = await api.post("/nutrition/scan-food", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setScanJobId(res.data.jobId);
      toast.success("Scanning your food...");

      // Poll for result
      const poll = setInterval(async () => {
        const result = await api.get(`/nutrition/scan-result/${res.data.jobId}`);
        if (result.data.status === "done") {
          clearInterval(poll);
          setScanning(false);
          setScanJobId(null);

          // Auto-log the meal
          const scanned = result.data.data;
          await api.post("/nutrition/log-meal", {
            mealType,
            foodName: scanned.foodName,
            quantity: scanned.quantity,
            unit: scanned.unit,
            calories: scanned.calories,
            protein: scanned.protein,
            carbs: scanned.carbs,
            fat: scanned.fat,
            fiber: scanned.fiber || 0,
            imageUrl: res.data.imageUrl,
            source: "scan",
            date,
          });

          queryClient.invalidateQueries({ queryKey: ["dashboard", date] });
          toast.success(`Logged: ${scanned.foodName} — ${scanned.calories} kcal`);
        }
      }, 2000);

      // Stop polling after 30s
      setTimeout(() => {
        clearInterval(poll);
        setScanning(false);
        toast.error("Scan timed out. Try again.");
      }, 30000);
    } catch {
      setScanning(false);
      toast.error("Scan failed. Try again.");
    }
  };

  const consumed = data?.consumed || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const targets = data?.user?.dailyTargets || { calories: 2000, protein: 150, carbs: 200, fat: 65 };
  const meals = data?.meals || { breakfast: [], lunch: [], dinner: [], custom: [] };
  const allMeals = [...(meals.breakfast || []), ...(meals.lunch || []), ...(meals.dinner || []), ...(meals.custom || [])];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "var(--bg)" }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--lime) transparent transparent transparent" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 lg:pb-8 lg:pt-16" style={{ background: "var(--bg)" }}>
      <div className="max-w-lg mx-auto px-4 pt-6 lg:max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🥗</span>
            <span className="text-xl font-black" style={{ color: "var(--text)", fontFamily: "var(--font-head)" }}>
              MyCalo AI
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "var(--surface)" }}>
            <span className="text-base">🔥</span>
            <span className="text-sm font-black" style={{ color: "var(--lime)" }}>
              {data?.totalMeals || 0}
            </span>
          </div>
        </div>

        {/* Today / Yesterday tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-2xl w-fit" style={{ background: "var(--surface)" }}>
          {(["today", "yesterday"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-5 py-2 rounded-xl text-sm font-bold capitalize transition-all"
              style={{
                background: activeTab === tab ? "var(--bg)" : "transparent",
                color: activeTab === tab ? "var(--text)" : "var(--text3)",
              }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Main calorie card */}
        <div className="rounded-[28px] p-5 mb-4" style={{ background: "var(--surface)" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-5xl font-black text-white leading-none">{Math.max(0, targets.calories - consumed.calories).toLocaleString()}</p>
              <p className="text-sm font-medium mt-1" style={{ color: "var(--text2)" }}>
                Calories left
              </p>
              <p className="text-xs mt-2" style={{ color: "var(--text3)" }}>
                {consumed.calories} / {targets.calories} consumed
              </p>
            </div>
            <CalorieRing consumed={consumed.calories} target={targets.calories} size={110} />
          </div>
        </div>

        {/* Macros row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <MacroCard label="Protein" consumed={consumed.protein} target={targets.protein} unit="g" color="#ff6464" icon="⚡" />
          <MacroCard label="Carbs" consumed={consumed.carbs} target={targets.carbs} unit="g" color="#ffb432" icon="🌾" />
          <MacroCard label="Fats" consumed={consumed.fat} target={targets.fat} unit="g" color="#6496ff" icon="💧" />
        </div>

        {/* Meal sections */}
        <div className="mb-5 space-y-3">
          <h2 className="text-base font-black" style={{ color: "var(--text)", fontFamily: "var(--font-head)" }}>
            Meals
          </h2>
          {MEAL_SECTIONS.map(({ type, label, icon }) => {
            const mealItems = meals[type] || [];
            const mealCalories = mealItems.reduce((s: number, m: any) => s + m.calories, 0);
            const isExpanded = expandedMeal === type;

            return (
              <div key={type} className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)" }}>
                {/* Meal header */}
                <button className="w-full flex items-center justify-between p-4" onClick={() => setExpandedMeal(isExpanded ? null : type)}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: "var(--bg3)" }}>
                      {icon}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">{label}</p>
                      <p className="text-xs" style={{ color: "var(--text3)" }}>
                        {mealItems.length} items · {mealCalories} kcal
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Add button */}
                    <label className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-all" style={{ background: "var(--lime)", color: "#000" }} onClick={(e) => e.stopPropagation()}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleScan(file, type);
                        }}
                      />
                    </label>
                    {/* Expand chevron */}
                    <svg className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ color: "var(--text3)" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </button>

                {/* Expanded meal items */}
                {isExpanded && mealItems.length > 0 && (
                  <div className="px-3 pb-3 space-y-2">
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
                        onDelete={() => deleteMutation.mutate(meal._id)}
                      />
                    ))}
                  </div>
                )}

                {isExpanded && mealItems.length === 0 && (
                  <div className="px-4 pb-4 text-center">
                    <p className="text-xs" style={{ color: "var(--text3)" }}>
                      No {label.toLowerCase()} logged yet. Tap + to scan food.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Today's history */}
        {allMeals.length > 0 && (
          <div className="mb-5">
            <h2 className="text-base font-black mb-3" style={{ color: "var(--text)", fontFamily: "var(--font-head)" }}>
              Recently added
            </h2>
            <div className="space-y-2">
              {allMeals.slice(0, 5).map((meal: any) => (
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
                  onDelete={() => deleteMutation.mutate(meal._id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Scanning overlay */}
        {scanning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.8)" }}>
            <div className="text-center p-8 rounded-[32px]" style={{ background: "var(--surface)" }}>
              <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: "var(--lime) transparent transparent transparent" }} />
              <p className="text-white font-bold text-lg">Scanning food...</p>
              <p className="text-sm mt-1" style={{ color: "var(--text2)" }}>
                Gemini AI is analyzing your meal
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
