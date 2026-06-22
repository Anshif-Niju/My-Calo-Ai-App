"use client";

import { api } from "@/lib/axios";
import { RootState } from "@/store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";

interface DoctorProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  profilePhoto?: string;
  specialization: string;
  experience: number;
  qualifications: string[];
  about: string;
  services: string[];
  consultationFee: number;
}

interface Slot {
  id: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

interface Booking {
  _id: string;
  doctorId: string;
  doctorProfileId: {
    _id: string;
    name: string;
    profilePhoto?: string;
    specialization: string;
    consultationFee: number;
  };
  slotDate: string;
  slotDay: string;
  startTime: string;
  endTime: string;
  patientName: string;
  status: "pending_payment" | "confirmed" | "cancelled" | "completed";
}

// Helper to load Razorpay Script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function DoctorsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useSelector((state: RootState) => state.auth.user);

  // Layout states
  const [activeTab, setActiveTab] = useState<"find" | "my-consultations">("find");
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [checkoutBooking, setCheckoutBooking] = useState<any>(null);
  const [now, setNow] = useState(new Date());

  // Search/Filter states
  const [search, setSearch] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [sortBy, setSortBy] = useState("experience-desc");

  // Keep track of current time for live schedule transitions
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Fetch doctors list
  const { data: doctorsData, isLoading: doctorsLoading } = useQuery<{ doctors: DoctorProfile[] }>({
    queryKey: ["doctors-list", specialization, search],
    queryFn: async () => {
      const res = await api.get("/doctors/list", {
        params: { specialization, search, limit: 50 },
      });
      return res.data;
    },
  });

