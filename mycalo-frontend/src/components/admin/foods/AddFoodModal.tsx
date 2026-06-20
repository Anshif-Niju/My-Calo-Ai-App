"use client";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AddFoodModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-[32px] bg-white p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Add New Food</h2>
            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mt-1">Fill nutrition details per unit</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors">
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Food Name " className="rounded-[16px] border border-slate-200 p-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400" />
            <select className="rounded-[16px] border border-slate-200 p-3.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 bg-white">
              <option value="" disabled selected>
                Select Type...
              </option>
              <option value="countable">Countable </option>
              <option value="weighable">Weighable </option>
            </select>
          </div>

          {/* Measurements */}
          <div className="grid grid-cols-3 gap-4">
            <input
              type="number"
              placeholder="Default Qty "
              className="rounded-[16px] border border-slate-200 p-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
            />
            <input placeholder="Unit " className="rounded-[16px] border border-slate-200 p-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400" />
            <input
              type="number"
              placeholder="Default Grams"
              className="rounded-[16px] border border-slate-200 p-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
            />
          </div>

          {/* Macros */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-4 border-t border-slate-100">
            <input type="number" placeholder="Calories" className="col-span-2 md:col-span-1 rounded-[16px] border border-slate-200 p-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-400" />
            <input type="number" placeholder="Protein (g)" className="rounded-[16px] border border-slate-200 p-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-400" />
            <input type="number" placeholder="Carbs (g)" className="rounded-[16px] border border-slate-200 p-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-400" />
            <input type="number" placeholder="Fat (g)" className="rounded-[16px] border border-slate-200 p-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-400" />
            <input type="number" placeholder="Fiber (g)" className="rounded-[16px] border border-slate-200 p-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-400" />
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-[14px] bg-white border border-slate-200 px-6 py-2.5 text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button className="rounded-[14px] bg-slate-900 px-6 py-2.5 text-[13px] font-bold text-white shadow-md hover:-translate-y-0.5 transition-transform">Save Food</button>
        </div>
      </div>
    </div>
  );
}
