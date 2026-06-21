"use client";

import { api } from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

interface User {
  _id: string;
  name: string;
  email: string;
  isVerified: boolean;
  isBlocked: boolean;
  createdAt: string;
}

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

const LIMIT = 10;

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "blocked" | "active">("all");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<UsersResponse>({
    queryKey: ["admin-users", page, filter],
    queryFn: async () => {
      const params: Record<string, any> = { page, limit: LIMIT };
      if (filter === "blocked") params.isBlocked = true;
      if (filter === "active") params.isBlocked = false;
      const res = await api.get("/admin/users", { params });
      return res.data;
    },
  });

  const blockMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/admin/users/${id}/block`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/admin/users/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete ${name}? This action cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 1;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-12">

      {/* ─── Top Navbar / Header (Glassmorphism) ─── */}
      <div className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-slate-100 px-4 sm:px-8 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">User Management</h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">{data?.total ?? 0} Registered Users</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-50 rounded-[18px] border border-slate-100 shadow-inner w-fit">
          {(["all", "active", "blocked"] as const).map((f) => {
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => {
                  setFilter(f);
                  setPage(1);
                }}
                className={`px-4 sm:px-5 py-2 rounded-[14px] text-[13px] font-bold transition-all duration-300 ${
                  isActive ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">

        {/* ─── Users Table ─── */}
        <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">User Details</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Joined Date</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="w-8 h-8 rounded-full animate-spin border-4 border-slate-200 border-t-slate-900 mx-auto" />
                    </td>
                  </tr>
                ) : data?.users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-2xl mx-auto mb-3">👻</div>
                      <p className="text-slate-900 font-bold">No users found</p>
                      <p className="text-sm text-slate-400 mt-1">Try changing your filters</p>
                    </td>
                  </tr>
                ) : (
                  data?.users.map((user) => (
                    <tr key={user._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-[14px] bg-slate-900 text-white flex items-center justify-center font-bold shadow-sm">
                            {user.name?.charAt(0).toUpperCase() ?? "U"}
                          </div>
                          <div>
                            <p className="text-[15px] font-bold text-slate-900">{user.name}</p>
                            <p className="text-[12px] font-medium text-slate-500 mt-0.5">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${user.isVerified ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                            {user.isVerified ? "Verified" : "Pending"}
                          </span>
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${user.isBlocked ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-600"}`}>
                            {user.isBlocked ? "Blocked" : "Active"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[13px] font-medium text-slate-600">
                          {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                          <Link href={`/admin/users/${user._id}`} className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[12px] font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all">
                            View
                          </Link>
                          <button onClick={() => blockMutation.mutate(user._id)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[12px] font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all">
                            {user.isBlocked ? "Unblock" : "Block"}
                          </button>
                          <button onClick={() => handleDelete(user._id, user.name)} className="px-3 py-1.5 bg-red-50 border border-red-100 rounded-xl text-[12px] font-bold text-red-600 hover:bg-red-100 shadow-sm transition-all">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">
              Page {page} of {totalPages || 1}
            </p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 shadow-sm transition-all">
                Previous
              </button>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 shadow-sm transition-all">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
