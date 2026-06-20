"use client";

import { api } from "@/lib/axios";
import { logoutAction } from "@/store/slices/auth.slice";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const revenueData = [
  { name: "Mon", revenue: 4000, users: 240 },
  { name: "Tue", revenue: 3000, users: 139 },
  { name: "Wed", revenue: 2000, users: 980 },
  { name: "Thu", revenue: 2780, users: 390 },
  { name: "Fri", revenue: 1890, users: 480 },
  { name: "Sat", revenue: 2390, users: 380 },
  { name: "Sun", revenue: 3490, users: 430 },
];

export default function AdminDashboard() {
  const router = useRouter();
  const dispatch = useDispatch();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const res = await api.get("/admin/dashboard");
      return res.data.dashboard;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full animate-spin border-4 border-slate-200 border-t-slate-900" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="bg-white p-8 rounded-[32px] shadow-sm text-center border border-red-100">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">⚠️</div>
          <h1 className="text-xl font-bold text-slate-900">Connection Failed</h1>
          <p className="text-sm text-slate-500 mt-2">Could not load dashboard data.</p>
        </div>
      </div>
    );
  }

  const stats = [
    { title: "Total Users", value: data?.totalUsers || 0, icon: "👥", color: "text-purple-600", bg: "bg-purple-50" },
    { title: "Total Doctors", value: data?.totalDoctors || 0, icon: "👨‍⚕️", color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Appointments", value: data?.totalAppointments || 0, icon: "📅", color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Pending Verify", value: data?.pendingVerifications || 0, icon: "⏳", color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-12 ">

      <div className="max-w-7xl mx-auto px-8 pt-8">
        {/* ─── Stats Grid ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((item) => (
            <div key={item.title} className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:-translate-y-1 transition-transform duration-300 group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{item.title}</p>
                  <h2 className="text-4xl font-black text-slate-900 mt-2 tracking-tight group-hover:scale-105 origin-left transition-transform">{item.value}</h2>
                </div>
                <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center text-xl ${item.bg} ${item.color}`}>{item.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ─── Charts Section ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Revenue/Activity Chart */}
          <div className="lg:col-span-2 bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <h3 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider mb-6 ml-2">Platform Growth</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} dx={-10} />
                  <Tooltip contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.08)" }} cursor={{ stroke: "#e2e8f0", strokeWidth: 2 }} />
                  <Line type="monotone" dataKey="users" stroke="#f97316" strokeWidth={4} dot={false} activeDot={{ r: 8, fill: "#f97316", stroke: "#fff", strokeWidth: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Secondary Metric Chart */}
          <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col">
            <h3 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider mb-6 ml-2">Active Sessions</h3>
            <div className="flex-1 min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} dy={10} />
                  <Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.08)" }} />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ─── Pending Actions Section ─── */}
        <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
          <div className="flex items-center justify-between mb-6 ml-2 mr-2">
            <h3 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider">Quick Actions</h3>
            <span className="px-3 py-1 bg-orange-50 text-orange-600 text-[11px] font-bold uppercase tracking-wider rounded-full">{data?.pendingVerifications || 0} Pending</span>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-[20px] border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-[12px] bg-white border border-slate-200 flex items-center justify-center text-lg shadow-sm">👨‍⚕️</div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Review Doctors</p>
                  <p className="text-[11px] font-medium text-slate-500 mt-0.5">Approve new doctor profiles</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 group-hover:text-slate-900 transition-colors shadow-sm">➔</div>
            </div>

            <div className="p-4 rounded-[20px] border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-[12px] bg-white border border-slate-200 flex items-center justify-center text-lg shadow-sm">⚙️</div>
                <div>
                  <p className="text-sm font-bold text-slate-900">System Settings</p>
                  <p className="text-[11px] font-medium text-slate-500 mt-0.5">Manage AI limits & configurations</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 group-hover:text-slate-900 transition-colors shadow-sm">➔</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
