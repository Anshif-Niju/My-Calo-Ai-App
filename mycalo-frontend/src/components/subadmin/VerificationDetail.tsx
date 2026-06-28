"use client";

import { api } from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

interface VerificationDetail {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    countryCode?: string;
    profilePhoto?: string;
    createdAt: string;
  };
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
}

// ─── Cloudinary PDF → thumbnail helper ──────────────────────────────────────
// Cloudinary can render a PDF's first page as an image by using:
//   /image/upload/pg_1,f_jpg/  instead of  /raw/upload/
// and dropping the .pdf extension.
function cloudinaryPdfToThumbnail(url: string): string {
  let thumb = url.replace("/raw/upload/", "/image/upload/pg_1,f_jpg/");
  thumb = thumb.replace(/\.pdf$/i, "");
  return thumb;
}

// ─── DocViewer ───────────────────────────────────────────────────────────────
function DocViewer({ label, url }: { label: string; url?: string }) {
  const [zoomed, setZoomed] = useState(false);
  const [thumbError, setThumbError] = useState(false);

  // Empty string from DB means "upload still queued" — treat as not available
  const hasUrl = !!url && url.trim() !== "";

  // Detect PDF (Cloudinary raw uploads or .pdf extension)
  const isPdf =
    hasUrl &&
    (url!.toLowerCase().includes(".pdf") ||
      url!.toLowerCase().includes("/raw/upload/") ||
      url!.toLowerCase().includes("application/pdf"));

  // Use Cloudinary thumbnail transform for PDFs, direct URL for images
  const previewUrl = isPdf && hasUrl ? cloudinaryPdfToThumbnail(url!) : url;

  // ── Not submitted ──────────────────────────────────────────────────────────
  if (!hasUrl) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{label}</p>
        <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 h-48 flex flex-col items-center justify-center gap-2">
          <span className="text-3xl">📄</span>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-xs text-slate-300">Not submitted</p>
        </div>
      </div>
    );
  }

  // ── Has URL ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Fullscreen zoom overlay */}
      {zoomed && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomed(false)}
        >
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbError ? url : previewUrl}
              alt={label}
              className="max-h-[88vh] max-w-[88vw] rounded-[20px] object-contain shadow-2xl"
            />
            <p className="text-white/60 text-xs text-center mt-3">Click anywhere to close</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{label}</p>
        <div className="rounded-[20px] border border-slate-100 overflow-hidden bg-slate-50 hover:border-slate-300 transition-colors group">

          {/* Preview thumbnail */}
          {thumbError ? (
            // Thumbnail failed to load — show clickable fallback
            <div
              className="h-40 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-100 hover:bg-slate-200 transition-colors"
              onClick={() => window.open(url, "_blank")}
            >
              <span className="text-3xl">{isPdf ? "📋" : "🖼️"}</span>
              <p className="text-[12px] font-bold text-slate-500">Click to open document</p>
            </div>
          ) : (
            <div
              className="h-40 cursor-zoom-in overflow-hidden"
              onClick={() => setZoomed(true)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={label}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={() => setThumbError(true)}
              />
            </div>
          )}

          {/* Bottom bar: PDF badge + Open link */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100 bg-white">
            <div className="flex items-center gap-1.5">
              {isPdf && (
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded">
                  PDF
                </span>
              )}
              <span className="text-[11px] font-bold text-slate-400">
                {thumbError ? "Preview unavailable" : "Click to zoom"}
              </span>
            </div>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="px-3 py-1 bg-slate-900 text-white text-[11px] font-black rounded-[8px] hover:bg-slate-700 transition-colors"
            >
              Open ↗
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Reject Modal ─────────────────────────────────────────────────────────────
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
        <p className="text-sm text-slate-500 text-center mb-6">Provide a reason for rejection.</p>
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
            {loading ? "Rejecting..." : "Confirm Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Status badge config ──────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-amber-50 border-amber-100", text: "text-amber-700", label: "Pending" },
  approved: { bg: "bg-emerald-50 border-emerald-100", text: "text-emerald-700", label: "Approved" },
  rejected: { bg: "bg-red-50 border-red-100", text: "text-red-700", label: "Rejected" },
  under_review: { bg: "bg-blue-50 border-blue-100", text: "text-blue-700", label: "Under Review" },
  not_submitted: { bg: "bg-slate-50 border-slate-100", text: "text-slate-500", label: "Not Submitted" },
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function VerificationDetailPage() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showReject, setShowReject] = useState(false);

  const { data, isLoading, isError } = useQuery<VerificationDetail>({
    queryKey: ["verification-detail", doctorId],
    queryFn: async () => {
      const res = await api.get(`/subadmin/verifications/${doctorId}`);
      return res.data.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/subadmin/verifications/${doctorId}/approve`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subadmin-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["verification-detail", doctorId] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (reason: string) => {
      const res = await api.patch(`/subadmin/verifications/${doctorId}/reject`, { reason });
      return res.data;
    },
    onSuccess: () => {
      setShowReject(false);
      queryClient.invalidateQueries({ queryKey: ["subadmin-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["verification-detail", doctorId] });
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
          <h1 className="font-black text-slate-900">Record Not Found</h1>
          <button
            onClick={() => router.back()}
            className="mt-4 px-5 py-2 rounded-[12px] bg-slate-900 text-white text-sm font-bold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const statusStyle = STATUS_STYLES[data.verificationStatus] ?? STATUS_STYLES.not_submitted;
  const isActionable = data.verificationStatus === "pending" || data.verificationStatus === "under_review";

  return (
    <>
      {showReject && (
        <RejectModal
          loading={rejectMutation.isPending}
          onClose={() => setShowReject(false)}
          onConfirm={(reason) => rejectMutation.mutate(reason)}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-12 font-sans">

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm font-bold mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back
        </button>

        {/* ─── Doctor Identity Card ─── */}
        <div className="bg-white rounded-[28px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-slate-800 to-slate-600 text-white flex items-center justify-center font-black text-2xl shadow-lg flex-shrink-0">
              {data.userId?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-start gap-3 mb-3">
                <h1 className="text-2xl font-black text-slate-900">{data.userId?.name}</h1>
                <span
                  className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${statusStyle.bg} ${statusStyle.text}`}
                >
                  {statusStyle.label}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1.5"><span>📧</span> {data.userId?.email}</span>
                {data.userId?.phone && (
                  <span className="flex items-center gap-1.5">
                    <span>📱</span> {data.userId.countryCode} {data.userId.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <span>📅</span> Submitted{" "}
                  {new Date(data.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Rejection reason */}
          {data.verificationStatus === "rejected" && data.rejectionReason && (
            <div className="mt-5 p-4 rounded-[16px] bg-red-50 border border-red-100">
              <p className="text-[11px] font-black text-red-500 uppercase tracking-wider mb-1">Rejection Reason</p>
              <p className="text-sm text-red-700 font-medium">{data.rejectionReason}</p>
            </div>
          )}
        </div>

        {/* ─── Professional Details ─── */}
        <div className="bg-white rounded-[28px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-8 mb-6">
          <h2 className="text-[13px] font-black text-slate-700 uppercase tracking-wider mb-5">Professional Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Specialization", value: data.specialization },
              {
                label: "Experience",
                value: data.experience !== undefined ? `${data.experience} years` : undefined,
              },
              { label: "Registration Number", value: data.registrationNumber },
              { label: "Registration Council", value: data.registrationCouncil },
              { label: "Registration Year", value: data.registrationYear?.toString() },
            ].map(({ label, value }) => (
              <div key={label} className="p-4 rounded-[16px] bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                <p className="text-[15px] font-bold text-slate-900">
                  {value || <span className="text-slate-300">—</span>}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Documents ─── */}
        <div className="bg-white rounded-[28px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6 sm:p-8 mb-6">
          <h2 className="text-[13px] font-black text-slate-700 uppercase tracking-wider mb-5">
            Submitted Documents
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <DocViewer label="MCU Certificate" url={data.documents?.mcuCertificate} />
            <DocViewer label="Degree Certificate" url={data.documents?.degreeCertificate} />
            <DocViewer label="Government ID" url={data.documents?.governmentId} />
          </div>
        </div>

        {/* ─── Action Buttons ─── */}
        {isActionable && (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowReject(true)}
              className="flex-1 py-4 rounded-[16px] border border-red-200 bg-red-50 text-red-600 font-black text-sm hover:bg-red-100 transition-colors"
            >
              ✕ Reject Application
            </button>
            <button
              disabled={approveMutation.isPending}
              onClick={() => approveMutation.mutate()}
              className="flex-1 py-4 rounded-[16px] bg-emerald-600 text-white font-black text-sm hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {approveMutation.isPending ? "Approving..." : "✓ Approve Doctor"}
            </button>
          </div>
        )}

        {data.verificationStatus === "approved" && (
          <div className="p-4 rounded-[16px] bg-emerald-50 border border-emerald-100 text-center">
            <p className="text-emerald-700 font-black text-sm">
              ✅ This doctor has been approved and can now access their dashboard.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
