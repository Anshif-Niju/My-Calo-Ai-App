export default function DoctorsPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[32px] p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 animate-in fade-in duration-300">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">🩺</div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">Find Doctors</h1>
        <p className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-4">Coming Soon</p>
        <p className="text-sm text-slate-500 font-medium leading-relaxed">
          Consult with verified doctors and certified nutritionists directly from the app. You'll be able to book appointments and start secure video calls.
        </p>
      </div>
    </div>
  );
}
