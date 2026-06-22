"use client";

import { api } from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Booking {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    profilePhoto?: string;
  };
  slotDate: string;
  slotDay: string;
  startTime: string;
  endTime: string;
  patientName: string;
  patientEmail: string;
  consultationFee: number;
  totalAmount: number;
  status: "pending_payment" | "confirmed" | "cancelled" | "completed";
  chatSessionId?: string;
}

export default function DoctorDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"upcoming" | "active" | "history">("upcoming");
  const [now, setNow] = useState(new Date());

  // Keep track of current time for live schedule transitions
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 15000); // refresh every 15s
    return () => clearInterval(timer);
  }, []);

  // Fetch bookings
  const { data: bookings = [], isLoading, isError } = useQuery<Booking[]>({
    queryKey: ["doctor-bookings"],
    queryFn: async () => {
      const res = await api.get("/doctors/doctor/bookings");
      return res.data.data;
    },
  });

  const classifyBookings = () => {
    const upcoming: Booking[] = [];
    const active: Booking[] = [];
    const history: Booking[] = [];

    bookings.forEach((booking) => {
      const start = new Date(booking.slotDate);
      const [sH, sM] = booking.startTime.split(":").map(Number);
      start.setHours(sH, sM, 0, 0);

      const end = new Date(booking.slotDate);
      const [eH, eM] = booking.endTime.split(":").map(Number);
      end.setHours(eH, eM, 0, 0);

      if (booking.status === "completed" || booking.status === "cancelled") {
        history.push(booking);
      } else if (booking.status === "confirmed") {
        if (now >= start && now <= end) {
          active.push(booking);
        } else if (now < start) {
          upcoming.push(booking);
        } else {
          // Time passed but status not completed yet
          history.push(booking);
        }
      }
    });

    return { upcoming, active, history };
  };

  const { upcoming, active, history } = classifyBookings();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-red-50 max-w-md mx-auto mt-12 shadow-sm">
        <span className="text-3xl">⚠️</span>
        <h4 className="font-bold text-slate-800 mt-3">Failed to load dashboard</h4>
        <p className="text-xs text-slate-400 mt-1">Please try refreshing the page.</p>
      </div>
    );
  }

  const renderBookingList = (list: Booking[], type: "upcoming" | "active" | "history") => {
    if (list.length === 0) {
      return (
        <div className="text-center py-16 bg-white border border-slate-100 rounded-[28px] shadow-[0_8px_30px_rgba(0,0,0,0.01)]">
          <span className="text-3xl">📅</span>
          <h4 className="font-bold text-slate-700 mt-3">No consultations found</h4>
          <p className="text-xs text-slate-400 mt-1">There are no bookings in this section.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {list.map((booking) => {
          const bookingDate = new Date(booking.slotDate).toLocaleDateString("en-IN", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          });

          return (
            <div
              key={booking._id}
              className="bg-white border border-slate-100 rounded-[24px] shadow-[0_4px_25px_rgba(0,0,0,0.02)] p-6 flex flex-col gap-4 hover:-translate-y-0.5 transition-all duration-200"
            >
              {/* Patient header */}
              <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                  {booking.patientName?.charAt(0).toUpperCase() || "P"}
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 text-sm">{booking.patientName}</h5>
                  <p className="text-[10px] text-slate-400">{booking.patientEmail}</p>
                </div>
              </div>

              {/* Slot Details */}
              <div className="flex flex-col gap-2 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Date</span>
                  <span className="font-bold text-slate-800">{bookingDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Time Slot</span>
                  <span className="font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                    ⏱ {booking.startTime} - {booking.endTime}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Fee Received</span>
                  <span className="font-bold text-emerald-600">₹{booking.consultationFee}</span>
                </div>
              </div>

              {/* Card action buttons */}
              <div className="mt-2 border-t border-slate-50 pt-3">
                {type === "active" && (
                  <button
                    onClick={() => router.push(`/doctor/consultation/${booking._id}`)}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    💬 Join Consultation Call
                  </button>
                )}

                {type === "upcoming" && (
                  <div className="text-center text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100/50 py-2.5 rounded-xl uppercase tracking-wider">
                    Upcoming Consultation
                  </div>
                )}

                {type === "history" && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Completed</span>
                    <button
                      onClick={() => router.push(`/doctor/consultation/${booking._id}`)}
                      className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 text-[10px] font-bold rounded-lg transition-colors"
                    >
                      View Chat History
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      {/* Welcome Banner */}
      <div className="bg-slate-900 rounded-[28px] p-6 sm:p-8 text-white mb-8 border border-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.05)] relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black">Doctor Consultation Portal</h1>
          <p className="text-slate-400 text-xs mt-1.5">Manage appointment schedules and engage in live videocalls.</p>
        </div>
        
        {/* Active Consultation Notification badge */}
        {active.length > 0 && (
          <div className="bg-emerald-500 text-slate-950 font-black text-xs px-4 py-2 rounded-full flex items-center gap-2 animate-pulse self-start sm:self-center shadow-lg">
            <span>●</span> {active.length} Active Consultations Now!
          </div>
        )}
      </div>

      {/* Tabs list */}
      <div className="flex items-center border-b border-slate-200 gap-1.5 mb-8">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`pb-3.5 px-4 text-xs font-black transition-all border-b-2 ${activeTab === "upcoming" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-700"}`}
        >
          📅 Upcoming ({upcoming.length})
        </button>
        <button
          onClick={() => setActiveTab("active")}
          className={`pb-3.5 px-4 text-xs font-black transition-all border-b-2 relative ${activeTab === "active" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-700"}`}
        >
          {active.length > 0 && (
            <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          )}
          🎥 Active Now ({active.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`pb-3.5 px-4 text-xs font-black transition-all border-b-2 ${activeTab === "history" ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-700"}`}
        >
          📋 History ({history.length})
        </button>
      </div>

      {/* Display List */}
      <div>
        {activeTab === "upcoming" && renderBookingList(upcoming, "upcoming")}
        {activeTab === "active" && renderBookingList(active, "active")}
        {activeTab === "history" && renderBookingList(history, "history")}
      </div>
    </div>
  );
}
