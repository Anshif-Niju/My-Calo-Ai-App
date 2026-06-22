"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import FoodSearch from "./FoodSearch";
import FoodTable from "./FoodTable";
import AddFoodModal from "./AddFoodModal";

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

interface FoodsResponse {
  foods: Food[];
  total: number;
  page: number;
  limit: number;
}

const LIMIT = 10;

export default function FoodManagement() {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery<FoodsResponse>({
    queryKey: ["admin-foods", page, search],
    queryFn: async () => {
      const res = await api.get("/admin/foods", {
        params: { page, limit: LIMIT, search },
      });
      return res.data;
    },
  });

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 1;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-12">
      {/* ─── Top Header ─── */}
      <div className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-slate-100 px-4 sm:px-8 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Food Database</h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">
            {data?.total ?? 0} Database items for AI scanning & Search
          </p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="px-5 py-2.5 rounded-[14px] bg-slate-900 text-white text-[13px] font-bold shadow-md hover:-translate-y-0.5 transition-transform w-fit"
        >
          + Add Food
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        <FoodSearch search={search} setSearch={(s) => { setSearch(s); setPage(1); }} />
        
        {isLoading ? (
          <div className="bg-white rounded-[24px] border border-slate-100 p-12 text-center">
            <div className="w-8 h-8 rounded-full animate-spin border-4 border-slate-200 border-t-slate-900 mx-auto" />
            <p className="text-sm text-slate-400 mt-3 font-semibold">Loading foods database...</p>
          </div>
        ) : (
          <>
            <FoodTable foods={data?.foods || []} />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-white rounded-[24px] border border-slate-100 flex items-center justify-between shadow-sm">
                <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 shadow-sm transition-all"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 shadow-sm transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <AddFoodModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
