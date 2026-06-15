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
  const remaining = Math.max(0, target - consumed);
  const isOver = consumed > target;

  return (
    <div className="flex items-center justify-center" style={{ width: size, height: size }}>
      {/* ചെറിയൊരു drop-shadow കൊടുത്തത് റിങ്ങിന് ഒരു 3D ഫീൽ കിട്ടാനാണ് */}
      <div className="relative drop-shadow-sm" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background circle (Light Theme) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f1f5f9" // പുതിയ സ്ലേറ്റ് കളർ (Light Gray)
            strokeWidth={10}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={isOver ? "#ef4444" : "#f97316"} // Over ആണെങ്കിൽ ചുവപ്പ്, അല്ലെങ്കിൽ നമ്മുടെ ബ്രാൻഡ് ഓറഞ്ച്
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={`${strokeDash} ${circumference}`}
            style={{ transition: "stroke-dasharray 0.8s ease-in-out" }}
          />
        </svg>

        {/* Center text (Light Theme) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-black leading-none tracking-tight ${isOver ? 'text-red-500' : 'text-slate-900'}`}>
            {remaining.toLocaleString()}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider mt-1 text-slate-400">
            {isOver ? "over" : "left"}
          </span>
        </div>
      </div>
    </div>
  );
}
