"use client";

import { api } from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface DoctorUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  isBlocked: boolean;
  createdAt: string;
  verification: {
    _id: string;
    verificationStatus: string;
    specialization?: string;
    experience?: number;
  } | null;
  profile: {
    isProfileComplete: boolean;
    isActive: boolean;
    consultationFee?: number;
  } | null;
}

interface DoctorsResponse {
  doctors: DoctorUser[];
  total: number;
  page: number;
  limit: number;
}

const LIMIT = 10;

// ─── Status badge colours ──────────────────────────────────────────────────────
const VS_STYLE: Record<string, string> = {
  approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
  pending: "bg-amber-50 text-amber-700 border-amber-100",
  rejected: "bg-red-50 text-red-700 border-red-100",
  under_review: "bg-blue-50 text-blue-700 border-blue-100",
  not_submitted: "bg-slate-50 text-slate-500 border-slate-100",
};
const VS_LABEL: Record<string, string> = {
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
  under_review: "Under Review",
  not_submitted: "Not Submitted",
};

// ─── Delete confirm modal ──────────────────────────────────────────────────────
function DeleteModal({
  doctorName,
  onConfirm,
  onClose,
  loading,
}: {
  doctorName: string;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[28px] shadow-2xl p-8 w-full max-w-sm border border-slate-100 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-3xl mx-auto mb-4">🗑️</div>
        <h2 className="text-xl font-black text-slate-900 mb-2">Delete Doctor?</h2>
        <p className="text-sm text-slate-500 mb-1">
          You are about to permanently delete <strong>{doctorName}</strong>.
        </p>
        <p className="text-xs text-red-500 font-bold mb-6">
          ⚠️ This removes ALL data — user, verification & profile. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-[14px] border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            disabled={loading}
            onClick={onConfirm}
            className="flex-1 py-3 rounded-[14px] bg-red-600 text-white font-bold text-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Deleting..." : "Delete Permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function SubadminDoctorsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DoctorUser | null>(null);

  const { data, isLoading } = useQuery<DoctorsResponse>({
    queryKey: ["subadmin-doctors", page, search],
    queryFn: async () => {
      const res = await api.get("/subadmin/doctors", { params: { page, limit: LIMIT, search } });
      return res.data.data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.patch(`/subadmin/doctors/${userId}/toggle-status`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subadmin-doctors"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.delete(`/subadmin/doctors/${userId}`);
      return res.data;
    },
    onSuccess: () => {
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["subadmin-doctors"] });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 1;

  return (
    <>
      {deleteTarget && (
        <DeleteModal
          doctorName={deleteTarget.name}
          loading={deleteMutation.isPending}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
        />
      )}

      <div className="min-h-screen bg-[#f8fafc] font-sans pb-12">

        {/* ─── Header ─── */}
        <div className="sticky top-16 lg:top-16 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-4 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Doctors</h1>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">{data?.total ?? 0} registered doctors</p>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name or email..."
              className="flex-1 sm:w-64 px-4 py-2.5 rounded-[14px] border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50"
            />
            <button type="submit" className="px-5 py-2.5 rounded-[14px] bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors">
              Search
            </button>
          </form>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">

          {/* ─── Table ─── */}
          <div className="bg-white rounded-[28px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100">
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Doctor</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Verification</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Profile</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Account</th>
                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <div className="w-8 h-8 rounded-full animate-spin border-4 border-slate-200 border-t-slate-900 mx-auto" />
                      </td>
                    </tr>
                  ) : data?.doctors.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-2xl mx-auto mb-3">👨‍⚕️</div>
                        <p className="font-black text-slate-900">No doctors found</p>
                        <p className="text-sm text-slate-400 mt-1">Try a different search term</p>
                      </td>
                    </tr>
                  ) : (
                    data?.doctors.map((doc) => {
                      const vs = doc.verification?.verificationStatus ?? "not_submitted";
                      return (
                        <tr
                          key={doc._id}
                          className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors group cursor-pointer"
                          onClick={() => router.push(`/subadmin/doctors/${doc._id}`)}
                        >
                          {/* Doctor info */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-slate-800 to-slate-600 text-white flex items-center justify-center font-black text-base shadow-sm flex-shrink-0">
                                {doc.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-[14px] font-black text-slate-900">{doc.name}</p>
                                <p className="text-[12px] font-medium text-slate-500">{doc.email}</p>
                                {doc.verification?.specialization && (
                                  <p className="text-[11px] font-bold text-slate-400">{doc.verification.specialization}</p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Verification status */}
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${VS_STYLE[vs] ?? VS_STYLE.not_submitted}`}>
                              {VS_LABEL[vs] ?? vs}
                            </span>
                          </td>

                          {/* Profile status */}
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${doc.profile?.isProfileComplete ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"}`}>
                              {doc.profile?.isProfileComplete ? "Complete" : "Pending Setup"}
                            </span>
                          </td>

                          {/* Account status */}
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${doc.isBlocked ? "bg-red-50 text-red-600 border-red-100" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                              {doc.isBlocked ? "Deactivated" : "Active"}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => router.push(`/subadmin/doctors/${doc._id}`)}
                                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[12px] font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
                              >
                                View
                              </button>
                              <button
                                onClick={() => toggleMutation.mutate(doc._id)}
                                disabled={toggleMutation.isPending}
                                className={`px-3 py-1.5 rounded-xl text-[12px] font-bold border shadow-sm transition-all disabled:opacity-50 ${doc.isBlocked ? "bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-amber-50 border-amber-100 text-amber-700 hover:bg-amber-100"}`}
                              >
                                {doc.isBlocked ? "Activate" : "Deactivate"}
                              </button>
                              <button
                                onClick={() => setDeleteTarget(doc)}
                                className="px-3 py-1.5 bg-red-50 border border-red-100 rounded-xl text-[12px] font-bold text-red-600 hover:bg-red-100 shadow-sm transition-all"
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

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                Page {page} of {totalPages || 1}
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
          </div>
        </div>
      </div>
    </>
  );
}
