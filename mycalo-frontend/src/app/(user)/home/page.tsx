"use client";

import { api } from "@/lib/axios";
import { RootState } from "@/store";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useSelector } from "react-redux";

// ─── Types ───────────────────────────────────────────────────────────────────
interface FoodItem {
  _id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
  unit: string;
}

interface MealLog {
  _id: string;
  mealType: string;
  customMealName?: string;
  foods: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  loggedAt: string;
}

interface HomeSummary {
  totalCalories: number;
  goalCalories: number;
  caloriesRemaining: number;
  caloriesBurned: number;
  totalProtein: number;
  goalProtein: number;
  totalCarbs: number;
  goalCarbs: number;
  totalFat: number;
  goalFat: number;
  waterIntake: number;
  waterGoal: number;
}

interface HomeData {
  date: string;
  summary: HomeSummary;
  meals: {
    breakfast: MealLog[];
    lunch: MealLog[];
    dinner: MealLog[];
    custom: MealLog[];
  };
}

// ─── Calorie Ring SVG ─────────────────────────────────────────────────────────
function CalorieRing({ consumed, goal, burned }: { consumed: number; goal: number; burned: number }) {
  const size = 180;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(consumed / goal, 1);
  const offset = circumference - progress * circumference;
  const remaining = Math.max(0, goal - consumed);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1a1a1a" strokeWidth={strokeWidth} />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#calorieGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
        <defs>
          <linearGradient id="calorieGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff6b35" />
            <stop offset="100%" stopColor="#ff9a3c" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          {remaining.toLocaleString()}
        </span>
        <span className="text-xs font-semibold text-white/40 tracking-widest uppercase mt-0.5">kcal left</span>
        {burned > 0 && <span className="text-[10px] text-orange-400 font-bold mt-1">+{burned} burned</span>}
      </div>
    </div>
  );
}

