"use client";

interface CalorieRingProps {
  consumed: number;
  target: number;
  size?: number;
  isOver?: boolean;
}

export default function CalorieRing({ consumed, target, size = 120 }: CalorieRingProps) {
  const progress = Math.min(100, Math.round((consumed / target) * 100));
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (progress / 100) * circumference;
  const isOver = consumed > target;

  return (
    <div className="flex items-center justify-center" style={{ width: size, height: size }}>
      <div className="relative drop-shadow-sm" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={10}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={isOver ? "#ef4444" : "#f97316"}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={`${strokeDash} ${circumference}`}
            style={{ transition: "stroke-dasharray 0.8s ease-in-out" }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center mt-0.5">
          <span className={`text-2xl font-black leading-none tracking-tight ${isOver ? 'text-red-500' : 'text-slate-900'}`}>
            {consumed.toLocaleString()}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider mt-1 text-slate-400">
            consumed
          </span>
        </div>
      </div>
    </div>
  );
}
