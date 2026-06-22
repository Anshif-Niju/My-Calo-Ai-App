"use client";

import { api } from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useMemo, useState } from "react";

type MealType = "breakfast" | "lunch" | "dinner" | "custom";

interface UserDetailsProps {
  userId: string;
}

interface IUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  profilePhoto?: string;
  isBlocked: boolean;
  isDeleted: boolean;
  isEmailVerified: boolean;
  isTwofactorEnabled?: boolean;

  healthProfile?: {
    height?: number;
    weight?: number;
    activityLevel?: string;
    diseases?: string[];
  };
  goal?: {
    type?: "weight_loss" | "weight_gain" | "maintain";
    targetWeight?: number;
  };
  dailyTargets?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };
}

const fmtDate = (d: Date) => d.toISOString().split("T")[0];

const getPast10Days = (): { date: string; label: string; day: string }[] => {
  const result = [];
  for (let i = 0; i < 10; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push({
      date: fmtDate(d),
      label: d.getDate().toString(),
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
    });
  }
  return result;
};

export default function UserDetails({ userId }: UserDetailsProps) {
  const todayStr = useMemo(() => fmtDate(new Date()), []);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const weekDates = useMemo(() => getPast10Days(), []);

  const { data, isLoading, isError } = useQuery<IUser>({
    queryKey: ["admin-user", userId],
    queryFn: async () => {
      const res = await api.get(`/admin/users/${userId}`);
      console.log(res.data)
      return res.data.user;
    },
  });

  const { data: logData, isLoading: isLogLoading } = useQuery({
    queryKey: ["admin-user-daily-log", userId, selectedDate],
    queryFn: async () => {
      const res = await api.get(`/admin/users/${userId}/daily-log?date=${selectedDate}`);
      return res.data.log;
    },
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <p className="text-gray-900 font-medium">Loading user details...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-8">
        <p className="text-red-500 font-medium">Failed to load user.</p>
      </div>
    );
  }

  const user = data as IUser;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">User Details</h1>
        <p className="text-slate-400 text-[11px] mt-1.5 font-bold uppercase tracking-wider">Complete user information</p>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {user.profilePhoto ? (
            <Image src={user.profilePhoto} alt={user.name} width={80} height={80} className="rounded-full shadow-sm" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-slate-950 text-white flex items-center justify-center text-3xl font-bold shadow-sm">{user.name?.charAt(0).toUpperCase()}</div>
          )}

          <div className="text-center sm:text-left flex-1">
            <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
            <p className="text-slate-500 font-medium">{user.email}</p>

            <div className="flex justify-center sm:justify-start gap-2 mt-3">
              <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wide">{user.role}</span>
              <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${user.isBlocked ? "bg-red-50 text-red-600 border border-red-100/50" : "bg-emerald-50 text-emerald-600 border border-emerald-100/50"}`}>{user.isBlocked ? "Blocked" : "Active"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Information Card */}
      <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6">
        <h3 className="font-bold text-slate-900 text-lg mb-5">Account Information</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">User ID</p>
            <p className="text-slate-900 font-semibold break-all">{user._id}</p>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Role</p>
            <p className="text-slate-900 font-semibold capitalize">{user.role}</p>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email Verified</p>
            <p className="text-slate-900 font-semibold">{user.isEmailVerified ? "Yes" : "No"}</p>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Two Factor Auth</p>
            <p className="text-slate-900 font-semibold">{user.isTwofactorEnabled ? "Enabled" : "Disabled"}</p>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Joined</p>
            <p className="text-slate-900 font-semibold">{new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>
      </div>

      {/* Health Information Card */}
      <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6">
        <h3 className="font-bold text-slate-900 text-lg mb-5">Health Information</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Height</p>
            <p className="text-slate-900 font-semibold">{user.healthProfile?.height ? `${user.healthProfile.height} cm` : "-"}</p>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Weight</p>
            <p className="text-slate-900 font-semibold">{user.healthProfile?.weight ? `${user.healthProfile.weight} kg` : "-"}</p>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Activity Level</p>
            <p className="text-slate-900 font-semibold capitalize">{user.healthProfile?.activityLevel ?? "-"}</p>
          </div>
        </div>
      </div>

      {/* Goals & Targets Card */}
      <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6">
        <h3 className="font-bold text-slate-900 text-lg mb-5">Goals & Daily Targets</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Weekly Goal</p>
            <p className="text-slate-900 font-semibold capitalize">
              {user.goal?.type ? user.goal.type.replace("_", " ") : "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Target Weight</p>
            <p className="text-slate-900 font-semibold">
              {user.goal?.targetWeight ? `${user.goal.targetWeight} kg` : "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Calories Target</p>
            <p className="text-slate-900 font-semibold">
              {user.dailyTargets?.calories ? `${user.dailyTargets.calories} kcal` : "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Macros Target (P / C / F / Fiber)</p>
            <p className="text-slate-900 font-semibold">
              {user.dailyTargets
                ? `${user.dailyTargets.protein || 0}g / ${user.dailyTargets.carbs || 0}g / ${user.dailyTargets.fat || 0}g / ${user.dailyTargets.fiber || 0}g`
                : "-"}
            </p>
          </div>
        </div>
      </div>

      {/* Diseases & Conditions Card */}
      <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6">
        <h3 className="font-bold text-slate-900 text-lg mb-4">Diseases & Conditions</h3>

        {user.healthProfile?.diseases?.length ? (
          <div className="flex flex-wrap gap-2">
            {user.healthProfile.diseases.map((disease: string) => (
              <span key={disease} className="px-4 py-1.5 bg-red-50 text-red-600 border border-red-100/50 rounded-lg text-sm font-bold capitalize animate-pulse-subtle">
                {disease}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 font-medium">No diseases recorded</p>
        )}
      </div>

      {/* 10-Day Log History Section */}
      <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6">
        <h3 className="font-bold text-slate-900 text-lg mb-5">10-Day Daily Log & Food History</h3>
        
        {/* Date Strip */}
        <div className="flex gap-2 overflow-x-auto pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {weekDates.map(({ date, label, day }) => {
            const isSelected = date === selectedDate;
            const isCurrent = date === todayStr;
            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center justify-center min-w-[3.5rem] py-3 rounded-[18px] transition-all cursor-pointer border ${
                  isSelected 
                    ? "bg-slate-900 text-white shadow-md border-slate-900" 
                    : "bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-600"
                }`}
              >
                <span className={`text-[9px] font-bold uppercase tracking-wider ${isSelected ? "text-slate-300" : "text-slate-400"}`}>{day}</span>
                <span className={`text-[15px] font-black mt-0.5 ${isSelected ? "text-white" : isCurrent ? "text-orange-500" : "text-slate-800"}`}>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Date Data */}
        {isLogLoading ? (
          <div className="py-8 text-center">
            <div className="w-8 h-8 rounded-full animate-spin border-4 border-slate-200 border-t-slate-900 mx-auto" />
            <p className="text-sm text-slate-400 mt-2">Loading logs for {selectedDate}...</p>
          </div>
        ) : !logData ? (
          <p className="text-slate-500 text-sm py-4 text-center">No logs found for {selectedDate}</p>
        ) : (
          <div className="space-y-6 mt-4">
            {/* Calories & Balance Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Consumed</p>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {Math.round(logData.consumed?.calories || 0)} <span className="text-xs font-bold">kcal</span>
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target</p>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {Math.round(logData.user?.dailyTargets?.calories || 2000)} <span className="text-xs font-bold">kcal</span>
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Balance</p>
                {(() => {
                  const consumedVal = Math.round(logData.consumed?.calories || 0);
                  const targetVal = Math.round(logData.user?.dailyTargets?.calories || 2000);
                  const balance = targetVal - consumedVal;
                  const isOver = balance < 0;
                  return (
                    <p className={`text-2xl font-black mt-1 ${isOver ? "text-red-500" : "text-emerald-600"}`}>
                      {isOver ? "+" : ""}
                      {balance} <span className="text-xs font-bold">kcal {isOver ? "over" : "rem"}</span>
                    </p>
                  );
                })()}
              </div>
            </div>

            {/* Macro details */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50/50 border border-slate-100/80 rounded-2xl p-4">
              {[
                { label: "Protein", c: logData.consumed?.protein || 0, t: logData.user?.dailyTargets?.protein || 150, color: "text-purple-600" },
                { label: "Carbs", c: logData.consumed?.carbs || 0, t: logData.user?.dailyTargets?.carbs || 200, color: "text-emerald-600" },
                { label: "Fat", c: logData.consumed?.fat || 0, t: logData.user?.dailyTargets?.fat || 65, color: "text-orange-600" },
              ].map((m) => {
                const consumed = Math.round(m.c);
                const target = Math.round(m.t);
                const diff = target - consumed;
                return (
                  <div key={m.label} className="text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{m.label}</p>
                    <p className={`text-lg font-black mt-1 ${m.color}`}>
                      {consumed}g <span className="text-[10px] text-slate-400 font-medium">/ {target}g</span>
                    </p>
                    <p className={`text-[10px] font-semibold mt-0.5 ${diff < 0 ? "text-red-400" : "text-slate-500"}`}>
                      {diff < 0 ? `+${Math.abs(diff)}g over` : `${diff}g rem`}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Food Logs List */}
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Logged Meals & Foods</p>
              {(() => {
                const meals = logData.meals || {};
                const allMealLogs = [
                  ...(meals.breakfast || []),
                  ...(meals.lunch || []),
                  ...(meals.dinner || []),
                  ...(meals.custom || []),
                ];

                if (allMealLogs.length === 0) {
                  return (
                    <div className="p-4 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs font-semibold">
                      No foods logged by user on this day
                    </div>
                  );
                }

                return (
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                    {allMealLogs.map((item: any) => (
                      <div key={item._id} className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/50 border border-slate-100 rounded-2xl transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-base">
                            {item.mealType === "breakfast" ? "🌅" : item.mealType === "lunch" ? "☀️" : item.mealType === "dinner" ? "🌙" : "➕"}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{item.foodName}</p>
                            <p className="text-[10px] font-medium text-slate-500 mt-0.5">
                              {item.quantity} {item.unit} · {item.grams}g · <span className="capitalize">{item.mealType}</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-slate-900">{item.calories} kcal</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
