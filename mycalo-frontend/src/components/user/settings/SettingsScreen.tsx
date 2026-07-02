"use client";

import { api } from "@/lib/axios";
import { getErrorMessage } from "@/utils/errorHandler";
import { useMutation } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { logoutAction, setUser } from "@/store/slices/auth.slice";
import { useState, useMemo, useRef, useEffect } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  height: z.number().min(50, "Height must be at least 50cm").max(300, "Height seems invalid").optional(),
  weight: z.number().min(10, "Weight must be at least 10kg").max(500, "Weight seems invalid").optional(),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active"]).optional(),
  diseases: z.array(z.string()).optional(),
  goalType: z.enum(["weight_loss", "weight_gain", "maintain"]).optional(),
  targetWeight: z.number().min(10, "Target weight must be at least 10kg").max(500, "Target weight seems invalid").optional(),
});

type AccordionType = "personal" | "goals" | "security" | "terms" | "privacy" | "delete" | null;

const DISEASES_OPTIONS = ["Diabetes", "Hypertension", "Celiac Disease", "Heart Disease", "Thyroid", "Cholesterol", "None"];
const ACTIVITY_OPTIONS = [
  { value: "sedentary", label: "Sedentary (Little/no exercise)" },
  { value: "light", label: "Light (1-3 days/week exercise)" },
  { value: "moderate", label: "Moderate (3-5 days/week exercise)" },
  { value: "active", label: "Active (6-7 days/week exercise)" },
];
const GOAL_OPTIONS = [
  { value: "weight_loss", label: "Weight Loss (Caloric Deficit)" },
  { value: "weight_gain", label: "Weight Gain (Caloric Surplus)" },
  { value: "maintain", label: "Maintain Weight (TDEE Balance)" },
];

