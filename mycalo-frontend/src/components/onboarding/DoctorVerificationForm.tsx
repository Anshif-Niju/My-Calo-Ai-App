"use client";

import { api } from "@/lib/axios";
import { doctorVerificationSchema } from "@/validators/onboarding.schema";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const SPECIALIZATIONS = ["General Physician", "Cardiologist", "Dermatologist", "Neurologist", "Orthopedic", "Pediatrician", "Psychiatrist", "Gynecologist", "Endocrinologist", "Nutritionist", "Other"];

const DOC_FIELDS = [
  { key: "mcuCertificate", label: "MCU Certificate", required: true },
  { key: "degreeCertificate", label: "Degree Certificate", required: true },
  { key: "governmentId", label: "Government ID", required: true },
  { key: "clinicProof", label: "Clinic Proof", required: false },
];

export default function DoctorVerificationForm() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [form, setForm] = useState({
    specialization: "",
    experience: "",
    registrationNumber: "",
    registrationCouncil: "",
    registrationYear: "",
  });
  const [files, setFiles] = useState<Record<string, File | null>>({
    mcuCertificate: null,
    degreeCertificate: null,
    governmentId: null,
    clinicProof: null,
  });

  const set = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const setFile = (key: string, file: File | null) => setFiles((p) => ({ ...p, [key]: file }));

  const mutation = useMutation({
    mutationFn: async () => {
      // Zod validate
      const result = doctorVerificationSchema.safeParse({
        ...form,
        mcuCertificate: files.mcuCertificate,
        degreeCertificate: files.degreeCertificate,
        governmentId: files.governmentId,
        clinicProof: files.clinicProof ?? undefined,
      });

      if (!result.success) {
        throw new Error(result.error.issues[0].message);
      }

      // Build FormData for multer
      const formData = new FormData();
      formData.append("specialization", form.specialization);
      formData.append("experience", form.experience);
      formData.append("registrationNumber", form.registrationNumber);
      formData.append("registrationCouncil", form.registrationCouncil);
      formData.append("registrationYear", form.registrationYear);
      if (files.mcuCertificate) formData.append("mcuCertificate", files.mcuCertificate);
      if (files.degreeCertificate) formData.append("degreeCertificate", files.degreeCertificate);
      if (files.governmentId) formData.append("governmentId", files.governmentId);
      if (files.clinicProof) formData.append("clinicProof", files.clinicProof);

      const response = await api.post("/onboarding/doctor-verification", formData);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Application submitted! Awaiting admin review.");
      setIsRedirecting(true);
      router.push("/onboarding/doctor/verification");
    },
    onError: (error: any) => {
      const msg = error.message || error.response?.data?.message || error.response?.data?.errors?.[0]?.message || "Something went wrong";
      toast.error(msg);
    },
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6">
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-500">Doctor Verification</span>
          <h1 className="text-3xl font-black text-slate-950 mt-4 mb-1">Verify Your Profile</h1>
          <p className="text-sm font-medium text-slate-400">Submit your credentials for admin review. Usually takes 24–48 hours.</p>
        </div>

        <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 sm:p-8 space-y-5">
          {/* Specialization */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 ml-1">Specialization *</label>
            <select
              value={form.specialization}
              onChange={(e) => set("specialization", e.target.value)}
              className="w-full h-14 px-5 rounded-2xl bg-slate-50 text-slate-900 font-medium outline-none focus:ring-2 focus:ring-slate-950 transition-all appearance-none">
              <option value="">Select specialization</option>
              {SPECIALIZATIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Experience + Year */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 ml-1">Experience *</label>
              <div className="relative">
                <input
                  type="number"
                  value={form.experience}
                  onChange={(e) => set("experience", e.target.value)}
                  placeholder="1"
                  className="w-full h-14 pl-4 pr-12 rounded-2xl bg-slate-50 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-slate-950 transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">yrs</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 ml-1">Reg. Year *</label>
              <input
                type="number"
                value={form.registrationYear}
                onChange={(e) => set("registrationYear", e.target.value)}
                placeholder="2018"
                className="w-full h-14 px-4 rounded-2xl bg-slate-50 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-slate-950 transition-all"
              />
            </div>
          </div>

          {/* Reg Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 ml-1">Registration Number *</label>
            <input
              type="text"
              value={form.registrationNumber}
              onChange={(e) => set("registrationNumber", e.target.value)}
              placeholder="MCI-12345"
              className="w-full h-14 px-5 rounded-2xl bg-slate-50 text-slate-900 font-medium outline-none focus:ring-2 focus:ring-slate-950 transition-all"
            />
          </div>

          {/* Reg Council */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 ml-1">Registration Council *</label>
            <input
              type="text"
              value={form.registrationCouncil}
              onChange={(e) => set("registrationCouncil", e.target.value)}
              placeholder="Medical Council of India"
              className="w-full h-14 px-5 rounded-2xl bg-slate-50 text-slate-900 font-medium outline-none focus:ring-2 focus:ring-slate-950 transition-all"
            />
          </div>

          {/* File Uploads */}
          <div className="pt-2">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 ml-1">
              Documents * <span className="text-slate-400 normal-case font-normal">(JPG, PNG, PDF — max 5MB each)</span>
            </p>
            <div className="space-y-3">
              {DOC_FIELDS.map(({ key, label, required }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1">
                    {label} {required ? "*" : "(optional)"}
                  </label>
                  <label className={`flex items-center gap-3 h-12 px-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${files[key] ? "border-slate-950 bg-slate-50" : "border-slate-200 bg-slate-50 hover:border-slate-400"}`}>
                    <span className="text-base">{files[key] ? "✅" : "📎"}</span>
                    <span className={`text-sm font-medium truncate ${files[key] ? "text-slate-900" : "text-slate-400"}`}>{files[key] ? files[key]!.name : "Click to upload"}</span>
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setFile(key, e.target.files?.[0] || null)} />
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-lg">⏳</span>
            <p className="text-xs text-slate-500 leading-relaxed">
              After submission, our team reviews within <strong className="text-slate-700">24–48 hours</strong>. You'll be notified once approved.
            </p>
          </div>

          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || isRedirecting}
            className="w-full h-14 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all shadow-md active:scale-[0.98] disabled:opacity-70 flex items-center justify-center">
            {mutation.isPending || isRedirecting ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Submit Application →"}
          </button>
        </div>
      </div>
    </div>
  );
}
