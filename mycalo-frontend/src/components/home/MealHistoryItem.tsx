"use client";

interface MealHistoryItemProps {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  imageUrl?: string;
  mealType: string;
  createdAt: string;
  onDelete?: () => void;
}

export default function MealHistoryItem({ foodName, calories, protein, carbs, fat, imageUrl, mealType, createdAt, onDelete }: MealHistoryItemProps) {
  const time = new Date(createdAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: "var(--surface)" }}>
      {/* Food image */}
      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0" style={{ background: "var(--bg3)" }}>
        {imageUrl ? <img src={imageUrl} alt={foodName} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-bold text-white truncate">{foodName}</p>
          <span className="text-xs ml-2 shrink-0" style={{ color: "var(--text3)" }}>
            {time}
          </span>
        </div>
        <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--lime)" }}>
          🔥 {calories} kcal
        </p>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold" style={{ color: "rgba(255,100,100,0.9)" }}>
            ⚡ {protein}g
          </span>
          <span className="text-[10px] font-bold" style={{ color: "rgba(255,180,50,0.9)" }}>
            🌾 {carbs}g
          </span>
          <span className="text-[10px] font-bold" style={{ color: "rgba(100,150,255,0.9)" }}>
            💧 {fat}g
          </span>
        </div>
      </div>

      {/* Delete */}
      {onDelete && (
        <button onClick={onDelete} className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all hover:opacity-70" style={{ background: "rgba(255,78,106,0.15)", color: "#ff4e6a" }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
