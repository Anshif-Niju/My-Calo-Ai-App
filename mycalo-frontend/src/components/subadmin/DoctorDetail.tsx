"use client";

import { api } from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

interface DoctorDetailResponse {
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    countryCode?: string;
    profilePhoto?: string;
    isBlocked: boolean;
    isEmailVerified: boolean;
    onboardingCompleted: boolean;
    createdAt: string;
    role: string;
  };
  verification: {
    _id: string;
    specialization?: string;
    experience?: number;
    registrationNumber?: string;
    registrationCouncil?: string;
    registrationYear?: number;
    verificationStatus: string;
    rejectionReason?: string;
    documents?: {
      mcuCertificate?: string;
      degreeCertificate?: string;
      governmentId?: string;
    };
    createdAt: string;
  } | null;
  profile: {
    name: string;
    email: string;
    specialization: string;
    experience: number;
    qualifications: string[];
    about: string;
    consultationFee: number;
    isProfileComplete: boolean;
    isActive: boolean;
  } | null;
}

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

function InfoRow({ label, value }: { label: string; value?: string | number | boolean | null }) {
  const display = value === undefined || value === null || value === "" ? "—" : String(value);
  return (
    <div className="p-4 rounded-[16px] bg-slate-50 border border-slate-100">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-[14px] font-bold text-slate-900">{display}</p>
    </div>
  );
}