  // Fetch user consultations (bookings)
  const { data: myBookings = [], isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["user-bookings"],
    queryFn: async () => {
      const res = await api.get("/doctors/bookings/my");
      return res.data.data;
    },
    enabled: activeTab === "my-consultations",
  });

  // Generate next 7 dates list for calendar selector
  const getNext7Days = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  };
  const calendarDays = getNext7Days();

  // Initialize first date on doctor selection
  useEffect(() => {
    if (selectedDoctor) {
      setSelectedDate(calendarDays[0]);
    } else {
      setSelectedDate(null);
    }
  }, [selectedDoctor]);

  // Fetch available slots for selected doctor on selected date
  const dateStr = selectedDate ? selectedDate.toISOString().split("T")[0] : "";
  const { data: slots = [], isLoading: slotsLoading } = useQuery<Slot[]>({
    queryKey: ["doctor-slots", selectedDoctor?._id, dateStr],
    queryFn: async () => {
      const res = await api.get(`/doctors/${selectedDoctor?._id}/slots`, {
        params: { date: dateStr },
      });
      return res.data.data;
    },
    enabled: !!selectedDoctor && !!selectedDate,
  });

  // Mutations
  const bookMutation = useMutation({
    mutationFn: async (payload: { doctorProfileId: string; slotId: string; slotDate: string; slotDay: string }) => {
      const res = await api.post("/doctors/book", payload);
      return res.data.data;
    },
    onSuccess: (data) => {
      setCheckoutBooking(data);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message);
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: async (payload: {
      bookingId: string;
      razorpayPaymentId?: string;
      razorpayOrderId?: string;
      razorpaySignature?: string;
      mockPaymentSuccess?: boolean;
    }) => {
      const res = await api.post("/doctors/payment/verify", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Payment verified and booking confirmed! 🎉");
      setCheckoutBooking(null);
      setSelectedDoctor(null);
      setActiveTab("my-consultations");
      queryClient.invalidateQueries({ queryKey: ["user-bookings"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message);
    },
  });

  // Pay Handler
  const handlePayment = async () => {
    if (!checkoutBooking) return;

    const { booking, paymentDetails } = checkoutBooking;

    // Load Razorpay
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      toast.error("Failed to load payment gateway script. Try using mock pay.");
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder",
      amount: paymentDetails.amount * 100, // paise
      currency: paymentDetails.currency,
      name: "MyCalo AI",
      description: `Consultation with Dr. ${paymentDetails.doctorName}`,
      order_id: paymentDetails.orderId,
      handler: async function (response: any) {
        verifyPaymentMutation.mutate({
          bookingId: booking._id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpayOrderId: response.razorpay_order_id,
          razorpaySignature: response.razorpay_signature,
        });
      },
      prefill: {
        name: user?.name || "Patient",
        email: user?.email || "",
      },
      theme: {
        color: "#0f172a",
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  // Mock Pay Bypass for local testing
  const handleMockPay = () => {
    if (!checkoutBooking) return;
    verifyPaymentMutation.mutate({
      bookingId: checkoutBooking.booking._id,
      mockPaymentSuccess: true,
    });
  };

  // Classification of My Consultations
  const classifyBookings = () => {
    const upcoming: Booking[] = [];
    const active: Booking[] = [];
    const history: Booking[] = [];

    myBookings.forEach((booking) => {
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
          history.push(booking);
        }
      }
    });

    return { upcoming, active, history };
  };

  const { upcoming, active, history } = classifyBookings();

  // Sorting
  const sortedDoctors = [...(doctorsData?.doctors || [])].sort((a, b) => {
    if (sortBy === "fee-asc") return a.consultationFee - b.consultationFee;
    if (sortBy === "fee-desc") return b.consultationFee - a.consultationFee;
    if (sortBy === "experience-desc") return b.experience - a.experience;
    return 0;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      
      {/* Header and Toggle Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">Doctors Hub</h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">
            Consult verified specialists or check your booked schedules
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50 self-start sm:self-center">
          <button
            onClick={() => setActiveTab("find")}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === "find" ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          >
            🔍 Find Doctors
          </button>
          <button
            onClick={() => setActiveTab("my-consultations")}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all relative ${activeTab === "my-consultations" ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          >
            {active.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
            )}
            ⏱ My Consultations
          </button>
        </div>
      </div>

      {/* ─── TAB 1: FIND DOCTORS ─── */}
      {activeTab === "find" && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 border border-slate-100 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or keyword..."
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
            
            <select
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="">All Specializations</option>
              <option value="Cardiologist">Cardiologist</option>
              <option value="Dietitian">Dietitian</option>
              <option value="Nutritionist">Nutritionist</option>
              <option value="Dermatologist">Dermatologist</option>
              <option value="General Physician">General Physician</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="experience-desc">Sort by Experience (High to Low)</option>
              <option value="fee-asc">Sort by Fee (Low to High)</option>
              <option value="fee-desc">Sort by Fee (High to Low)</option>
            </select>
          </div>

          {/* Doctors Listing */}
          {doctorsLoading ? (
            <div className="min-h-[30vh] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
            </div>
          ) : sortedDoctors.length === 0 ? (
            <div className="text-center py-20 bg-white border border-slate-100 rounded-[28px]">
              <span className="text-3xl">👨‍⚕️</span>
              <h4 className="font-bold text-slate-800 mt-3">No verified doctors found</h4>
              <p className="text-xs text-slate-400 mt-1">Try resetting filters or checking back later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedDoctors.map((doc) => (
                <div
                  key={doc._id}
                  className="bg-white border border-slate-100 rounded-[24px] shadow-[0_4px_25px_rgba(0,0,0,0.01)] p-6 flex flex-col gap-4 hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-slate-900 to-slate-700 text-white flex items-center justify-center font-black text-lg">
                      {doc.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">Dr. {doc.name}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{doc.specialization}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed h-8">
                    {doc.about || "No profile bio provided yet."}
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-0.5">Experience</p>
                      <span className="font-bold text-slate-800">{doc.experience} Years</span>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-0.5">Consultation Fee</p>
                      <span className="font-bold text-emerald-600">₹{doc.consultationFee}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedDoctor(doc)}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-all"
                  >
                    Select & Book Appointment
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: MY CONSULTATIONS ─── */}
      {activeTab === "my-consultations" && (
        <div className="flex flex-col gap-8 animate-in fade-in duration-200">
          
          {/* Active now */}
          {active.length > 0 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-black text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                Active Consultation Now
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {active.map((booking) => (
                  <div key={booking._id} className="bg-emerald-50/40 border border-emerald-100 rounded-[24px] p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">🩺</div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm">Dr. {booking.doctorProfileId?.name}</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{booking.doctorProfileId?.specialization}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs bg-white/70 border border-emerald-100/50 p-3 rounded-xl">
                      <span className="text-slate-600">Scheduled Time</span>
                      <span className="font-bold text-slate-900">⏱ {booking.startTime} - {booking.endTime}</span>
                    </div>
                    <button
                      onClick={() => router.push(`/doctors/consultation/${booking._id}`)}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-600/10"
                    >
                      💬 Join Consultation Call (Active)
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Booked (Upcoming) */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Upcoming Consultation Schedules</h3>
            {upcoming.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 ml-1">No upcoming consultations booked.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcoming.map((booking) => {
                  const bookingDate = new Date(booking.slotDate).toLocaleDateString("en-IN", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  return (
                    <div key={booking._id} className="bg-white border border-slate-100 rounded-[24px] p-6 flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">
                          {booking.doctorProfileId?.name?.charAt(0).toUpperCase() || "D"}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">Dr. {booking.doctorProfileId?.name}</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{booking.doctorProfileId?.specialization}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                        <div className="flex items-center justify-between">
                          <span>Scheduled Date</span>
                          <span className="font-bold text-slate-800">{bookingDate}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Time Slot</span>
                          <span className="font-bold text-slate-800">⏱ {booking.startTime} - {booking.endTime}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* History */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Consultation History</h3>
            {history.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 ml-1">No previous consultations found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {history.map((booking) => {
                  const bookingDate = new Date(booking.slotDate).toLocaleDateString("en-IN", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  return (
                    <div key={booking._id} className="bg-white border border-slate-100 rounded-[24px] p-6 flex flex-col gap-4">
                      <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">Dr. {booking.doctorProfileId?.name}</span>
                        </div>
                        <span className="text-[9px] font-black uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-400">
                          {booking.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex flex-col gap-1.5">
                        <div className="flex justify-between"><span>Date:</span> <span className="font-bold text-slate-700">{bookingDate}</span></div>
                        <div className="flex justify-between"><span>Slot:</span> <span className="font-bold text-slate-700">{booking.startTime} - {booking.endTime}</span></div>
                      </div>
                      <button
                        onClick={() => router.push(`/doctors/consultation/${booking._id}`)}
                        className="w-full py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors mt-2"
                      >
                        View Chat History
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ─── MODAL 1: DOCTOR BOOKING DETAIL & SLOT SELECTOR ─── */}
      {selectedDoctor && !checkoutBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[28px] shadow-2xl p-6 sm:p-8 w-full max-w-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header info */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-[16px] bg-slate-900 text-white flex items-center justify-center font-black text-lg">
                  {selectedDoctor.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Dr. {selectedDoctor.name}</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{selectedDoctor.specialization}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDoctor(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* About and specialties */}
            <div className="flex flex-col gap-4 text-xs text-slate-650 leading-relaxed mb-6 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="font-black text-slate-800 uppercase tracking-wider text-[10px]">About Doctor</span>
                <p className="mt-1">{selectedDoctor.about || "No biography details available."}</p>
              </div>
              {selectedDoctor.qualifications?.length > 0 && (
                <div>
                  <span className="font-black text-slate-800 uppercase tracking-wider text-[10px]">Qualifications</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedDoctor.qualifications.map((q) => (
                      <span key={q} className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">{q}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Availability Calendar Selector */}
            <div className="mb-6">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">1. Select Appointment Date</span>
              <div className="flex gap-2 overflow-x-auto pb-2 mt-2">
                {calendarDays.map((date) => {
                  const active = selectedDate?.toDateString() === date.toDateString();
                  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
                  const dayNum = date.getDate();
                  const month = date.toLocaleDateString("en-US", { month: "short" });

                  return (
                    <button
                      key={date.toISOString()}
                      type="button"
                      onClick={() => setSelectedDate(date)}
                      className={`flex flex-col items-center p-3 rounded-xl border min-w-[70px] transition-all ${active ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/10" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                    >
                      <span className="text-[10px] uppercase font-bold opacity-75">{weekday}</span>
                      <span className="text-base font-black my-0.5">{dayNum}</span>
                      <span className="text-[9px] uppercase font-bold opacity-75">{month}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slots grid */}
            <div>
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">
                2. Select Available Slot (10:00 AM - 10:00 PM)
              </span>

              {slotsLoading ? (
                <div className="py-12 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl mt-2">
                  <p className="text-xs text-slate-400 font-bold">No availability slots set for this day.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={slot.isBooked}
                      onClick={() => {
                        if (!selectedDate) return;
                        const dayName = selectedDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
                        bookMutation.mutate({
                          doctorProfileId: selectedDoctor._id,
                          slotId: slot.id,
                          slotDate: dateStr,
                          slotDay: dayName,
                        });
                      }}
                      className={`py-3 px-2 rounded-xl text-[11px] font-bold border transition-all ${slot.isBooked ? "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed" : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-900"}`}
                    >
                      {slot.startTime} - {slot.endTime}
                      {slot.isBooked && <span className="block text-[8px] text-red-400 font-bold uppercase mt-0.5">Booked</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ─── MODAL 2: CHECKOUT INFORMATION & RAZORPAY BILL ─── */}
      {checkoutBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[28px] shadow-2xl p-6 sm:p-8 w-full max-w-md border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="text-center mb-6">
              <span className="text-3xl">💳</span>
              <h3 className="text-lg font-black text-slate-900 mt-2">Consultation Invoice</h3>
              <p className="text-xs text-slate-400 mt-1">Review the details and complete payment</p>
            </div>

            {/* Bill Summary */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col gap-3.5 mb-6 text-xs text-slate-700">
              <div className="flex justify-between border-b border-slate-200/55 pb-2">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Doctor</span>
                <span className="font-bold text-slate-800">Dr. {checkoutBooking.paymentDetails.doctorName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/55 pb-2">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Consultation Schedule</span>
                <span className="font-bold text-slate-800">
                  {checkoutBooking.paymentDetails.slotDate} ({checkoutBooking.paymentDetails.slotTime})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Consultation Fee</span>
                <span className="font-bold text-slate-800">₹{checkoutBooking.paymentDetails.consultationFee}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/55 pb-2">
                <span className="text-slate-500">GST ({checkoutBooking.paymentDetails.gstPercent}%)</span>
                <span className="font-bold text-slate-800">₹{checkoutBooking.paymentDetails.gstAmount}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-black text-slate-900 pt-1">
                <span>Total Payable</span>
                <span className="text-emerald-600 text-base">₹{checkoutBooking.paymentDetails.totalAmount}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handlePayment}
                disabled={verifyPaymentMutation.isPending}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm rounded-[16px] shadow-lg transition-all"
              >
                {verifyPaymentMutation.isPending ? "Processing..." : "💳 Pay Now (Razorpay)"}
              </button>

              {/* Mock pay option for easy developer test */}
              <button
                type="button"
                onClick={handleMockPay}
                disabled={verifyPaymentMutation.isPending}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                ⚡ Bypass Payment (Mock Success)
              </button>

              <button
                type="button"
                disabled={verifyPaymentMutation.isPending}
                onClick={() => setCheckoutBooking(null)}
                className="w-full py-2.5 text-slate-400 hover:text-slate-700 font-bold text-xs transition-colors mt-1"
              >
                Cancel Booking
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
