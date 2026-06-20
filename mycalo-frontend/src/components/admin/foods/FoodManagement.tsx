"use client";

import { useState } from "react";
import FoodSearch from "./FoodSearch";
import FoodTable from "./FoodTable";
import AddFoodModal from "./AddFoodModal";

export default function FoodManagement() {
  const [open, setOpen] = useState(false);

  const foods = [
    { _id: "1", name: "Apple", type: "countable", calories: 95, unit: "piece" },
    { _id: "2", name: "Banana", type: "countable", calories: 105, unit: "piece" },
    { _id: "3", name: "Chicken Mandi", type: "weighable", calories: 650, unit: "plate" },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-12">
      {/* ─── Top Header ─── */}
      <div className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-slate-100 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Food Management</h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">Database for AI scanning & Search</p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="px-5 py-2.5 rounded-[14px] bg-slate-900 text-white text-[13px] font-bold shadow-md hover:-translate-y-0.5 transition-transform"
        >
          + Add Food
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-8 pt-8 space-y-6">
        <FoodSearch />
        <FoodTable foods={foods} />
      </div>

      <AddFoodModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