function DeleteModal({ name, onConfirm, onClose, loading }: { name: string; onConfirm: () => void; onClose: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[28px] shadow-2xl p-8 w-full max-w-sm border border-slate-100 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-3xl mx-auto mb-4">🗑️</div>
        <h2 className="text-xl font-black text-slate-900 mb-2">Delete {name}?</h2>
        <p className="text-xs text-red-500 font-bold mb-6">⚠️ Permanently removes ALL data. Cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-[14px] border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50">Cancel</button>
          <button disabled={loading} onClick={onConfirm} className="flex-1 py-3 rounded-[14px] bg-red-600 text-white font-bold text-sm hover:bg-red-700 disabled:opacity-50">
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DoctorDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showDelete, setShowDelete] = useState(false);

  const { data, isLoading, isError } = useQuery<DoctorDetailResponse>({
    queryKey: ["subadmin-doctor-detail", userId],
    queryFn: async () => {
      const res = await api.get(`/subadmin/doctors/${userId}`);
      return res.data.data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/subadmin/doctors/${userId}/toggle-status`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subadmin-doctor-detail", userId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await api.delete(`/subadmin/doctors/${userId}`);
      return res.data;
    },
    onSuccess: () => {
      router.push("/subadmin/doctors");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full animate-spin border-4 border-slate-200 border-t-slate-900" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-[28px] border border-red-100 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="font-black text-slate-900">Doctor not found</h1>
          <button onClick={() => router.back()} className="mt-4 px-5 py-2 rounded-[12px] bg-slate-900 text-white text-sm font-bold">Go Back</button>
        </div>
      </div>
    );
  }

  const { user, verification, profile } = data;
  const vs = verification?.verificationStatus ?? "not_submitted";

  return (
    <>
      {showDelete && (
        <DeleteModal
          name={user.name}
          loading={deleteMutation.isPending}
          onClose={() => setShowDelete(false)}
          onConfirm={() => deleteMutation.mutate()}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-12 font-sans">

        {/* Back */}
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm font-bold mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Doctors
        </button>

        {/* ─── Identity ─── */}
        <div className="bg-white rounded-[28px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-slate-800 to-slate-600 text-white flex items-center justify-center font-black text-2xl shadow-lg flex-shrink-0">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl font-black text-slate-900">{user.name}</h1>
                <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${VS_STYLE[vs]}`}>
                  {VS_LABEL[vs]}
                </span>
                <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${user.isBlocked ? "bg-red-50 text-red-600 border-red-100" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                  {user.isBlocked ? "Deactivated" : "Active"}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                <span>📧 {user.email}</span>
                {user.phone && <span>📱 {user.countryCode} {user.phone}</span>}
                <span>📅 Joined {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-slate-100">
            {verification && (vs === "pending" || vs === "under_review") && (
              <button
                onClick={() => router.push(`/subadmin/verifications/${verification._id}`)}
                className="flex-1 py-3 rounded-[14px] border border-amber-200 bg-amber-50 text-amber-700 font-black text-sm hover:bg-amber-100 transition-colors"
              >
                📋 Review Verification Docs
              </button>
            )}
            <button
              disabled={toggleMutation.isPending}
              onClick={() => toggleMutation.mutate()}
              className={`flex-1 py-3 rounded-[14px] font-black text-sm transition-colors disabled:opacity-50 ${user.isBlocked ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"}`}
            >
              {user.isBlocked ? "✓ Activate Doctor" : "⊘ Deactivate Doctor"}
            </button>
            <button
              onClick={() => setShowDelete(true)}
              className="flex-1 py-3 rounded-[14px] border border-red-200 bg-red-50 text-red-600 font-black text-sm hover:bg-red-100 transition-colors"
            >
              🗑️ Delete Doctor
            </button>
          </div>
        </div>

        {/* ─── Verification Info ─── */}
        {verification && (
          <div className="bg-white rounded-[28px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-8 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[13px] font-black text-slate-700 uppercase tracking-wider">Verification Details</h2>
              {(vs === "pending" || vs === "under_review") && (
                <button
                  onClick={() => router.push(`/subadmin/verifications/${verification._id}`)}
                  className="px-4 py-1.5 rounded-[10px] bg-slate-900 text-white text-[11px] font-black hover:bg-slate-800 transition-colors"
                >
                  Review →
                </button>
              )}
            </div>

            {verification.rejectionReason && (
              <div className="mb-5 p-4 rounded-[16px] bg-red-50 border border-red-100">
                <p className="text-[11px] font-black text-red-500 uppercase tracking-wider mb-1">Rejection Reason</p>
                <p className="text-sm text-red-700">{verification.rejectionReason}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow label="Specialization" value={verification.specialization} />
              <InfoRow label="Experience" value={verification.experience !== undefined ? `${verification.experience} years` : undefined} />
              <InfoRow label="Registration Number" value={verification.registrationNumber} />
              <InfoRow label="Registration Council" value={verification.registrationCouncil} />
              <InfoRow label="Registration Year" value={verification.registrationYear} />
            </div>
          </div>
        )}

        {/* ─── Doctor Profile (setup info - coming soon) ─── */}
        <div className="bg-white rounded-[28px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-8">
          <h2 className="text-[13px] font-black text-slate-700 uppercase tracking-wider mb-5">Doctor Profile</h2>

          {!profile ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-2xl mx-auto mb-3">🔧</div>
              <p className="font-black text-slate-700">Profile Not Set Up</p>
              <p className="text-sm text-slate-400 mt-1">The doctor hasn't completed their profile setup yet.</p>
              <div className="mt-3 px-4 py-1.5 inline-block rounded-full bg-slate-100 text-slate-500 text-xs font-bold">Coming Soon</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow label="Specialization" value={profile.specialization} />
              <InfoRow label="Experience" value={profile.experience !== undefined ? `${profile.experience} years` : undefined} />
              <InfoRow label="Consultation Fee" value={profile.consultationFee !== undefined ? `₹${profile.consultationFee}` : undefined} />
              <InfoRow label="Profile Complete" value={profile.isProfileComplete ? "Yes" : "No"} />
              {profile.about && (
                <div className="sm:col-span-2 p-4 rounded-[16px] bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">About</p>
                  <p className="text-[14px] font-medium text-slate-700 leading-relaxed">{profile.about}</p>
                </div>
              )}
              {profile.qualifications?.length > 0 && (
                <div className="sm:col-span-2 p-4 rounded-[16px] bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Qualifications</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.qualifications.map((q) => (
                      <span key={q} className="px-3 py-1 rounded-full bg-white border border-slate-200 text-[12px] font-bold text-slate-700">{q}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
