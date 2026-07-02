"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { getErrorMessage } from "@/utils/errorHandler";
import { toast } from "sonner";

interface Food {
  _id: string;
  name: string;
  servingType: "countable" | "weighable";
  defaultQuantity: number;
  defaultUnit: string;
  defaultGrams: number;
  nutritionPerUnit?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  nutritionPer100g?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}

interface Props {
  foods: Food[];
}

export default function FoodTable({ foods }: Props) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/admin/foods/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-foods"] });
      toast.success("Food item deleted from database");
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err, "Failed to delete food item"));
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}" from the database?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Food Name</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Serving Type & Unit</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Calories</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {foods.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                  No food items found in the database.
                </td>
              </tr>
            ) : (
              foods.map((food) => {
                const calories = food.servingType === "countable" 
                  ? food.nutritionPerUnit?.calories 
                  : food.nutritionPer100g?.calories;

                const unitText = food.servingType === "countable"
                  ? `${food.defaultQuantity} ${food.defaultUnit || 'piece'}`
                  : `100g`;

                return (
                  <tr key={food._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-[14px] font-bold text-slate-900">{food.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                        {food.servingType} • {unitText}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[14px] font-black text-orange-500">
                        {calories ?? 0} <span className="text-[11px] font-bold text-slate-400">KCAL</span>
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDelete(food._id, food.name)}
                          disabled={deleteMutation.isPending}
                          className="px-3 py-1.5 bg-red-50 border border-red-100 rounded-xl text-[12px] font-bold text-red-600 hover:bg-red-100 shadow-sm transition-all disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

