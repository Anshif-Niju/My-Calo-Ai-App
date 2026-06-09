"use client";

interface CalorieRingProps {
  consumed: number;
  target: number;
  size?: number;
}

export default function CalorieRing({ consumed, target, size = 120 }: CalorieRingProps) {
  const progress = Math.min(100, Math.round((consumed / target) * 100));
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (progress / 100) * circumference;
  const remaining = Math.max(0, target - consumed);
  const isOver = consumed > target;

  return (
    <div className="flex items-center justify-center" style={{ width: size, height: size }}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background circle */}
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={10} />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={isOver ? "#ff4e6a" : "#ffffff"}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={`${strokeDash} ${circumference}`}
            style={{ transition: "stroke-dasharray 0.8s ease" }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-white leading-none">{remaining.toLocaleString()}</span>
          <span className="text-xs font-medium mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
            {isOver ? "over" : "left"}
          </span>
        </div>
      </div>
    </div>
  );
}
