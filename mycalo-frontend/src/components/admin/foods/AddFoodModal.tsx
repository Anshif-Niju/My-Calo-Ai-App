"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AddFoodModal({ open, onClose }: Props) {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [servingType, setServingType] = useState<"countable" | "weighable">("countable");
  const [defaultQuantity, setDefaultQuantity] = useState("1");
  const [defaultUnit, setDefaultUnit] = useState("piece");
  const [defaultGrams, setDefaultGrams] = useState("100");

  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [fiber, setFiber] = useState("");

  const addMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post("/admin/foods", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-foods"] });
      toast.success("Food item added to database successfully! 🎉");
      handleClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to add food item");
    },
  });

  const handleClose = () => {
    // Reset state
    setName("");
    setServingType("countable");
    setDefaultQuantity("1");
    setDefaultUnit("piece");
    setDefaultGrams("100");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setFiber("");
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Food name is required");

    const macros = {
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      fiber: parseFloat(fiber) || 0,
    };

    const payload: any = {
      name: name.trim(),
      servingType,
      defaultQuantity: parseFloat(defaultQuantity) || 1,
      defaultUnit: servingType === "countable" ? defaultUnit : "g",
      defaultGrams: parseFloat(defaultGrams) || 100,
    };

    if (servingType === "countable") {
      payload.nutritionPerUnit = macros;
      // also compute per 100g estimate if defaultGrams exists
      const ratio = 100 / (parseFloat(defaultGrams) || 100);
      payload.nutritionPer100g = {
        calories: Math.round(macros.calories * ratio),
        protein: Math.round(macros.protein * ratio * 10) / 10,
        carbs: Math.round(macros.carbs * ratio * 10) / 10,
        fat: Math.round(macros.fat * ratio * 10) / 10,
        fiber: Math.round(macros.fiber * ratio * 10) / 10,
      };
    } else {
      payload.nutritionPer100g = macros;
      payload.nutritionPerUnit = {
        calories: Math.round(macros.calories * (payload.defaultGrams / 100)),
        protein: Math.round(macros.protein * (payload.defaultGrams / 100) * 10) / 10,
        carbs: Math.round(macros.carbs * (payload.defaultGrams / 100) * 10) / 10,
        fat: Math.round(macros.fat * (payload.defaultGrams / 100) * 10) / 10,
        fiber: Math.round(macros.fiber * (payload.defaultGrams / 100) * 10) / 10,
      };
    }

    addMutation.mutate(payload);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[32px] bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200 [scrollbar-width:thin]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Add New Food</h2>
          </div>
          <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Food Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder=""
                className="w-full rounded-[16px] border border-slate-200 p-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Serving Type</label>
              <select
                value={servingType}
                onChange={(e) => setServingType(e.target.value as any)}
                className="w-full rounded-[16px] border border-slate-200 p-3.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 bg-white">
                <option value="countable">Countable </option>
                <option value="weighable">Weighable </option>
              </select>
            </div>
          </div>

          {/* Measurements */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Default Quantity</label>
              <input
                type="number"
                step="any"
                value={defaultQuantity}
                onChange={(e) => setDefaultQuantity(e.target.value)}
                placeholder="Default Qty"
                className="w-full rounded-[16px] border border-slate-200 p-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Default Unit</label>
              <input
                disabled={servingType === "weighable"}
                value={servingType === "weighable" ? "g" : defaultUnit}
                onChange={(e) => setDefaultUnit(e.target.value)}
                placeholder=""
                className="w-full rounded-[16px] border border-slate-200 p-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Default Weight (Grams)</label>
              <input
                type="number"
                step="any"
                value={defaultGrams}
                onChange={(e) => setDefaultGrams(e.target.value)}
                placeholder="Default Grams"
                className="w-full rounded-[16px] border border-slate-200 p-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
              />
            </div>
          </div>

          {/* Macros */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Nutrients {servingType === "countable" ? `(per 1 ${defaultUnit || "piece"})` : `(per 100g)`}</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-4 border-t border-slate-100">
              <input
                type="number"
                step="any"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="Calories"
                className="col-span-2 sm:col-span-1 md:col-span-1 rounded-[16px] border border-slate-200 p-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-400"
              />
              <input
                type="number"
                step="any"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="Protein (g)"
                className="rounded-[16px] border border-slate-200 p-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-400"
              />
              <input
                type="number"
                step="any"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                placeholder="Carbs (g)"
                className="rounded-[16px] border border-slate-200 p-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-400"
              />
              <input
                type="number"
                step="any"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                placeholder="Fat (g)"
                className="rounded-[16px] border border-slate-200 p-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-400"
              />
              <input
                type="number"
                step="any"
                value={fiber}
                onChange={(e) => setFiber(e.target.value)}
                placeholder="Fiber (g)"
                className="rounded-[16px] border border-slate-200 p-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-50">
            <button type="button" onClick={handleClose} className="rounded-[14px] bg-white border border-slate-200 px-6 py-2.5 text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={addMutation.isPending} className="rounded-[14px] bg-slate-900 px-6 py-2.5 text-[13px] font-bold text-white shadow-md hover:-translate-y-0.5 transition-transform disabled:opacity-50">
              {addMutation.isPending ? "Saving..." : "Save Food"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
