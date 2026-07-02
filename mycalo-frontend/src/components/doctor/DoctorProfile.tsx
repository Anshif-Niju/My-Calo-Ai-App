"use client";

import { api } from "@/lib/axios";
import { getErrorMessage } from "@/utils/errorHandler";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

interface DayAvailability {
  day: string;
  isAvailable: boolean;
  slots: TimeSlot[];
}

interface DoctorProfileData {
  _id: string;
  doctorId: string;
  name: string;
  email: string;
  phone: string;
  profilePhoto: string;
  specialization: string;
  experience: number;
  qualifications: string[];
  about: string;
  services: string[];
  consultationFee: number;
  gstPercent: number;
  razorpayAccountId?: string;
  availability: DayAvailability[];
  isProfileComplete: boolean;
  isActive: boolean;
}

const DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

const TIME_SLOTS = [
  { id: "10-11", label: "10 - 11 AM", start: "10:00", end: "11:00" },
  { id: "11-12", label: "11 - 12 PM", start: "11:00", end: "12:00" },
  { id: "12-13", label: "12 - 1 PM", start: "12:00", end: "13:00" },
  { id: "13-14", label: "1 - 2 PM", start: "13:00", end: "14:00" },
  { id: "14-15", label: "2 - 3 PM", start: "14:00", end: "15:00" },
  { id: "15-16", label: "3 - 4 PM", start: "15:00", end: "16:00" },
  { id: "16-17", label: "4 - 5 PM", start: "16:00", end: "17:00" },
  { id: "17-18", label: "5 - 6 PM", start: "17:00", end: "18:00" },
  { id: "18-19", label: "6 - 7 PM", start: "18:00", end: "19:00" },
  { id: "19-20", label: "7 - 8 PM", start: "19:00", end: "20:00" },
  { id: "20-21", label: "8 - 9 PM", start: "20:00", end: "21:00" },
  { id: "21-22", label: "9 - 10 PM", start: "21:00", end: "22:00" },
];

