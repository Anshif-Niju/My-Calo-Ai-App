"use client";

import { api } from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import CalorieRing from "./CalorieRing";
import FoodScanModal from "./FoodScan";
import MacroRing from "./MacroRing";
import MealHistoryItem from "./MealHistoryItem";

type MealType = "breakfast" | "lunch" | "dinner" | "custom";

const MEAL_SECTIONS: { type: MealType; label: string; icon: string }[] = [
  { type: "breakfast", label: "Breakfast", icon: "🌅" },
  { type: "lunch", label: "Lunch", icon: "☀️" },
  { type: "dinner", label: "Dinner", icon: "🌙" },
  { type: "custom", label: "Custom", icon: "➕" },
];

// ─── Date helpers ──────────────────────────────────────────────────

const fmt = (d: Date) => d.toISOString().split("T")[0];

const getWeekDates = (): { date: string; label: string; day: string }[] => {
  const result = [];
  for (let i = 0; i <= 6; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push({
      date: fmt(d),
      label: d.getDate().toString(),
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
    });
  }
  return result;
};

// Component

export default function HomeScreen() {
  const queryClient = useQueryClient();
  const todayStr = fmt(new Date());

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [expandedMeal, setExpandedMeal] = useState<MealType | null>(null);
  const [scanModal, setScanModal] = useState<{ open: boolean; mealType: MealType }>({
    open: false,
    mealType: "breakfast",
  });

  const isToday = selectedDate === todayStr;
  const weekDates = useMemo(() => getWeekDates(), []);

  // Fetch selected date dashboard
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", selectedDate],
    queryFn: async () => {
      const res = await api.get(`/nutrition/dashboard?date=${selectedDate}`);
      return res.data;
    },
    staleTime: isToday ? 60_000 : 300_000,
    refetchOnWindowFocus: isToday,
  });

  // Prefetch adjacent dates on strip render
  const prefetchDate = (date: string) => {
    if (date === selectedDate) return;
    queryClient.prefetchQuery({
      queryKey: ["dashboard", date],
      queryFn: async () => {
        const res = await api.get(`/nutrition/dashboard?date=${date}`);
        return res.data;
      },
      staleTime: 300_000,
    });
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (mealId: string) => {
      await api.delete(`/nutrition/meal/${mealId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", todayStr] });
      toast.success("Meal removed");
    },
  });

  // Derived data
  const rawConsumed = data?.consumed || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  const consumed = {
    calories: Math.round(rawConsumed.calories),
    protein: Math.round(rawConsumed.protein * 10) / 10,
    carbs: Math.round(rawConsumed.carbs * 10) / 10,
    fat: Math.round(rawConsumed.fat * 10) / 10,
  };
  const targets = data?.user?.dailyTargets || { calories: 2000, protein: 150, carbs: 200, fat: 65 };
  const meals = data?.meals || { breakfast: [], lunch: [], dinner: [], custom: [] };
  const status = data?.status || "under";
  const isOver = status === "over";
  const isHit = status === "hit";

  const mealHasEntry = (type: MealType) => (type === "custom" ? false : (meals[type] || []).length > 0);

  const allMeals = [...(meals.breakfast || []), ...(meals.lunch || []), ...(meals.dinner || []), ...(meals.custom || [])].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Skeleton
  const Skeleton = () => (
    <div className="space-y-4 animate-pulse w-full">
      <div className="h-40 bg-white rounded-[32px] border border-slate-100" />
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-white rounded-[24px] border border-slate-100" />
        ))}
      </div>
      <div className="h-24 bg-white rounded-[24px] border border-slate-100" />
      <div className="h-24 bg-white rounded-[24px] border border-slate-100" />
    </div>
  );

  return (
    <div className="min-h-screen pb-24 bg-slate-50 font-sans">
      <div className="max-w-md mx-auto sm:max-w-xl md:max-w-3xl lg:max-w-5xl px-4 sm:px-6 pt-6">
        {/*  Header  */}

        <div className="flex items-center justify-between  mb-8">
          <div className=" pt-0.5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{isToday ? "Good Morning" : selectedDate}</p>
            <h1 className="text-xl font-black text-slate-900 leading-none">MyCalo AI</h1>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white rounded-full shadow-sm border border-slate-100">
            <span className="text-sm font-bold text-slate-600">Streak</span>
            <span className="text-base">🔥</span>
            <span className="text-sm font-black text-orange-500">{data?.totalMeals || 0}</span>
          </div>
        </div>

        {/* Main Layout  */}

        <div className="flex flex-col lg:flex-row lg:items-start lg:gap-8">
          {/* Calendar Strip*/}

          <div className="w-full lg:w-20 shrink-0 mb-6 lg:mb-0">
            <div className="flex flex-row lg:flex-col gap-2.5 overflow-x-auto pb-2 lg:pb-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden lg:fixed lg:left-8 xl:left-12 lg:top-24 z-10">
              {weekDates.map(({ date, label, day }) => {
                const isSelected = date === selectedDate;
                const isTodayDate = date === todayStr;

                return (
                  <button
                    key={date}
                    onClick={() => {
                      setSelectedDate(date);
                      setExpandedMeal(null);
                    }}
                    onMouseEnter={() => prefetchDate(date)}
                    className={`flex flex-col items-center justify-center min-w-[3.5rem] lg:w-20 py-3 lg:py-4 rounded-[18px] transition-colors ${
                      isSelected ? "bg-slate-900 text-white shadow-md" : "bg-white border border-slate-100 hover:bg-slate-100"
                    }`}>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? "text-slate-300" : "text-slate-400"}`}>{day}</span>
                    <span className={`text-[17px] font-black mt-1 ${isSelected ? "text-white" : isTodayDate ? "text-orange-500" : "text-slate-700"}`}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {/* Dashboard Content  */}
          <div className="flex-1 min-w-0 relative">
            {isLoading ? (
              <Skeleton />
            ) : (
              <div className="relative min-h-[400px]">
                {/* Blurred Dashboard Content */}
                <div className={`transition-all duration-300 ${!isToday && allMeals.length === 0 ? "filter blur-[6px] select-none pointer-events-none" : ""}`}>
                  {/* Calorie card */}
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
                            <span className="text-slate-900">
                              {consumed.calories} consumed / {targets.calories} target
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="drop-shadow-md">
                        <CalorieRing consumed={consumed.calories} target={targets.calories} size={110} isOver={isOver} />
                      </div>
                    </div>
                  </div>

                  {/* Macros */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-8">
                    {[
                      { label: "Protein", c: consumed.protein, t: targets.protein, color: "#9333ea", bg: "bg-purple-50", border: "border-purple-100" },
                      { label: "Carbs", c: consumed.carbs, t: targets.carbs, color: "#059669", bg: "bg-emerald-50", border: "border-emerald-100" },
                      { label: "Fat", c: consumed.fat, t: targets.fat, color: "#ea580c", bg: "bg-orange-50", border: "border-orange-100" },
                    ].map((macro) => {
                      const remaining = macro.t - macro.c;
                      const macroIsOver = remaining < 0;
                      const absRemaining = Math.abs(Math.round(remaining));

                      return (
                        <div key={macro.label} className={`p-4 rounded-[24px] ${macro.bg} ${macro.border} border shadow-sm`}>
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <span className="text-[13px] font-black uppercase tracking-wider opacity-80 leading-none" style={{ color: macro.color }}>
                                {macro.label}
                              </span>

                              <p className={`mt-2 text-3xl font-black leading-none tracking-tight ${macroIsOver ? "text-red-500" : ""}`} style={!macroIsOver ? { color: macro.color } : {}}>
                                {macroIsOver ? "+" : ""}
                                {absRemaining}
                                <span className="text-[12px] ml-1 font-bold">g</span>
                              </p>

                              <span className={`text-[12px] font-medium mt-1 inline-block opacity-80 ${macroIsOver ? "text-red-600" : ""}`} style={!macroIsOver ? { color: macro.color } : {}}>
                                {macroIsOver ? "over limit" : "remaining"}
                              </span>
                            </div>

                            <div className="shrink-0">
                              <MacroRing consumed={macro.c} target={macro.t} color={macro.color} />
                            </div>
                          </div>

                          <div className={`pt-2.5 mt-3 border-t ${macro.border} border-opacity-60`}>
                            <p className="text-[12px] font-medium text-slate-500">
                              <span style={{ color: macro.color }}>
                                {Math.round(macro.c)}g / {macro.t}g target
                              </span>
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Meal Accordion */}
                  <div className="mb-8 space-y-3">
                    <h2 className="text-[13px] font-bold uppercase tracking-wider mb-4 text-slate-800 ml-2">{isToday ? "Log Meals" : "Meals"}</h2>
                    {MEAL_SECTIONS.map(({ type, label, icon }) => {
                      const mealItems = meals[type] || [];
                      const mealCalories = mealItems.reduce((s: number, m: any) => s + m.calories, 0);
                      const isExpanded = expandedMeal === type;
                      return (
                        <div key={type} onClick={() => setExpandedMeal(isExpanded ? null : type)} className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden transition-all duration-200 cursor-pointer">
                          <div className="flex items-center gap-3 p-4">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="w-12 h-12 rounded-[16px] bg-slate-50 border border-slate-100 flex items-center justify-center text-xl shrink-0">{icon}</div>
                              <div>
                                <p className="text-base font-bold text-slate-900">{label}</p>
                                <p className="text-[12px] font-medium text-slate-500 mt-0.5">{mealItems.length > 0 ? `${mealItems.length} item${mealItems.length > 1 ? "s" : ""} · ${mealCalories} kcal` : "Nothing logged"}</p>
                              </div>
                            </div>

                            {/* + button — today only */}
                            {isToday && (
                              <button
                                disabled={mealHasEntry(type)}
                                onClick={(e) => {
                                  e.stopPropagation();
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
                                <MealHistoryItem key={meal._id} {...meal} onDelete={isToday ? () => deleteMutation.mutate(meal._id) : undefined} />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Full history list */}
                  {allMeals.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-[13px] font-bold uppercase tracking-wider mb-4 text-slate-800 ml-2">{isToday ? "Today's History" : `${selectedDate} History`}</h2>
                      <div className="space-y-3">
                        {allMeals.map((meal: any) => (
                          <MealHistoryItem key={meal._id} {...meal} onDelete={isToday ? () => deleteMutation.mutate(meal._id) : undefined} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Daily Summary */}
                  <div className="mb-8 p-6 rounded-[32px] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <h2 className="text-[13px] font-bold uppercase tracking-wider mb-5 text-slate-800">Daily Summary</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { label: "Calories", consumed: consumed.calories, target: targets.calories, unit: "kcal", color: "#f97316" },
                        { label: "Protein", consumed: Number(consumed.protein.toFixed(1)), target: targets.protein, unit: "g", color: "#9333ea" },
                        { label: "Carbs", consumed: Number(consumed.carbs.toFixed(1)), target: targets.carbs, unit: "g", color: "#059669" },
                        { label: "Fats", consumed: Number(consumed.fat.toFixed(1)), target: targets.fat, unit: "g", color: "#ea580c" },
                      ].map(({ label, consumed: c, target: t, unit, color }) => {
                        const itemIsOver = c > t;
                        const percentage = Math.min(Math.round((c / t) * 100), 100);
                        const radius = 28;
                        const circumference = 2 * Math.PI * radius;
                        const strokeDash = (percentage / 100) * circumference;
                        return (
                          <div key={label} className="p-4 rounded-[20px] flex items-center gap-4 bg-slate-50 border border-slate-100 transition-hover hover:bg-slate-100/50">
                            <div className="relative shrink-0" style={{ width: 64, height: 64 }}>
                              <svg width="64" height="64" viewBox="0 0 64 64">
                                <circle cx="32" cy="32" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="6" />
                                <circle
                                  cx="32"
                                  cy="32"
                                  r={radius}
                                  fill="none"
                                  stroke={itemIsOver ? "#EF4444" : "#059669"}
                                  strokeWidth="6"
                                  strokeLinecap="round"
                                  strokeDasharray={`${strokeDash} ${circumference}`}
                                  transform="rotate(-90 32 32)"
                                  style={{ transition: "stroke-dasharray 0.8s ease" }}
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[13px] font-black" style={{ color: itemIsOver ? "#ef4444" : "#059669" }}>
                                  {percentage}%
                                </span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-500">{label}</p>
                              <p className="text-[12px] text-slate-400 font-medium">
                                Goal: <span className="text-[18px] font-bold text-black">{t}</span>
                                <span className="text-black text-[14px]"> {unit}</span>
                              </p>
                              <p className="text-[15px] mt-0.5">
                                <span className="text-[12px] text-slate-400 font-medium">Consumed: </span>
                                <span className="text-slate-800 font-medium text-[14px]">{c}</span>
                                <span className="text-black font-medium text-[12px]"> {unit}</span>
                              </p>
                              <p className={`text-[12px] font-semibold mt-1 ${itemIsOver ? "text-red-400" : "text-green-700"}`}>{itemIsOver ? `+${Number((c - t).toFixed(1))} ${unit} over limit` : `${Number((t - c).toFixed(1))}${unit} remaining`}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Non-blurred Overlay */}
                {!isToday && allMeals.length === 0 && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-slate-50/20 rounded-[32px]">
                    <div className="bg-white/95 border border-slate-100 p-8 rounded-[32px] shadow-xl max-w-sm w-full mx-auto flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
                      <div className="w-16 h-16 bg-gradient-to-tr from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-3xl mb-4 shadow-md shadow-orange-100">🍽️</div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">No food logged by user</h3>
                      <p className="text-[13px] mt-2 text-slate-500 font-medium max-w-[240px]">{isToday ? "Start tracking your calories and macros by logging your first meal today." : `No food logs found for ${selectedDate}.`}</p>

                      {isToday && (
                        <div className="mt-6 w-full space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick Log</p>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { type: "breakfast" as MealType, label: "Breakfast", icon: "🌅" },
                              { type: "lunch" as MealType, label: "Lunch", icon: "☀️" },
                              { type: "dinner" as MealType, label: "Dinner", icon: "🌙" },
                              { type: "custom" as MealType, label: "Custom", icon: "➕" },
                            ].map((item) => (
                              <button
                                key={item.type}
                                onClick={() => setScanModal({ open: true, mealType: item.type })}
                                className="flex items-center gap-2 justify-center py-2 px-3 bg-slate-50 hover:bg-orange-50 hover:text-orange-600 transition-colors rounded-xl border border-slate-100 text-xs font-bold text-slate-700 cursor-pointer">
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {scanModal.open && isToday && (
        <FoodScanModal
          mealType={scanModal.mealType}
          date={todayStr}
          onClose={() => setScanModal({ open: false, mealType: "breakfast" })}
          onAdded={(newMeal: any) => {
            // 🚀 മാറ്റം ഇവിടെയാണ്: കാഷെ അപ്ഡേറ്റ് ചെയ്യുമ്പോൾ മീൽ മാത്രമല്ല, നമ്പറുകളും കൂട്ടുന്നു!
            if (newMeal) {
              queryClient.setQueryData(["dashboard", todayStr], (oldData: any) => {
                if (!oldData) return oldData;

                // 1. മീൽ ലിസ്റ്റ് അപ്ഡേറ്റ് ചെയ്യുന്നു
                const updatedMeals = { ...oldData.meals };
                const type = newMeal.mealType;
                const mealWithTempImage = { ...newMeal, imageUrl: newMeal.tempImageUrl || newMeal.imageUrl };

                if (updatedMeals[type]) {
                  updatedMeals[type] = [mealWithTempImage, ...updatedMeals[type]];
                } else {
                  updatedMeals[type] = [mealWithTempImage];
                }

                // 🚀 2. നമ്പറുകൾ (Macros & Calories) അപ്ഡേറ്റ് ചെയ്യുന്നു
                const updatedConsumed = {
                  calories: (oldData.consumed?.calories || 0) + (newMeal.calories || 0),
                  protein: (oldData.consumed?.protein || 0) + (newMeal.protein || 0),
                  carbs: (oldData.consumed?.carbs || 0) + (newMeal.carbs || 0),
                  fat: (oldData.consumed?.fat || 0) + (newMeal.fat || 0),
                  fiber: (oldData.consumed?.fiber || 0) + (newMeal.fiber || 0),
                };

                // 3. ആകെ മീൽ എണ്ണം കൂട്ടുന്നു (Streak/Count)
                const updatedTotalMeals = (oldData.totalMeals || 0) + 1;

                // ഇതെല്ലാം ഒന്നിച്ച് റിട്ടേൺ ചെയ്യുന്നു
                return {
                  ...oldData,
                  meals: updatedMeals,
                  consumed: updatedConsumed,
                  totalMeals: updatedTotalMeals,
                };
              });
            }

            setScanModal({ open: false, mealType: "breakfast" });
          }}
        />
      )}
    </div>
  );
}
