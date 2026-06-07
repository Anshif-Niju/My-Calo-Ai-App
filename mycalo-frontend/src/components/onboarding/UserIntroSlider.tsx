"use client";

import { api } from "@/lib/axios";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const slides = [
  {
    image: "https://res.cloudinary.com/dagoi6mwq/image/upload/q_auto/f_auto/v1780724340/Gemini_Generated_Image_ssf6udssf6udssf6_1_yltev8.png",
    tag: "Calorie Tracker",
    title: "Effortless calorie tracking",
    sub: "Snap your meal and we'll handle the rest — calorie tracking made simple.",
  },
  {
    image: "YOUR_SECOND_IMAGE_URL",
    tag: "Doctor Booking",
    title: "Book a doctor in seconds",
    sub: "50+ verified doctors available 24/7 for video consultation.",
  },
  {
    image: "YOUR_THIRD_IMAGE_URL",
    tag: "AI Assistant",
    title: "Meet your AI nutrition coach",
    sub: "Ask anything about food, health, and your goals — powered by Gemini AI.",
  },
];

export default function UserIntroSlider() {
  const [current, setCurrent] = useState(0);
  const router = useRouter();

  const introMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/onboarding/intro-complete");
      return response.data;
    },
    onSuccess: () => {
      router.push("/onboarding/user/profile");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Something went wrong.";
      toast.error(message);
    },
  });

  const handleNext = () => {
    if (current < slides.length - 1) {
      setCurrent((prev) => prev + 1);
    } else {
      introMutation.mutate();
    }
  };

  const slide = slides[current];
  const isLast = current === slides.length - 1;
  const isDark = current === 2;

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="relative w-full h-[100dvh] sm:h-[780px] sm:max-w-sm mx-auto  flex flex-col sm:rounded-[32px] overflow-hidden">
        {/* Image — reduced from 55% to 42% */}
        <div className="relative w-full shrink-0" style={{ height: "42%" }}>
          <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60" />
          <button
            onClick={() => introMutation.mutate()}
            disabled={introMutation.isPending}
            className="absolute top-6 right-6 text-white text-sm bg-white/20 hover:bg-white/30 transition-colors rounded-full px-4 py-1.5 backdrop-blur-sm disabled:opacity-50 z-20">
            Skip
          </button>
        </div>

        {/* Bottom Card — flex-1 fills remaining 58%, no scroll */}
        <div className="relative flex-1 rounded-t-[32px] px-6 pt-7 pb-8 flex flex-col z-10 -mt-8" style={{ background: isDark ? "#111111" : "#ffffff" }}>
          {/* Content — no overflow-y-auto, just natural flow */}
          <div >
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

          {/* Dots + Button — always at bottom */}
          <div className="pt-4 border-t border-slate-100/10">
            <div className="flex gap-1.5 mb-5">
              {slides.map((_, i) => (
                <div
                  key={i}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: i === current ? "24px" : "6px",
                    background: i === current ? (isDark ? "#ffffff" : "#0a0a0a") : isDark ? "#333" : "#e5e5e5",
                  }}
                />
              ))}
            </div>
            <button
              onClick={handleNext}
              disabled={introMutation.isPending}
              className="w-full h-14 rounded-2xl text-base font-bold transition-transform active:scale-[0.98] disabled:opacity-70 flex items-center justify-center shadow-lg"
              style={{
                background: isDark ? "#ffffff" : "#0a0a0a",
                color: isDark ? "#0a0a0a" : "#ffffff",
              }}>
              {introMutation.isPending ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : isLast ? "Get Started" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