export default function DoctorProfile() {
  const queryClient = useQueryClient();

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [experience, setExperience] = useState(0);
  const [qualificationsInput, setQualificationsInput] = useState("");
  const [servicesInput, setServicesInput] = useState("");
  const [about, setAbout] = useState("");
  const [consultationFee, setConsultationFee] = useState(0);
  const [gstPercent, setGstPercent] = useState(18);
  const [razorpayAccountId, setRazorpayAccountId] = useState("");

  // Availability grid state
  const [availability, setAvailability] = useState<Record<string, string[]>>({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  });

  // Query profile
  const { data: profile, isLoading, isError } = useQuery<DoctorProfileData>({
    queryKey: ["doctor-profile"],
    queryFn: async () => {
      const res = await api.get("/doctors/doctor/profile");
      return res.data.data;
    },
  });

  // Populate state on load
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setPhone(profile.phone || "");
      setSpecialization(profile.specialization || "");
      setExperience(profile.experience || 0);
      setQualificationsInput(profile.qualifications?.join(", ") || "");
      setServicesInput(profile.services?.join(", ") || "");
      setAbout(profile.about || "");
      setConsultationFee(profile.consultationFee || 0);
      setGstPercent(profile.gstPercent ?? 18);
      setRazorpayAccountId(profile.razorpayAccountId || "");

      // Populate availability
      const grid: Record<string, string[]> = {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: [],
      };

      profile.availability?.forEach((dayObj) => {
        const day = dayObj.day.toLowerCase();
        if (day in grid && dayObj.slots) {
          grid[day] = dayObj.slots.map((s) => s.startTime);
        }
      });
      setAvailability(grid);
    }
  }, [profile]);

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put("/doctors/doctor/profile", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-profile"] });
      toast.success("Profile details updated successfully");
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err, "Failed to update profile"));
    },
  });

  const updateAvailabilityMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put("/doctors/doctor/availability", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-profile"] });
      toast.success("Availability slots saved successfully");
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err, "Failed to update availability"));
    },
  });

  // Helpers for availability grid
  const toggleSlot = (day: string, startTime: string) => {
    setAvailability((prev) => {
      const daySlots = prev[day] || [];
      const updated = daySlots.includes(startTime)
        ? daySlots.filter((t) => t !== startTime)
        : [...daySlots, startTime];
      return { ...prev, [day]: updated };
    });
  };

  const toggleDayAll = (day: string) => {
    setAvailability((prev) => {
      const daySlots = prev[day] || [];
      // If all are selected, clear all. Otherwise, select all.
      const updated = daySlots.length === TIME_SLOTS.length ? [] : TIME_SLOTS.map((s) => s.start);
      return { ...prev, [day]: updated };
    });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const qualifications = qualificationsInput
      .split(",")
      .map((q) => q.trim())
      .filter((q) => q.length > 0);
    const services = servicesInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    updateProfileMutation.mutate({
      name,
      phone,
      specialization,
      experience: Number(experience),
      qualifications,
      about,
      services,
      consultationFee: Number(consultationFee),
      gstPercent: Number(gstPercent),
      razorpayAccountId,
    });
  };

  const handleSaveAvailability = () => {
    const payload = {
      availability: Object.entries(availability).map(([day, startTimes]) => {
        return {
          day,
          isAvailable: startTimes.length > 0,
          slots: startTimes.map((start) => {
            const slotConfig = TIME_SLOTS.find((s) => s.start === start);
            return {
              id: "", // Will be generated by backend if blank
              startTime: start,
              endTime: slotConfig ? slotConfig.end : "",
            };
          }),
        };
      }),
    };
    updateAvailabilityMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full animate-spin border-4 border-slate-200 border-t-slate-900" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-[28px] border border-red-100 text-center shadow-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="font-black text-slate-900 text-lg">Failed to Load Profile</h1>
          <p className="text-sm text-slate-400 mt-2">Could not retrieve doctor account information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-950 tracking-tight">Profile & Schedule</h1>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">
          Configure your professional profile and availability slots
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Card & Form (Left/Center columns) */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Identity Widget */}
          <div className="bg-white rounded-[28px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)] p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-slate-900 to-slate-700 text-white flex items-center justify-center font-black text-3xl shadow-md">
              {name?.charAt(0).toUpperCase() || "D"}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                <h2 className="text-xl font-black text-slate-900">Dr. {name}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border self-center ${profile.isProfileComplete ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"}`}>
                  {profile.isProfileComplete ? "Complete" : "Incomplete Info"}
                </span>
              </div>
              <p className="text-sm text-slate-500">Registered Email: {profile.email}</p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-3">
                {specialization && (
                  <span className="px-3 py-1 bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700 rounded-lg">
                    🩺 {specialization}
                  </span>
                )}
                {experience > 0 && (
                  <span className="px-3 py-1 bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700 rounded-lg">
                    ⏱ {experience} Years Experience
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Form Card */}
          <form onSubmit={handleSaveProfile} className="bg-white rounded-[28px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)] p-6 sm:p-8 flex flex-col gap-6">
            <h3 className="text-[13px] font-black text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-3">
              Professional Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-[14px] text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                />
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Contact Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-[14px] text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                />
              </div>

              {/* Specialization */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Specialization</label>
                <input
                  type="text"
                  required
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="e.g. Cardiologist, Dietitian"
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-[14px] text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                />
              </div>

              {/* Experience */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Experience (Years)</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={experience}
                  onChange={(e) => setExperience(Math.max(0, Number(e.target.value)))}
                  placeholder="e.g. 5"
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-[14px] text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                />
              </div>

              {/* Consultation Fee */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Consultation Fee (INR)</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(Math.max(0, Number(e.target.value)))}
                  placeholder="e.g. 500"
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-[14px] text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                />
              </div>

              {/* GST Percent */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">GST Percent (%)</label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  required
                  value={gstPercent}
                  onChange={(e) => setGstPercent(Math.max(0, Math.min(30, Number(e.target.value))))}
                  placeholder="e.g. 18"
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-[14px] text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                />
              </div>

              {/* Qualifications */}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                  Qualifications (Comma separated)
                </label>
                <input
                  type="text"
                  value={qualificationsInput}
                  onChange={(e) => setQualificationsInput(e.target.value)}
                  placeholder="e.g. MBBS, MD (Cardiology)"
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-[14px] text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                />
              </div>

              {/* Services */}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                  Services Offered (Comma separated)
                </label>
                <input
                  type="text"
                  value={servicesInput}
                  onChange={(e) => setServicesInput(e.target.value)}
                  placeholder="e.g. Diet consultation, Workout planning"
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-[14px] text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                />
              </div>

              {/* About */}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">About Me</label>
                <textarea
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder="Describe your background, specialty, and approach..."
                  rows={4}
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-[14px] text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all resize-none"
                />
              </div>

              {/* Razorpay Account ID */}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Razorpay Account ID (Optional)</label>
                <input
                  type="text"
                  value={razorpayAccountId}
                  onChange={(e) => setRazorpayAccountId(e.target.value)}
                  placeholder="e.g. acc_xxxxxxxxxxxxxx"
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-[14px] text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                />
                <p className="text-[10px] text-slate-400 ml-1 mt-0.5">Needed for routing patient consultation payouts to your account.</p>
              </div>

            </div>

            <div className="flex justify-end mt-4">
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm rounded-[14px] shadow-lg disabled:opacity-50 transition-all duration-300"
              >
                {updateProfileMutation.isPending ? "Saving details..." : "Save Profile Info"}
              </button>
            </div>
          </form>

        </div>

        {/* Right Info Panel */}
        <div className="flex flex-col gap-6">
          
          {/* Version badge */}
          <div className="bg-slate-900 text-white rounded-[24px] p-6 flex flex-col gap-3 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-800">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Account Information</h4>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs text-slate-400">Account Type</span>
              <span className="text-xs font-bold bg-white/10 px-2.5 py-0.5 rounded-full">Doctor</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs text-slate-400">Status</span>
              <span className="text-xs font-bold text-emerald-400">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Portal Version</span>
              <span className="text-xs font-medium text-slate-400">v2.1.0-live</span>
            </div>
          </div>

          {/* Quick instructions */}
          <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.02)] flex flex-col gap-3.5">
            <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-wider">Instructions</h4>
            <ul className="text-xs text-slate-500 leading-relaxed list-disc list-inside flex flex-col gap-2">
              <li>Fill out all details to complete your profile structure.</li>
              <li>A complete profile enables the system to list you in search results.</li>
              <li>Select your availability hours in the grid to allow patients to book slots.</li>
              <li>Use the row action buttons to quickly toggle whole days.</li>
            </ul>
          </div>

        </div>

      </div>

      {/* Availability Selector Grid Section */}
      <div className="bg-white rounded-[28px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)] p-6 sm:p-8 mt-8 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900">Weekly Availability Schedule</h3>
            <p className="text-xs text-slate-500 mt-1">Specify which hours (10:00 AM to 10:00 PM) you are free for user bookings.</p>
          </div>
          <button
            onClick={handleSaveAvailability}
            disabled={updateAvailabilityMutation.isPending}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-[14px] shadow-md transition-all duration-200 self-start sm:self-center"
          >
            {updateAvailabilityMutation.isPending ? "Saving slots..." : "Save Availability Slots"}
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 text-xs text-slate-500 ml-1">
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-emerald-600 inline-block" />
            <span>Available (Free)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-slate-50 border border-slate-200 inline-block" />
            <span>Unavailable</span>
          </span>
        </div>

        {/* Scrollable grid container */}
        <div className="overflow-x-auto border border-slate-100 rounded-[20px] shadow-sm bg-slate-50/50">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-white">
                <th className="py-4 px-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-wider w-36 sticky left-0 bg-white z-10 border-r border-slate-100">
                  Day of Week
                </th>
                <th className="py-4 px-4 text-center text-[11px] font-black text-slate-400 uppercase tracking-wider w-24 border-r border-slate-100 bg-slate-50">
                  Toggles
                </th>
                {TIME_SLOTS.map((slot) => (
                  <th key={slot.id} className="py-4 px-2 text-center text-[10px] font-bold text-slate-600 bg-slate-50 border-r border-slate-100 last:border-r-0 min-w-[76px]">
                    {slot.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS_OF_WEEK.map((day) => {
                const daySlots = availability[day] || [];
                const allSelected = daySlots.length === TIME_SLOTS.length;

                return (
                  <tr key={day} className="border-b border-slate-100 bg-white hover:bg-slate-50/30 transition-colors last:border-b-0">
                    
                    {/* Day name column (sticky) */}
                    <td className="py-4 px-4 font-black text-sm text-slate-800 capitalize sticky left-0 bg-white z-10 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.01)]">
                      {day}
                    </td>

                    {/* All/None Toggle helper */}
                    <td className="py-4 px-2 text-center border-r border-slate-100 bg-slate-50/50">
                      <button
                        type="button"
                        onClick={() => toggleDayAll(day)}
                        className={`px-3 py-1 rounded-[8px] text-[10px] font-black transition-all ${allSelected ? "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100" : "bg-slate-900 text-white hover:bg-slate-800"}`}
                      >
                        {allSelected ? "Clear" : "All"}
                      </button>
                    </td>

                    {/* Slots */}
                    {TIME_SLOTS.map((slot) => {
                      const active = daySlots.includes(slot.start);

                      return (
                        <td key={slot.id} className="py-3 px-1.5 text-center border-r border-slate-100 last:border-r-0">
                          <button
                            type="button"
                            onClick={() => toggleSlot(day, slot.start)}
                            className={`w-full max-w-[80px] py-3 rounded-[12px] text-[10px] font-extrabold transition-all duration-150 ${active ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10 hover:bg-emerald-700" : "bg-slate-50 text-slate-400 border border-slate-200/60 hover:bg-slate-100/60 hover:text-slate-600"}`}
                          >
                            {active ? "Active" : "Off"}
                          </button>
                        </td>
                      );
                    })}

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

