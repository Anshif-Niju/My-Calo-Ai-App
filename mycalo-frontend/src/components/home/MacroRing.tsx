// components/MacroRing.tsx
"use client";

interface MacroRingProps {
  consumed: number;
  target: number;
  color: string;
}

export default function MacroRing({ consumed, target, color }: MacroRingProps) {
  const percent = target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0;
  const isOver = consumed > target;
  const ringColor = isOver ? "#ef4444" : color;

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (percent / 100) * circumference;
  const linecap = percent < 4 ? "butt" : "round";

  return (
    <div className="relative w-18 h-18 lg:w-18 lg:h-18 shrink-0 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="10" />
        {percent > 0 && (
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth="10"
            strokeLinecap={linecap}
            strokeDasharray={`${strokeDash} ${circumference}`}
            style={{ transition: "stroke-dasharray 0.8s ease" }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] lg:text-[12px] font-black" style={{ color: ringColor }}>
          {percent}%
        </span>
      </div>
    </div>
  );
}
