"use client";

import { MacroCardProps } from "@/types/nutrients.types";

export default function MacroCard({ label, consumed, target, unit }: MacroCardProps) {
  const progress = Math.min(100, Math.round((consumed / target) * 100));

  // ഓരോ മാക്രോകൾക്കും വേണ്ടിയുള്ള സോഫ്റ്റ് കളർ തീമുകൾ (Meally AI Style)
  const getTheme = (macroLabel: string) => {
    switch (macroLabel.toLowerCase()) {
      case "protein":
        return { bg: "bg-purple-50", border: "border-purple-100", text: "text-purple-600" };
      case "carbs":
        return { bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-600" };
      case "fats":
      case "fat":
        return { bg: "bg-orange-50", border: "border-orange-100", text: "text-orange-600" };
      default:
        return { bg: "bg-slate-50", border: "border-slate-100", text: "text-slate-600" };
    }
  };

  const theme = getTheme(label);

  return (
    <div className={`p-4 rounded-[24px] border ${theme.bg} ${theme.border} shadow-sm transition-transform hover:-translate-y-1 duration-300`}>
      {/* Percentage Badge (പഴയ സർക്കിൾ റിങ്ങിന് പകരം) */}
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white mb-3 shadow-[0_2px_8px_rgb(0,0,0,0.04)]">
        <span className={`text-xs font-black ${theme.text}`}>{progress}%</span>
      </div>

      {/* Consumed Amount */}
      <p className={`text-xl font-black ${theme.text} leading-none`}>
        {consumed}
        <span className="text-[11px] ml-0.5 font-bold">{unit}</span>
      </p>

      {/* Label */}
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1.5">{label}</p>
    </div>
  );
}