// ─── Macro Bar ────────────────────────────────────────────────────────────────
function MacroBar({ label, current, goal, color }: { label: string; current: number; goal: number; color: string }) {
  const pct = Math.min((current / goal) * 100, 100);
  return (
    <div className="flex-1">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{label}</span>
        <span className="text-[10px] font-bold text-white/60">
          {current}
          <span className="text-white/30">/{goal}g</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ─── Meal Card ────────────────────────────────────────────────────────────────
const MEAL_META: Record<string, { icon: string; label: string; time: string; color: string }> = {
  breakfast: { icon: "🌅", label: "Breakfast", time: "7–10 AM", color: "#fbbf24" },
  lunch: { icon: "☀️", label: "Lunch", time: "12–2 PM", color: "#34d399" },
  dinner: { icon: "🌙", label: "Dinner", time: "7–9 PM", color: "#818cf8" },
  custom: { icon: "✨", label: "Custom", time: "Anytime", color: "#f472b6" },
};

function MealCard({ type, logs, onAdd }: { type: string; logs: MealLog[]; onAdd: () => void }) {
  const meta = MEAL_META[type];
  const totalCal = logs.reduce((s, l) => s + l.totalCalories, 0);
  const allFoods = logs.flatMap((l) => l.foods);
  const isEmpty = allFoods.length === 0;

  return (
    <div className="rounded-[20px] overflow-hidden" style={{ background: "#111111", border: "1px solid #1e1e1e" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-lg" style={{ background: `${meta.color}18` }}>
            {meta.icon}
          </div>
          <div>
            <p className="text-sm font-bold text-white">{meta.label}</p>
            <p className="text-[10px] text-white/30 font-medium">{meta.time}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {totalCal > 0 && (
            <span className="text-xs font-black" style={{ color: meta.color }}>
              {Math.round(totalCal)} kcal
            </span>
          )}
          <button
            onClick={onAdd}
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg transition-all active:scale-90"
            style={{ background: meta.color, color: "#000" }}>
            +
          </button>
        </div>
      </div>

      {/* Food list */}
      {!isEmpty ? (
        <div className="px-4 pb-4 space-y-2">
          <div className="h-px bg-white/5 mb-3" />
          {allFoods.slice(0, 3).map((food, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
                <span className="text-xs font-semibold text-white/70 truncate max-w-[140px]">{food.name}</span>
                <span className="text-[10px] text-white/30">
                  {food.quantity}
                  {food.unit}
                </span>
              </div>
              <span className="text-xs font-bold text-white/50">{Math.round(food.calories)} kcal</span>
            </div>
          ))}
          {allFoods.length > 3 && <p className="text-[10px] text-white/30 pl-3.5">+{allFoods.length - 3} more items</p>}
        </div>
      ) : (
        <div className="px-4 pb-4">
          <p className="text-xs text-white/20 font-medium">No foods logged yet</p>
        </div>
      )}
    </div>
  );
}

// ─── Water Tracker ────────────────────────────────────────────────────────────
function WaterTracker({ intake, goal }: { intake: number; goal: number }) {
  const glasses = Math.round(goal / 250); // 250ml per glass
  const filled = Math.round(intake / 250);

  return (
    <div className="rounded-[20px] p-4" style={{ background: "#111111", border: "1px solid #1e1e1e" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">💧</span>
          <span className="text-sm font-bold text-white">Water</span>
        </div>
        <span className="text-xs font-bold text-blue-400">
          {intake}
          <span className="text-white/30">/{goal}ml</span>
        </span>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {Array.from({ length: glasses }).map((_, i) => (
          <div
            key={i}
            className="w-6 h-6 rounded-lg transition-all"
            style={{ background: i < filled ? "#38bdf8" : "#1e2a35" }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="animate-pulse space-y-4 px-4 pt-6">
      <div className="h-48 rounded-3xl bg-white/5" />
      <div className="h-16 rounded-2xl bg-white/5" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-20 rounded-2xl bg-white/5" />
      ))}
    </div>
  );
}

// ─── Main Home Page ───────────────────────────────────────────────────────────
export default function HomePage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const today = format(new Date(), "yyyy-MM-dd");

  const { data, isLoading, isError } = useQuery<HomeData>({
    queryKey: ["home", today],
    queryFn: async () => {
      const res = await api.get(`/home/today?date=${today}`);
      return res.data;
    },
    staleTime: 1000 * 60 * 2, // 2 min
  });

  const handleAddMeal = (type: string) => {
    // Navigate to meal log page — wire up later
    console.log("Add meal:", type);
  };

  if (isLoading) return <div className="min-h-screen bg-black"><Skeleton /></div>;

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white/40 text-sm">Failed to load today's data.</p>
      </div>
    );
  }

  const { summary, meals } = data;
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="min-h-screen bg-black pb-28" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Top greeting */}
      <div className="px-4 pt-6 pb-2">
        <p className="text-white/40 text-xs font-semibold uppercase tracking-widest">{format(new Date(), "EEEE, MMMM d")}</p>
        <h1 className="text-xl font-black text-white mt-0.5">
          {greeting}, {user?.name?.split(" ")[0]} 👋
        </h1>
      </div>

      {/* Calorie ring card */}
      <div className="mx-4 mt-3 rounded-[28px] p-5" style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}>
        <div className="flex items-center justify-between">
          {/* Ring */}
          <CalorieRing consumed={summary.totalCalories} goal={summary.goalCalories} burned={summary.caloriesBurned} />

          {/* Stats */}
          <div className="flex-1 pl-5 space-y-4">
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Consumed</p>
              <p className="text-xl font-black text-white">{Math.round(summary.totalCalories)}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Goal</p>
              <p className="text-xl font-black text-white">{summary.goalCalories}</p>
            </div>
            {summary.caloriesBurned > 0 && (
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Burned</p>
                <p className="text-xl font-black text-orange-400">{summary.caloriesBurned}</p>
              </div>
            )}
          </div>
        </div>

        {/* Macro bars */}
        <div className="flex gap-4 mt-5 pt-4" style={{ borderTop: "1px solid #1a1a1a" }}>
          <MacroBar label="Protein" current={Math.round(summary.totalProtein)} goal={summary.goalProtein} color="#f472b6" />
          <MacroBar label="Carbs" current={Math.round(summary.totalCarbs)} goal={summary.goalCarbs} color="#fbbf24" />
          <MacroBar label="Fat" current={Math.round(summary.totalFat)} goal={summary.goalFat} color="#34d399" />
        </div>
      </div>

      {/* Meal cards */}
      <div className="px-4 mt-5 space-y-3">
        <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">Today's Meals</p>
        {(["breakfast", "lunch", "dinner", "custom"] as const).map((type) => (
          <MealCard key={type} type={type} logs={meals[type]} onAdd={() => handleAddMeal(type)} />
        ))}
      </div>

      {/* Water */}
      <div className="px-4 mt-4">
        <WaterTracker intake={summary.waterIntake} goal={summary.waterGoal} />
      </div>
    </div>
  );
}
