"use client";
import { MacroCardProps } from "@/types/home.types";
export default function MacroCard({ label, consumed, target, unit, color, icon }: MacroCardProps) {
  const progress = Math.min(100, Math.round((consumed / target) * 100));

  const remaining = Number(Math.max(0, target - consumed).toFixed(1));

  const isOver = consumed > target;

  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-between p-3 rounded-2xl" style={{ background: "var(--surface)" }}>
      {/* Mini ring */}
      <div className="relative w-14 h-14">
        <svg width={56} height={56} className="-rotate-90">
          <circle cx={28} cy={28} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6} />
          <circle cx={28} cy={28} r={radius} fill="none" stroke={isOver ? "#ff4e6a" : color} strokeWidth={6} strokeLinecap="round" strokeDasharray={`${strokeDash} ${circumference}`} style={{ transition: "stroke-dasharray 0.8s ease" }} />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center text-base">{icon}</div>
      </div>

      <div className="text-center mt-2">
        <p className="text-base font-black text-white leading-none">
          {remaining}
          {unit}
        </p>

        <p className="text-[10px] font-semibold mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
          {label} {isOver ? "over" : "left"}
        </p>
      </div>
    </div>
  );
}
