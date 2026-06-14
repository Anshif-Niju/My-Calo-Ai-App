"use client";

import { api } from "@/lib/axios";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Props, ScanResult } from "../../types/nutrients.types";

export default function FoodScanModal({ mealType, date, onClose, onAdded }: Props) {
  const [step, setStep] = useState<"upload" | "scanning" | "result" | "adding" | "error">("upload");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [grams, setGrams] = useState(100);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // useRef to avoid stale closure in setTimeout
  const fileRef = useRef<HTMLInputElement>(null);
  const stepRef = useRef<string>("upload");
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const calculatedNutrition = scanResult
    ? (() => {
        if (scanResult.type === "countable") {
          const factor = quantity;
          const n = scanResult.nutritionPerUnit;
          return {
            calories: Math.round(n.calories * factor),
            protein: Math.round(n.protein * factor * 10) / 10,
            carbs: Math.round(n.carbs * factor * 10) / 10,
            fat: Math.round(n.fat * factor * 10) / 10,
            fiber: Math.round(n.fiber * factor * 10) / 10,
          };
        } else {
          const factor = grams / 100;
          const n = scanResult.nutritionPer100g;
          return {
            calories: Math.round(n.calories * factor),
            protein: Math.round(n.protein * factor * 10) / 10,
            carbs: Math.round(n.carbs * factor * 10) / 10,
            fat: Math.round(n.fat * factor * 10) / 10,
            fiber: Math.round(n.fiber * factor * 10) / 10,
          };
        }
      })()
    : null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    stepRef.current = "scanning";
    setStep("scanning");
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await api.post("/nutrition/scan-food", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { scanId } = res.data;

      // Poll for result every 2s
      pollIntervalRef.current = setInterval(async () => {
        try {
          const result = await api.get(`/nutrition/scan-result/${scanId}`);
          const { status, data } = result.data;

          if (status === "done") {
            clearTimers();

            // ── Worker returned error (3 retries exhausted) ──────────────
            if (data?.error) {
              stepRef.current = "error";
              setStep("error");
              setErrorMessage(data.message || "Food could not be identified. Please upload a clearer photo.");
              return;
            }

            // ── Not a food image ─────────────────────────────────────────
            if (!data.isFood) {
              toast.error(data.message || "This doesn't look like food!");
              stepRef.current = "upload";
              setStep("upload");
              return;
            }

            // ── Success ──────────────────────────────────────────────────
            setScanResult({ ...data });
            setQuantity(data.defaultQuantity || 1);
            setGrams(data.defaultGrams || 100);
            stepRef.current = "result";
            setStep("result");
          }
        } catch {
          // Poll request failed — keep trying until timeout
        }
      }, 2000);

      // 30s timeout — use stepRef to avoid stale closure
      timeoutRef.current = setTimeout(() => {
        clearTimers();
        if (stepRef.current === "scanning") {
          stepRef.current = "error";
          setStep("error");
          setErrorMessage("Scan timed out. Please try again with a clearer photo.");
        }
      }, 50000);
    } catch {
      toast.error("Upload failed. Try again.");
      stepRef.current = "upload";
      setStep("upload");
    }
  };

  const handleRetry = () => {
    setStep("upload");
    stepRef.current = "upload";
    setErrorMessage("");
    setImagePreview(null);
    setScanResult(null);
  };

  const handleAddFood = async () => {
    if (!scanResult || !calculatedNutrition) return;
    setStep("adding");

    try {
      const payload = {
        mealType,
        foodName: scanResult.foodName,
        date, // ← required by logMealSchema
        quantity: scanResult.type === "countable" ? quantity : 1,
        unit: scanResult.type === "countable" ? scanResult.defaultUnit : "g",
        grams: scanResult.type === "countable" ? quantity * scanResult.defaultGrams : grams,
        ...calculatedNutrition,
        imageUrl: scanResult.imageUrl,
        source: "scan",
        scanData: {
          type: scanResult.type,
          nutritionPer100g: scanResult.nutritionPer100g,
          nutritionPerUnit: scanResult.nutritionPerUnit,
          confidence: scanResult.confidence,
        },
      };

      const res = await api.post("/nutrition/log-meal", payload);

      // Show notification if goal hit/over
      if (res.data.notification) {
        const { type, message } = res.data.notification;
        if (type === "hit") toast.success(message);
        else if (type === "over") toast.error(message);
      }

      toast.success(`✅ ${scanResult.foodName} added to ${mealType}!`);
      onAdded();
      onClose();
    } catch {
      toast.error("Failed to log meal. Try again.");
      setStep("result");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center" style={{ background: "rgba(0,0,0,0.85)" }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-t-[32px] lg:rounded-[32px] p-6" style={{ background: "var(--bg2)", maxHeight: "90vh", overflowY: "auto" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-black text-white capitalize">Add to {mealType}</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text3)" }}>
              {step === "upload" ? "Upload a food photo" : step === "scanning" ? "AI analyzing..." : step === "result" ? "Adjust & confirm" : step === "error" ? "Scan failed" : "Adding..."}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--surface)", color: "var(--text2)" }}>
            ✕
          </button>
        </div>

        {/* Upload step */}
        {step === "upload" && (
          <label className="flex flex-col items-center justify-center h-48 rounded-2xl border-2 border-dashed cursor-pointer transition-all hover:border-opacity-100" style={{ borderColor: "var(--border2)", background: "var(--surface)" }}>
            <span className="text-4xl mb-3">📸</span>
            <p className="text-sm font-bold text-white">Take or upload a photo</p>
            <p className="text-xs mt-1" style={{ color: "var(--text3)" }}>
              JPG, PNG up to 10MB
            </p>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
          </label>
        )}

        {/* Scanning step */}
        {step === "scanning" && (
          <div className="flex flex-col items-center py-10">
            {imagePreview && (
              <div className="w-32 h-32 rounded-2xl overflow-hidden mb-5">
                <img src={imagePreview} className="w-full h-full object-cover" alt="food preview" />
              </div>
            )}
            <div
              className="w-10 h-10 rounded-full animate-spin mb-4"
              style={{
                border: "3px solid var(--lime)",
                borderTopColor: "transparent",
              }}
            />
            <p className="text-white font-bold">Analyzing food...</p>
            <p className="text-xs mt-1" style={{ color: "var(--text3)" }}>
              AI is identifying nutrients
            </p>
          </div>
        )}

        {/* ── Error step (3 retries exhausted / timeout) ───────────────── */}
        {step === "error" && (
          <div className="flex flex-col items-center py-10 text-center">
            {imagePreview && (
              <div className="w-32 h-32 rounded-2xl overflow-hidden mb-5 opacity-50">
                <img src={imagePreview} className="w-full h-full object-cover" alt="food preview" />
              </div>
            )}
            <span className="text-5xl mb-4">❌</span>
            <p className="text-white font-bold text-base">Food could not be identified</p>
            <p className="text-sm mt-2 px-4" style={{ color: "var(--text3)" }}>
              {errorMessage || "Please upload a clearer photo with good lighting."}
            </p>
            <button onClick={handleRetry} className="mt-6 px-8 h-12 rounded-2xl font-bold text-sm transition-all active:scale-[0.98]" style={{ background: "var(--lime)", color: "#000" }}>
              Try Again
            </button>
          </div>
        )}

        {/* Result step */}
        {step === "result" && scanResult && calculatedNutrition && (
          <div className="space-y-4">
            {/* Food image + name */}
            <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: "var(--surface)" }}>
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                {scanResult.imageUrl ? <img src={scanResult.imageUrl} className="w-full h-full object-cover" alt={scanResult.foodName} /> : <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>}
              </div>
              <div>
                <p className="text-white font-black text-base">{scanResult.foodName}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${scanResult.confidence === "high" ? "bg-green-400" : scanResult.confidence === "medium" ? "bg-yellow-400" : "bg-red-400"}`} />
                  <span className="text-xs capitalize" style={{ color: "var(--text3)" }}>
                    {scanResult.confidence} confidence
                  </span>
                </div>
              </div>
            </div>

            {/* Nutrition display */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Calories", value: calculatedNutrition.calories, unit: "kcal", color: "var(--lime)" },
                { label: "Protein", value: calculatedNutrition.protein, unit: "g", color: "#ff6464" },
                { label: "Carbs", value: calculatedNutrition.carbs, unit: "g", color: "#ffb432" },
                { label: "Fat", value: calculatedNutrition.fat, unit: "g", color: "#6496ff" },
              ].map((n) => (
                <div key={n.label} className="p-3 rounded-xl text-center" style={{ background: "var(--surface)" }}>
                  <p className="text-sm font-black" style={{ color: n.color }}>
                    {n.value}
                  </p>
                  <p className="text-[9px] mt-0.5" style={{ color: "var(--text3)" }}>
                    {n.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Quantity / Grams adjuster */}
            <div className="p-4 rounded-2xl space-y-4" style={{ background: "var(--surface)" }}>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text2)" }}>
                Adjust Amount
              </p>

              {/* Quantity (countable foods) */}
              {scanResult.type === "countable" && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white font-semibold">Quantity ({scanResult.defaultUnit})</span>
                    <span className="text-xs" style={{ color: "var(--text3)" }}>
                      AI default: {scanResult.defaultQuantity}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setQuantity(Math.max(0.5, quantity - 0.5))} className="w-10 h-10 rounded-xl font-bold text-lg flex items-center justify-center" style={{ background: "var(--bg3)", color: "var(--text)" }}>
                      −
                    </button>
                    <div className="flex-1 text-center">
                      <span className="text-2xl font-black text-white">{quantity}</span>
                      <span className="text-sm ml-1" style={{ color: "var(--text3)" }}>
                        {scanResult.defaultUnit}
                      </span>
                    </div>
                    <button onClick={() => setQuantity(quantity + 0.5)} className="w-10 h-10 rounded-xl font-bold text-lg flex items-center justify-center" style={{ background: "var(--lime)", color: "#000" }}>
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Grams (weighable foods) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white font-semibold">Grams</span>
                  <span className="text-xs" style={{ color: "var(--text3)" }}>
                    AI default: {scanResult.defaultGrams}g
                  </span>
                </div>
                {scanResult.type === "weighable" ? (
                  <div className="flex items-center gap-3">
                    <button onClick={() => setGrams(Math.max(10, grams - 25))} className="w-10 h-10 rounded-xl font-bold flex items-center justify-center" style={{ background: "var(--bg3)", color: "var(--text)" }}>
                      −
                    </button>
                    <div className="flex-1 text-center">
                      <span className="text-2xl font-black text-white">{grams}</span>
                      <span className="text-sm ml-1" style={{ color: "var(--text3)" }}>
                        g
                      </span>
                    </div>
                    <button onClick={() => setGrams(grams + 25)} className="w-10 h-10 rounded-xl font-bold flex items-center justify-center" style={{ background: "var(--lime)", color: "#000" }}>
                      +
                    </button>
                  </div>
                ) : (
                  <p className="text-xs" style={{ color: "var(--text3)" }}>
                    ≈ {Math.round(quantity * scanResult.defaultGrams)}g total
                  </p>
                )}
              </div>
            </div>

            {/* Add button */}
            <button onClick={handleAddFood} className="w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center transition-all active:scale-[0.98]" style={{ background: "var(--lime)", color: "#000" }}>
              Add {scanResult.foodName} — {calculatedNutrition.calories} kcal
            </button>
          </div>
        )}

        {/* Adding step */}
        {step === "adding" && (
          <div className="flex flex-col items-center py-10">
            <div
              className="w-10 h-10 rounded-full animate-spin"
              style={{
                border: "3px solid var(--lime)",
                borderTopColor: "transparent",
              }}
            />
            <p className="text-white font-bold mt-4">Logging meal...</p>
          </div>
        )}
      </div>
    </div>
  );
}
