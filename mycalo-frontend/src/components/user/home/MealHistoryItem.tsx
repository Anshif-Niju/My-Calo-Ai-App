"use client";
import Image from "next/image";
import { MealHistoryItemProps } from "../../../types/nutrients.types";

export default function MealHistoryItem({ foodName, calories, protein, carbs, fat, imageUrl, category, mealType, createdAt, onDelete }: MealHistoryItemProps) {
  const time = new Date(createdAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="group relative bg-white p-4 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
      <div className="flex items-center gap-4">
        {/* Food Image / Placeholder */}
        <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 bg-slate-50 border border-slate-100 flex items-center justify-center relative">
          {imageUrl ? <Image src={imageUrl} alt={foodName} fill className="object-cover" sizes="56px" /> : <span className="text-xl">🍽️</span>}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium text-slate-900 text-[15px] leading-tight">{foodName}</h3>
                {category && (
                  <span className="text-[9px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-slate-100">
                    {category}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-medium text-slate-400 mt-1.5 uppercase tracking-wider">
                {mealType} • {time}
              </p>
            </div>

            <div className="text-right">
              <span className="text-lg font-bold text-slate-900">{calories}</span>
              <span className="text-[10px] font-bold text-slate-400 ml-0.5 uppercase">kcal</span>
            </div>
          </div>

          {/* Macros (Clean minimal style with dot indicators) */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {/* Protein - Purple */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-100">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
              <span className="text-[10px] font-bold text-purple-700">Protein {protein}g</span>
            </div>

            {/* Carbs - Green */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              <span className="text-[10px] font-bold text-emerald-700">Carbs {carbs}g</span>
            </div>

            {/* Fat - Orange */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-100">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
              <span className="text-[10px] font-bold text-orange-700">Fat {fat}g</span>
            </div>
          </div>
        </div>

        {/* Delete Button (Appears as a floating badge on hover) */}
        {onDelete && (
          <button
            onClick={onDelete}
            className="absolute -top-2 -right-2 w-7 h-7 bg-white border border-slate-100 shadow-sm rounded-full flex items-center justify-center text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all duration-200"
            title="Delete meal">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
