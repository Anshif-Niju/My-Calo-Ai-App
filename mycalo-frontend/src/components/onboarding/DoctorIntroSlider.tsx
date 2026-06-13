"use client";

import { api } from "@/lib/axios";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const slides = [
  {
    mobileImage: "https://res.cloudinary.com/dagoi6mwq/image/upload/q_auto/f_auto/v1780893671/Gemini_Generated_Image_r0w4qhr0w4qhr0w4_ukr5yg.png",
    desktopImage: "https://res.cloudinary.com/dagoi6mwq/image/upload/q_auto/f_auto/v1780894066/Gemini_Generated_Image_4w4l7w4w4l7w4w4l_impv9e.png",
    tag: "Telemedicine",
    title: "Consult patients anywhere",
    sub: "Video consultations, prescriptions, and patient management — all in one place.",
    hookText: "Consult patients your way",
    textDisplay: "Telemedicine",
  },
  {
    mobileImage: "https://res.cloudinary.com/dagoi6mwq/image/upload/q_auto/f_auto/v1780894241/Gemini_Generated_Image_uoq5i3uoq5i3uoq5_l1c5ae.png",
    desktopImage: "https://res.cloudinary.com/dagoi6mwq/image/upload/q_auto/f_auto/v1780894018/Gemini_Generated_Image_x78227x78227x782_ukvqym.png",
    tag: "Patient Management",
    title: "Manage your patients smartly",
    sub: "Track health history, prescriptions, and follow-ups with AI-powered insights.",
    hookText: "You set the price, you own it",
    textDisplay: "Patient Care",
  },
  {
    mobileImage: "https://res.cloudinary.com/dagoi6mwq/image/upload/q_auto/f_auto/v1780894581/Gemini_Generated_Image_617oa7617oa7617o_dqes7q.png",
    desktopImage: "https://res.cloudinary.com/dagoi6mwq/image/upload/q_auto/f_auto/v1780894712/Gemini_Generated_Image_j5t2c7j5t2c7j5t2_itvywh.png",
    tag: "Schedule Slots",
    title: "Close slots in busy Days",
    sub: "Schedule Slots based on your free time",
    hookText: "Practice on your own time",
    textDisplay: "Slot Available",
  },
];

