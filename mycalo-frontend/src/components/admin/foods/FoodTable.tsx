interface Food {
  _id: string;
  name: string;
  type: string;
  calories: number;
  unit: string;
}

interface Props {
  foods: Food[];
}

export default function FoodTable({ foods }: Props) {
  return (
    <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Food Name</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Type & Unit</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Calories</th>
              <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {foods.map((food) => (
              <tr key={food._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <p className="text-[14px] font-bold text-slate-900">{food.name}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                    {food.type} • {food.unit}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-[14px] font-black text-orange-500">{food.calories} <span className="text-[11px] font-bold text-slate-400">KCAL</span></p>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[12px] font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all">
                      Edit
                    </button>
                    <button className="px-3 py-1.5 bg-red-50 border border-red-100 rounded-xl text-[12px] font-bold text-red-600 hover:bg-red-100 shadow-sm transition-all">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
