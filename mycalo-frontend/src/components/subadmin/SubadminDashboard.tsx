"use client";

import { api } from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface PendingVerification {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    profilePhoto?: string;
    createdAt: string;
  };
  specialization?: string;
  experience?: number;
  registrationNumber?: string;
  verificationStatus: string;
  createdAt: string;
}

interface DashboardData {
  pendingCount: number;
  pendingVerifications: PendingVerification[];
}

// ─── Approve/Reject Modal ──────────────────────────────────────────────────────
function RejectModal({
  onConfirm,
  onClose,
  loading,
}: {
  onConfirm: (reason: string) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[28px] shadow-2xl p-8 w-full max-w-md border border-slate-100">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-2xl mx-auto mb-4">❌</div>
        <h2 className="text-xl font-black text-slate-900 text-center mb-1">Reject Verification</h2>
        <p className="text-sm text-slate-500 text-center mb-6">Please provide a reason so the doctor can resubmit.</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter rejection reason..."
          rows={4}
          className="w-full border border-slate-200 rounded-[16px] p-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
        />
        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-[14px] border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={reason.trim().length < 5 || loading}
            onClick={() => onConfirm(reason.trim())}
            className="flex-1 py-3 rounded-[14px] bg-red-600 text-white font-bold text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Rejecting..." : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Doctor Verification Card ─────────────────────────────────────────────────
function VerificationCard({
  item,
  onApprove,
  onReject,
  onView,
  approving,
}: {
  item: PendingVerification;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onView: (id: string) => void;
  approving: string | null;
}) {
  const initial = item.userId?.name?.charAt(0).toUpperCase() ?? "D";
  const joinedDate = new Date(item.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-6 flex flex-col gap-5 hover:-translate-y-0.5 transition-transform duration-200">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-slate-800 to-slate-600 text-white flex items-center justify-center font-black text-lg shadow-md flex-shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-black text-slate-900 truncate">{item.userId?.name}</p>
          <p className="text-[12px] font-medium text-slate-500 truncate">{item.userId?.email}</p>
          {item.userId?.phone && (
            <p className="text-[11px] font-medium text-slate-400 mt-0.5">{item.userId.phone}</p>
          )}
        </div>
        <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-wider rounded-full border border-amber-100 flex-shrink-0">
          Pending
        </span>
      </div>

      {/* Info chips */}
      <div className="flex flex-wrap gap-2">
        {item.specialization && (
          <span className="px-3 py-1.5 bg-slate-50 text-slate-700 text-[11px] font-bold rounded-xl border border-slate-100">
            🩺 {item.specialization}
          </span>
        )}
        {item.experience !== undefined && (
          <span className="px-3 py-1.5 bg-slate-50 text-slate-700 text-[11px] font-bold rounded-xl border border-slate-100">
            ⏱ {item.experience} yr{item.experience !== 1 ? "s" : ""}
          </span>
        )}
        {item.registrationNumber && (
          <span className="px-3 py-1.5 bg-slate-50 text-slate-700 text-[11px] font-bold rounded-xl border border-slate-100 truncate max-w-[150px]">
            🆔 {item.registrationNumber}
          </span>
        )}
        <span className="px-3 py-1.5 bg-slate-50 text-slate-400 text-[11px] font-bold rounded-xl border border-slate-100 ml-auto">
          {joinedDate}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1 border-t border-slate-50">
        <button
          onClick={() => onView(item._id)}
          className="flex-1 py-2.5 rounded-[12px] border border-slate-200 text-slate-700 text-[12px] font-bold hover:bg-slate-50 transition-colors"
        >
          View Docs
        </button>
        <button
          onClick={() => onReject(item._id)}
          className="flex-1 py-2.5 rounded-[12px] border border-red-100 bg-red-50 text-red-600 text-[12px] font-bold hover:bg-red-100 transition-colors"
        >
          Reject
        </button>
        <button
          disabled={approving === item._id}
          onClick={() => onApprove(item._id)}
          className="flex-1 py-2.5 rounded-[12px] bg-emerald-600 text-white text-[12px] font-bold hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {approving === item._id ? "..." : "Approve"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function SubadminDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<DashboardData>({
    queryKey: ["subadmin-dashboard"],
    queryFn: async () => {
      const res = await api.get("/subadmin/dashboard");
      return res.data.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (doctorId: string) => {
      setApprovingId(doctorId);
      const res = await api.patch(`/subadmin/verifications/${doctorId}/approve`);
      return res.data;
    },
    onSuccess: () => {
      setApprovingId(null);
      queryClient.invalidateQueries({ queryKey: ["subadmin-dashboard"] });
    },
    onError: () => setApprovingId(null),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ doctorId, reason }: { doctorId: string; reason: string }) => {
      const res = await api.patch(`/subadmin/verifications/${doctorId}/reject`, { reason });
      return res.data;
    },
    onSuccess: () => {
      setRejectTarget(null);
      queryClient.invalidateQueries({ queryKey: ["subadmin-dashboard"] });
    },
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full animate-spin border-4 border-slate-200 border-t-slate-900" />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-[28px] shadow-sm border border-red-100 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">⚠️</div>
          <h1 className="text-xl font-black text-slate-900">Failed to Load</h1>
          <p className="text-sm text-slate-500 mt-2">Could not connect to the server.</p>
        </div>
      </div>
    );
  }

  const pending = data?.pendingVerifications ?? [];
  const pendingCount = data?.pendingCount ?? 0;

  return (
    <>
      {/* Reject Modal */}
      {rejectTarget && (
        <RejectModal
          loading={rejectMutation.isPending}
          onClose={() => setRejectTarget(null)}
          onConfirm={(reason) => rejectMutation.mutate({ doctorId: rejectTarget, reason })}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-12 font-sans">

        {/* ─── Header ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Verification Queue
            </h1>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">
              Sub-Admin Dashboard
            </p>
          </div>

          {/* Counter badge */}
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-full text-sm font-black border ${pendingCount > 0 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
              {pendingCount > 0 ? `${pendingCount} Pending` : "All Clear ✓"}
            </div>
          </div>
        </div>

        {/* ─── Stats strip ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex items-center gap-4">
            <div className="w-12 h-12 rounded-[16px] bg-amber-50 border border-amber-100 flex items-center justify-center text-xl">⏳</div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Verifications</p>
              <p className="text-3xl font-black text-slate-900 mt-0.5">{pendingCount}</p>
            </div>
          </div>
          <div
            className="bg-slate-900 rounded-[20px] p-5 border border-slate-800 flex items-center gap-4 cursor-pointer hover:bg-slate-800 transition-colors"
            onClick={() => router.push("/subadmin/doctors")}
          >
            <div className="w-12 h-12 rounded-[16px] bg-white/10 flex items-center justify-center text-xl">👨‍⚕️</div>
            <div className="flex-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">All Doctors</p>
              <p className="text-sm font-bold text-slate-300 mt-0.5">Manage → Deactivate / Delete</p>
            </div>
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </div>

        {/* ─── Pending Verifications ─── */}
        {pendingCount === 0 ? (
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-16 text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">✅</div>
            <h2 className="text-xl font-black text-slate-900">No Pending Verifications</h2>
            <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto">
              All doctor verification requests have been processed. Check back later.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-[13px] font-black text-slate-700 uppercase tracking-wider">
                Pending Reviews
              </h2>
              <div className="h-px flex-1 bg-slate-100" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {pending.map((item) => (
                <VerificationCard
                  key={item._id}
                  item={item}
                  approving={approvingId}
                  onApprove={(id) => approveMutation.mutate(id)}
                  onReject={(id) => setRejectTarget(id)}
                  onView={(id) => router.push(`/subadmin/verifications/${id}`)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
