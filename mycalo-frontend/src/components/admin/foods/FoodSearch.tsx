"use client";

interface Props {
  search: string;
  setSearch: (s: string) => void;
}

export default function FoodSearch({ search, setSearch }: Props) {
  return (
    <div className="relative w-full max-w-md">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <span className="text-slate-400 text-lg">🔍</span>
      </div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search foods in database..."
        className="w-full rounded-[16px] border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all shadow-sm"
      />
    </div>
  );
}