export default function DoctorIntroSlider() {
  const [current, setCurrent] = useState(0);
  const router = useRouter();

  // Preload all mobile images on mount
  useEffect(() => {
    slides.forEach((s) => {
      const img = new Image();
      img.src = s.mobileImage;
      const img2 = new Image();
      img2.src = s.desktopImage;
    });
  }, []);

  const introMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/onboarding/doctor-intro-complete");
      return response.data;
    },
    onSuccess: () => router.replace("/onboarding/doctor/profile"),
    onError: (error: any) => {
      const msg = error.response?.data?.message;
      toast.error(typeof msg === "string" ? msg : "Something went wrong.");
    },
  });

  const handleNext = () => {
    if (current < slides.length - 1) setCurrent((p) => p + 1);
    else introMutation.mutate();
  };

  const slide = slides[current];
  const isLast = current === slides.length - 1;
  const isFirst = current === 0;
  const isDark = current === 2;

  const dots = (
    <div className="flex gap-1.5 mb-6">
      {slides.map((_, i) => (
        <div
          key={i}
          className="h-1.5 rounded-full transition-all duration-300"
          style={{
            width: i === current ? "24px" : "6px",
            background: i === current ? (isDark ? "#fff" : "#0a0a0a") : isDark ? "#333" : "#e5e5e5",
          }}
        />
      ))}
    </div>
  );

  const buttons = (
    <div className="flex gap-3">
      {!isFirst && (
        <button
          onClick={() => setCurrent((p) => p - 1)}
          className="h-14 w-14 shrink-0 rounded-2xl font-bold border flex items-center justify-center"
          style={{ borderColor: isDark ? "#333" : "#e5e5e5", color: isDark ? "#fff" : "#0a0a0a", background: "transparent" }}>
          ←
        </button>
      )}
      <button
        onClick={handleNext}
        disabled={introMutation.isPending}
        className="flex-1 h-14 rounded-2xl font-bold flex items-center justify-center transition-transform active:scale-[0.98] disabled:opacity-70"
        style={{ background: isDark ? "#fff" : "#0a0a0a", color: isDark ? "#0a0a0a" : "#fff" }}>
        {introMutation.isPending ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : isLast ? "Get Verified" : "Next"}
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black">
      {/* MOBILE */}
      <div className="lg:hidden fixed inset-0 flex flex-col overflow-hidden">
        <div className="relative w-full shrink-0" style={{ height: "55%" }}>
          <picture className="block w-full h-full">
            <img src={slide.mobileImage} alt={slide.title} className="absolute inset-0 w-full h-full object-cover" />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60" />
          {slide.hookText && (
            <div className="absolute bottom-20 left-5 right-5 z-10">
              <p className="text-white font-black leading-[1.1] text-2xl" style={{ fontFamily: "var(--font-head, 'Syne', sans-serif)" }}>
                {slide.hookText.split(" ").slice(0, 3).join(" ")}
                <br />
                <span className="text-white/70 font-semibold text-base">{slide.hookText.split(" ").slice(3).join(" ")}</span>
              </p>
              <div className="mt-3 inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-white/90 text-xs font-semibold tracking-wide">{slide.textDisplay}</span>
              </div>
            </div>
          )}
          <button
            onClick={() => introMutation.mutate()}
            disabled={introMutation.isPending}
            className="absolute top-6 right-6 text-white text-sm bg-white/20 hover:bg-white/30 transition-colors rounded-full px-4 py-1.5 backdrop-blur-sm disabled:opacity-50 z-20">
            Skip
          </button>
        </div>
        <div className="relative flex-1 rounded-t-[32px] px-6 pt-7 pb-8 flex flex-col z-10 -mt-8" style={{ background: isDark ? "#111111" : "#ffffff" }}>
          <div>
            <span className="text-xs font-bold px-3 py-1.5 rounded-full mb-4 inline-block" style={{ background: isDark ? "#222" : "#f0f0f0", color: isDark ? "#aaa" : "#333" }}>
              {slide.tag}
            </span>
            <h2 className="text-2xl font-bold leading-snug mb-3" style={{ color: isDark ? "#f0f0f0" : "#0a0a0a" }}>
              {slide.title}
            </h2>
            <p className="text-sm leading-relaxed font-medium" style={{ color: isDark ? "#666" : "#888" }}>
              {slide.sub}
            </p>
          </div>
          <div className="pt-4 border-t border-slate-100/10 mt-auto">
            {dots}
            {buttons}
          </div>
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden lg:flex w-full h-full">
        <div className="relative w-1/2 h-full overflow-hidden">
          <img src={slide.desktopImage} alt={slide.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/40" />
          {slide.hookText && (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute bottom-12 left-10 right-10 z-10">
                <div className="w-10 h-[3px] bg-white mb-4 rounded-full" />
                <p className="text-white font-black leading-[1.1]" style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)", fontFamily: "var(--font-head, 'Syne', sans-serif)" }}>
                  {slide.hookText.split(" ").slice(0, 3).join(" ")}
                  <br />
                  <span className="text-white/70 font-semibold" style={{ fontSize: "clamp(1.2rem, 2vw, 1.6rem)" }}>
                    {slide.hookText.split(" ").slice(3).join(" ")}
                  </span>
                </p>
                <div className="mt-4 inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-white/90 text-xs font-semibold tracking-wide">{slide.textDisplay}</span>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="w-1/2 flex flex-col justify-between px-16 py-12" style={{ background: isDark ? "#111111" : "#ffffff" }}>
          <button onClick={() => introMutation.mutate()} disabled={introMutation.isPending} className="self-end text-sm font-bold px-4 py-1.5 rounded-full" style={{ background: isDark ? "#222" : "#f0f0f0", color: isDark ? "#aaa" : "#333" }}>
            Skip
          </button>
          <div>
            <span className="text-xs font-bold px-3 py-1.5 rounded-full mb-4 inline-block" style={{ background: isDark ? "#222" : "#f0f0f0", color: isDark ? "#aaa" : "#333" }}>
              {slide.tag}
            </span>
            <h2 className="text-5xl font-bold leading-snug mb-4 mt-3" style={{ color: isDark ? "#f0f0f0" : "#0a0a0a" }}>
              {slide.title}
            </h2>
            <p className="text-lg leading-relaxed" style={{ color: isDark ? "#666" : "#888" }}>
              {slide.sub}
            </p>
          </div>
          <div>
            {dots}
            {buttons}
          </div>
        </div>
      </div>
    </div>
  );
}