export default function SettingsScreen() {
  const dispatch = useDispatch();
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [activeAccordion, setActiveAccordion] = useState<AccordionType>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Profile editing states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempName, setTempName] = useState(user?.name || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Form states - Personal Details
  const [height, setHeight] = useState(user?.healthProfile?.height?.toString() || "");
  const [weight, setWeight] = useState(user?.healthProfile?.weight?.toString() || "");
  const [activityLevel, setActivityLevel] = useState(user?.healthProfile?.activityLevel || "sedentary");
  const [diseases, setDiseases] = useState<string[]>(user?.healthProfile?.diseases || []);

  // Form states - Goal Adjustments
  const [goalType, setGoalType] = useState(user?.goal?.type || "maintain");
  const [targetWeight, setTargetWeight] = useState(user?.goal?.targetWeight?.toString() || "");

  // 2FA Setup state
  const [is2FAEnabled, setIs2FAEnabled] = useState(user?.isTwoFactorEnabled || false);
  
  useEffect(() => {
    setIs2FAEnabled(user?.isTwoFactorEnabled || false);
  }, [user?.isTwoFactorEnabled]);
  const [twoFactorSetupData, setTwoFactorSetupData] = useState<{ qrCode: string; secret: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);

  // Delete state
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const toggleAccordion = (type: AccordionType) => {
    setActiveAccordion((prev) => (prev === type ? null : type));
  };

  const handleDiseaseToggle = (disease: string) => {
    if (disease === "None") {
      setDiseases([]);
      return;
    }
    setDiseases((prev) => {
      const filtered = prev.filter((d) => d !== "None");
      if (filtered.includes(disease)) {
        return filtered.filter((d) => d !== disease);
      } else {
        return [...filtered, disease];
      }
    });
  };

  // Mutation for Profile updates
  const updateProfileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.patch("/settings/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: (data) => {
      dispatch(setUser({ user: data.user }));
      toast.success("Settings saved successfully!");
      setActiveAccordion(null);
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err, "Failed to update profile."));
    },
  });

  const handlePersonalSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    const dataPayload = {
      height: height ? Number(height) : undefined,
      weight: weight ? Number(weight) : undefined,
      activityLevel: activityLevel as "sedentary" | "light" | "moderate" | "active",
      diseases,
    };

    try {
      updateProfileSchema.parse(dataPayload);
      formData.append("data", JSON.stringify(dataPayload));
      updateProfileMutation.mutate(formData);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.issues[0].message);
      }
    }
  };

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    const dataPayload = {
      goalType: goalType as "weight_loss" | "weight_gain" | "maintain",
      targetWeight: goalType === "maintain" ? undefined : (targetWeight ? Number(targetWeight) : undefined),
    };

    try {
      updateProfileSchema.parse(dataPayload);
      formData.append("data", JSON.stringify(dataPayload));
      updateProfileMutation.mutate(formData);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.issues[0].message);
      }
    }
  };

  // Profile editing handlers
  const handlePencilClick = () => {
    if (!isEditingProfile) {
      setTempName(user?.name || "");
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsEditingProfile(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleCancelProfileEdit = () => {
    setIsEditingProfile(false);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleSaveProfile = async () => {
    if (!tempName.trim()) return toast.error("Name is required");

    const formData = new FormData();
    const dataPayload = {
      name: tempName,
    };
    
    try {
      updateProfileSchema.parse(dataPayload);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return toast.error(error.issues[0].message);
      }
    }

    formData.append("data", JSON.stringify(dataPayload));
    if (selectedFile) {
      formData.append("image", selectedFile);
    }

    setIsUploadingPhoto(true);
    toast.loading("Saving profile...", { id: "profile-save" });

    try {
      const res = await api.patch("/settings/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      dispatch(setUser({ user: res.data.user }));
      setIsEditingProfile(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      toast.success("Profile updated successfully!", { id: "profile-save" });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update profile.", { id: "profile-save" });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // 2FA Actions
  const init2FASetup = async () => {
    setIsSettingUp2FA(true);
    try {
      const res = await api.post("/auth/setup-2fa");
      setTwoFactorSetupData(res.data);
      toast.success("Scan the QR code to proceed");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to initialize 2FA.");
      setIsSettingUp2FA(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length !== 6) return toast.error("Enter a valid 6-digit code");

    try {
      const res = await api.post("/auth/verify-2fa", { token: verificationCode });
      dispatch(setUser({ user: res.data.user }));
      setIs2FAEnabled(true);
      setTwoFactorSetupData(null);
      setVerificationCode("");
      setIsSettingUp2FA(false);
      toast.success("2FA enabled successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Verification code is incorrect");
    }
  };

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disablePassword) return toast.error("Enter password to confirm");

    try {
      const res = await api.post("/auth/disable-2fa", { password: disablePassword });
      dispatch(setUser({ user: res.data.user }));
      setIs2FAEnabled(false);
      setDisablePassword("");
      toast.success("2FA disabled successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Incorrect password");
    }
  };

  // Account Deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      return toast.error("Please type DELETE to confirm");
    }

    if (confirm("WARNING: This will permanently delete your account and remove all your data. Proceed?")) {
      try {
        await api.delete("/settings/account");
        dispatch(logoutAction());
        toast.success("Account deleted successfully");
        router.push("/login");
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to delete account");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      dispatch(logoutAction());
      router.replace("/login");
    } catch (error) {
      console.error(error);
      dispatch(logoutAction());
      router.replace("/login");
    }
  };

  return (
    <div className="min-h-screen pb-24 pt-6 bg-slate-50 font-sans">
      <div className="max-w-md mx-auto sm:max-w-xl px-4 pt-4">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Settings</h1>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-[32px] p-6 mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4 w-full justify-between">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div 
                className={`relative w-16 h-16 shrink-0 group ${isEditingProfile ? "cursor-pointer" : ""}`}
                onClick={() => isEditingProfile && fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="Preview Avatar"
                    width={64}
                    height={64}
                    className="rounded-full object-cover border border-slate-100"
                  />
                ) : user?.profilePhoto ? (
                  <Image
                    src={user.profilePhoto}
                    alt={user.name || "User Avatar"}
                    width={64}
                    height={64}
                    className="rounded-full object-cover border border-slate-100"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-950 text-white flex items-center justify-center text-2xl font-bold">
                    {(isEditingProfile ? tempName : user?.name)?.charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Photo Upload Overlay (only shown in Edit Mode) */}
                {isEditingProfile && (
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white text-xs font-bold transition-opacity">
                    📷
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoSelect}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <div className="flex-1 min-w-0">
                {isEditingProfile ? (
                  <div className="space-y-1 pr-2">
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="w-full p-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-950 font-bold"
                      placeholder="Enter name"
                    />
                  </div>
                ) : (
                  <>
                    <h2 className="text-base font-extrabold text-slate-900 leading-none">{user?.name}</h2>
                    <p className="text-xs font-semibold text-slate-400 mt-1">{user?.email}</p>
                  </>
                )}
              </div>
            </div>

            {/* Right Action Button(s) */}
            <div className="shrink-0 flex items-center gap-1.5">
              {isEditingProfile ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={isUploadingPhoto}
                    className="w-8 h-8 bg-slate-950 hover:bg-slate-800 text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors cursor-pointer shadow-sm animate-in fade-in zoom-in duration-200"
                    title="Save"
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelProfileEdit}
                    disabled={isUploadingPhoto}
                    className="w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                    title="Cancel"
                  >
                    ✗
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handlePencilClick}
                  className="w-9 h-9 bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-700 rounded-full flex items-center justify-center text-sm transition-colors cursor-pointer shadow-sm"
                  title="Edit Profile"
                >
                  ✏️
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Health Summary Card */}
        <div className="bg-white rounded-[32px] p-6 mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 space-y-4">
          <div className="flex justify-between items-center py-1 border-b border-slate-50">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Age</span>
            <span className="text-sm font-black text-slate-800">{user?.healthProfile?.age || "-"} yrs</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-50">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Height</span>
            <span className="text-sm font-black text-slate-800">{user?.healthProfile?.height || "-"} cm</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Current Weight</span>
            <span className="text-sm font-black text-slate-800">{user?.healthProfile?.weight || "-"} kg</span>
          </div>
        </div>

        {/* Customization Accordions */}
        <div className="mb-6">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 ml-3">Customization</p>
          <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden divide-y divide-slate-100">
            
            {/* Personal Details */}
            <div className="overflow-hidden">
              <button
                onClick={() => toggleAccordion("personal")}
                className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-700 hover:text-slate-900 transition-colors"
              >
                <span className="text-sm font-extrabold">Personal details</span>
                <span className={`transition-transform text-xs font-black ${activeAccordion === "personal" ? "rotate-180" : ""}`}>▼</span>
              </button>
              
              {activeAccordion === "personal" && (
                <form onSubmit={handlePersonalSubmit} className="p-5 bg-slate-50/50 space-y-4 border-t border-slate-100/50">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Height (cm)</label>
                      <input
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        className="w-full p-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weight (kg)</label>
                      <input
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="w-full p-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Activity Level</label>
                    <select
                      value={activityLevel}
                      onChange={(e) => setActivityLevel(e.target.value as "sedentary" | "light" | "moderate" | "active")}
                      className="w-full p-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none font-semibold text-slate-700"
                    >
                      {ACTIVITY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Conditions & Diseases</label>
                    <div className="flex flex-wrap gap-1.5">
                      {DISEASES_OPTIONS.map((d) => {
                        const isSelected = diseases.includes(d) || (d === "None" && diseases.length === 0);
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => handleDiseaseToggle(d)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                              isSelected
                                ? "bg-red-50 text-red-600 border-red-200"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {d}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                  >
                    {updateProfileMutation.isPending ? "Saving..." : "Save Details"}
                  </button>
                </form>
              )}
            </div>

            {/* Adjust Goals */}
            <div className="overflow-hidden">
              <button
                onClick={() => toggleAccordion("goals")}
                className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-700 hover:text-slate-900 transition-colors"
              >
                <span className="text-sm font-extrabold">Adjust goals</span>
                <span className={`transition-transform text-xs font-black ${activeAccordion === "goals" ? "rotate-180" : ""}`}>▼</span>
              </button>

              {activeAccordion === "goals" && (
                <form onSubmit={handleGoalSubmit} className="p-5 bg-slate-50/50 space-y-4 border-t border-slate-100/50">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Goal Type</label>
                    <select
                      value={goalType}
                      onChange={(e) => setGoalType(e.target.value as "weight_loss" | "weight_gain" | "maintain")}
                      className="w-full p-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none font-semibold text-slate-700"
                    >
                      {GOAL_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {goalType !== "maintain" && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Weight (kg)</label>
                      <input
                        type="number"
                        value={targetWeight}
                        onChange={(e) => setTargetWeight(e.target.value)}
                        className="w-full p-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                  >
                    {updateProfileMutation.isPending ? "Recalculating..." : "Update Goals"}
                  </button>
                </form>
              )}
            </div>

            {/* Security & 2FA */}
            <div className="overflow-hidden">
              <button
                onClick={() => toggleAccordion("security")}
                className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-700 hover:text-slate-900 transition-colors"
              >
                <span className="text-sm font-extrabold">Security & Two-Factor (2FA)</span>
                <span className={`transition-transform text-xs font-black ${activeAccordion === "security" ? "rotate-180" : ""}`}>▼</span>
              </button>

              {activeAccordion === "security" && (
                <div className="p-5 bg-slate-50/50 space-y-4 border-t border-slate-100/50 text-slate-700">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">2FA Status</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Secure your account with authenticator apps</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${is2FAEnabled ? "bg-emerald-50 text-emerald-600" : "bg-slate-200 text-slate-600"}`}>
                      {is2FAEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>

                  {!is2FAEnabled ? (
                    <div className="space-y-4 pt-2">
                      {!twoFactorSetupData ? (
                        <button
                          onClick={init2FASetup}
                          disabled={isSettingUp2FA}
                          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          {isSettingUp2FA ? "Initializing..." : "Setup 2FA"}
                        </button>
                      ) : (
                        <form onSubmit={handleVerify2FA} className="space-y-4 text-center">
                          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                            Scan this QR code with Google Authenticator or another TOTP app, then enter the 6-digit code.
                          </p>
                          <div className="bg-white p-3 rounded-2xl w-fit mx-auto border border-slate-100 shadow-sm">
                            <Image
                              src={twoFactorSetupData.qrCode}
                              alt="2FA QR Code"
                              width={150}
                              height={150}
                            />
                          </div>
                          <p className="text-[11px] font-bold text-slate-400 break-all select-all">Secret: {twoFactorSetupData.secret}</p>
                          
                          <div className="space-y-1 text-left">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verification Code</label>
                            <input
                              type="text"
                              maxLength={6}
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value)}
                              placeholder="e.g. 123456"
                              className="w-full p-3 text-center text-base tracking-widest bg-white border border-slate-200 rounded-xl focus:outline-none font-black"
                            />
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setTwoFactorSetupData(null);
                                setIsSettingUp2FA(false);
                              }}
                              className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
                            >
                              Verify & Enable
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handleDisable2FA} className="space-y-4 pt-2">
                      <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                        To disable Two-Factor Authentication, please enter your password.
                      </p>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                        <input
                          type="password"
                          value={disablePassword}
                          onChange={(e) => setDisablePassword(e.target.value)}
                          placeholder="Verify account password"
                          className="w-full p-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Disable 2FA
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Legal Accordions */}
        <div className="mb-8">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 ml-3">Legal</p>
          <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden divide-y divide-slate-100">
            
            {/* Terms */}
            <div className="overflow-hidden">
              <button
                onClick={() => toggleAccordion("terms")}
                className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-700 hover:text-slate-900 transition-colors"
              >
                <span className="text-sm font-extrabold">Terms and conditions</span>
                <span className={`transition-transform text-xs font-black ${activeAccordion === "terms" ? "rotate-180" : ""}`}>▼</span>
              </button>

              {activeAccordion === "terms" && (
                <div className="p-5 bg-slate-50/50 text-slate-600 text-xs font-semibold leading-relaxed max-h-[160px] overflow-y-auto border-t border-slate-100/50">
                  <p className="mb-2">Welcome to MyCalo AI. By accessing or using our application, you agree to comply with and be bound by these terms.</p>
                  <p className="mb-2">1. Health Disclaimer: The nutritional and caloric suggestions provided by our AI are for informational purposes only. Consult a physician before starting any diet program.</p>
                  <p>2. Data Accuracy: Users are responsible for verifying log parameters and adjusting meal targets to match medical guidance.</p>
                </div>
              )}
            </div>

            {/* Privacy */}
            <div className="overflow-hidden">
              <button
                onClick={() => toggleAccordion("privacy")}
                className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-700 hover:text-slate-900 transition-colors"
              >
                <span className="text-sm font-extrabold">Privacy Policy</span>
                <span className={`transition-transform text-xs font-black ${activeAccordion === "privacy" ? "rotate-180" : ""}`}>▼</span>
              </button>

              {activeAccordion === "privacy" && (
                <div className="p-5 bg-slate-50/50 text-slate-600 text-xs font-semibold leading-relaxed max-h-[160px] overflow-y-auto border-t border-slate-100/50">
                  <p className="mb-2">We value your privacy and security. This Privacy Policy outlines how MyCalo AI manages and secures your profile and scanning logs.</p>
                  <p className="mb-2">1. Data Storage: We store your scanning image metadata and dietary entries in secure database instances. Photos are processed via Cloudinary.</p>
                  <p>2. Security Features: We offer Two-Factor Authentication (TOTP) to secure authentication sessions.</p>
                </div>
              )}
            </div>

            {/* Delete Account */}
            <div className="overflow-hidden">
              <button
                onClick={() => toggleAccordion("delete")}
                className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-700 hover:text-slate-900 transition-colors"
              >
                <span className="text-sm font-extrabold text-red-600">Delete Account</span>
                <span className={`transition-transform text-xs font-black text-red-600 ${activeAccordion === "delete" ? "rotate-180" : ""}`}>▼</span>
              </button>

              {activeAccordion === "delete" && (
                <div className="p-5 bg-red-50/50 space-y-4 border-t border-red-100/30">
                  <p className="text-xs text-red-700 font-semibold leading-relaxed">
                    Once deleted, all your logged meals, targets, profiles, and associated appointments will be permanently removed. This action is irreversible.
                  </p>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Type "DELETE" to confirm</label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Type DELETE"
                      className="w-full p-3 text-sm bg-white border border-red-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-500 font-semibold"
                    />
                  </div>
                  <button
                    onClick={handleDeleteAccount}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Confirm Permanent Deletion
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full py-4.5 bg-white border border-red-100 hover:bg-red-50 text-red-600 font-extrabold rounded-[24px] shadow-sm transition-colors text-sm cursor-pointer mt-4"
        >
          Logout from MyCalo
        </button>

      </div>
    </div>
  );
}

