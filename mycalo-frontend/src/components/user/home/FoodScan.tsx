"use client";

import { api } from "@/lib/axios";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Props, ScanResult } from "../../../types/nutrients.types";

export default function FoodScanModal({ mealType, date, onClose, onAdded }: Props) {
  const [step, setStep] = useState<"upload" | "scanning" | "result" | "adding" | "error">("upload");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [grams, setGrams] = useState(100);
  const [errorMessage, setErrorMessage] = useState<string>("");

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

    // Instant Image showing Without Flicker (Temporary Url)
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);

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

      pollIntervalRef.current = setInterval(async () => {
        try {
          const result = await api.get(`/nutrition/scan-result/${scanId}`);
          const { status, data } = result.data;

          if (status === "done") {
            clearTimers();

            if (data?.error) {
              stepRef.current = "error";
              setStep("error");
              setErrorMessage(data.message || "Food could not be identified. Please upload a clearer photo.");
              return;
            }

            if (!data.isFood) {
              toast.error(data.message || "This doesn't look like food!");
              stepRef.current = "upload";
              setStep("upload");
              return;
            }

            setScanResult({ ...data });
            setQuantity(data.defaultQuantity || 1);
            setGrams(data.defaultGrams || 100);
            stepRef.current = "result";
            setStep("result");
          }
        } catch {}
      }, 1000);

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
        date,
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
      const formData = new FormData();
      formData.append("data", JSON.stringify(payload));
      if (selectedFile) formData.append("image", selectedFile);

      const res = await api.post("/nutrition/log-meal", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.notification) {
        const { type, message } = res.data.notification;
        if (type === "hit") toast.success(message);
        else if (type === "over") toast.error(message);
      }

      toast.success(`✅ ${scanResult.foodName} added to ${mealType}!`);
      onAdded({ ...res.data.meal, tempImageUrl: imagePreview });
      onClose();
    } catch {
      toast.error("Failed to log meal. Try again.");
      setStep("result");
    }
  };

  return (
    // Backdrop blur added for a premium glass feel
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-all" onClick={(e) => e.target === e.currentTarget && onClose()}>
      {/* Modal Container */}
      <div className="w-full max-w-md bg-white rounded-t-[32px] lg:rounded-[32px] p-6 shadow-[0_20px_60px_rgb(0,0,0,0.08)] transition-all transform duration-300" style={{ maxHeight: "90vh", overflowY: "auto" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-medium text-slate-900 capitalize">Add to {mealType}</h2>
            <p className="text-[13px] font-medium text-slate-500 mt-1">{step === "upload" ? "Upload a food photo" : step === "scanning" ? "AI analyzing..." : step === "result" ? "" : step === "error" ? "Scan failed" : "Adding..."}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            ✕
          </button>
        </div>

        {/* Upload step */}
        {step === "upload" && (
          <label className="flex flex-col items-center justify-center h-56 rounded-[24px] border-2 border-dashed border-slate-200 bg-slate-50 cursor-pointer transition-all hover:border-orange-300 hover:bg-orange-50/50 group">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm border border-slate-100 group-hover:scale-105 transition-transform">📸</div>
            <p className="text-[15px] font-bold text-slate-700">Take or upload a photo</p>
            <p className="text-xs font-medium text-slate-400 mt-1.5">JPG, PNG up to 10MB</p>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
          </label>
        )}

        {/* Scanning step */}
        {step === "scanning" && (
          <div className="flex flex-col items-center py-12">
            {imagePreview && (
              <div className="w-32 h-32 rounded-[24px] overflow-hidden mb-6 shadow-sm border border-slate-100 p-1 bg-white">
                <img src={imagePreview} className="w-full h-full object-cover rounded-[18px]" alt="food preview" />
              </div>
            )}
            <div className="w-12 h-12 rounded-full animate-spin mb-5 border-4 border-slate-100 border-t-orange-500" />
            <p className="text-slate-800 font-bold text-lg">Analyzing food...</p>
            <p className="text-[13px] font-medium text-slate-500 mt-1.5">AI is identifying nutrients & macros</p>
          </div>
        )}

        {/* Error step */}
        {step === "error" && (
          <div className="flex flex-col items-center py-10 text-center">
            {imagePreview && (
              <div className="w-32 h-32 rounded-[24px] overflow-hidden mb-6 opacity-50 border border-slate-100 p-1 bg-white">
                <img src={imagePreview} className="w-full h-full object-cover rounded-[18px]" alt="food preview" />
              </div>
            )}
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-3xl mb-4 text-red-500">❌</div>
            <p className="text-slate-900 font-bold text-lg">Food could not be identified</p>
            <p className="text-[13px] mt-2 px-4 text-slate-500 font-medium leading-relaxed">{errorMessage || "Please upload a clearer photo with good lighting."}</p>
            <button onClick={handleRetry} className="mt-8 w-full h-14 rounded-[20px] font-bold text-[15px] transition-all bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-[0.98]">
              Try Again
            </button>
          </div>
        )}

        {/* Result step */}
        {step === "result" && scanResult && calculatedNutrition && (
          <div className="space-y-5">
            {/* Food image + name */}
            <div className="flex items-center gap-4 p-4 rounded-[24px] bg-slate-50 border border-slate-100">
              <div className="w-16 h-16 rounded-[18px] overflow-hidden shrink-0 bg-white shadow-sm border border-slate-50 p-0.5">
                {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover rounded-[14px]" alt={scanResult.foodName} /> : <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>}
              </div>
              <div>
                <p className="text-slate-900 font-medium text-lg leading-tight">{scanResult.foodName}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  {" "}
                  <div className={`w-2 h-2 rounded-full ${scanResult.confidence === "high" ? "bg-emerald-400" : scanResult.confidence === "medium" ? "bg-amber-400" : "bg-red-400"}`} />
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{scanResult.confidence} confidence</span>
                </div>
              </div>
            </div>

            {/* Nutrition display - Soft pastel colors */}
            <div className="grid grid-cols-4 gap-2.5">
              {[
                { label: "Calories", value: calculatedNutrition.calories, color: "text-slate-900", bg: "bg-slate-50" },
                { label: "Protein", value: calculatedNutrition.protein, color: "text-purple-600", bg: "bg-purple-50" },
                { label: "Carbs", value: calculatedNutrition.carbs, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Fat", value: calculatedNutrition.fat, color: "text-orange-600", bg: "bg-orange-50" },
              ].map((n) => (
                <div key={n.label} className={`p-3.5 rounded-[20px] text-center border border-slate-100/50 ${n.bg}`}>
                  <p className={`text-[17px] font-black ${n.color}`}>{n.value}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">{n.label}</p>
                </div>
              ))}
            </div>

            {/* Quantity / Grams adjuster */}
            <div className="p-5 rounded-[24px] space-y-4 bg-slate-50 border border-slate-100">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Adjust Amount</p>

              {/* Quantity (countable foods) */}
              {scanResult.type === "countable" && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[15px] text-slate-800 font-bold">Quantity ({scanResult.defaultUnit})</span>
                    <span className="text-[12px] font-medium text-slate-500">AI default: {scanResult.defaultQuantity}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setQuantity(Math.max(0.5, quantity - 0.5))}
                      className="w-12 h-12 rounded-[16px] font-black text-xl flex items-center justify-center bg-white border border-slate-200 text-slate-600 shadow-sm hover:bg-slate-50 transition-colors">
                      −
                    </button>
                    <div className="flex-1 text-center">
                      <span className="text-3xl font-black text-slate-900">{quantity}</span>
                      <span className="text-sm font-bold text-slate-400 ml-1.5">{scanResult.defaultUnit}</span>
                    </div>
                    <button onClick={() => setQuantity(quantity + 0.5)} className="w-12 h-12 rounded-[16px] font-black text-xl flex items-center justify-center bg-orange-500 text-white shadow-md hover:bg-orange-600 transition-colors">
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Grams (weighable foods) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[15px] text-slate-800 font-bold">Grams</span>
                  <span className="text-[12px] font-medium text-slate-500">AI default: {scanResult.defaultGrams}g</span>
                </div>
                {scanResult.type === "weighable" ? (
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setGrams(Math.max(10, grams - 25))}
                      className="w-12 h-12 rounded-[16px] font-black text-xl flex items-center justify-center bg-white border border-slate-200 text-slate-600 shadow-sm hover:bg-slate-50 transition-colors">
                      −
                    </button>
                    <div className="flex-1 text-center">
                      <span className="text-3xl font-black text-slate-900">{grams}</span>
                      <span className="text-sm font-bold text-slate-400 ml-1.5">g</span>
                    </div>
                    <button onClick={() => setGrams(grams + 25)} className="w-12 h-12 rounded-[16px] font-black text-xl flex items-center justify-center bg-orange-500 text-white shadow-md hover:bg-orange-600 transition-colors">
                      +
                    </button>
                  </div>
                ) : (
                  <div className="px-4 py-3 bg-white rounded-[16px] border border-slate-100 text-center">
                    <p className="text-[13px] font-bold text-slate-500">
                      ≈ <span className="text-slate-900 text-[15px] mx-1">{Math.round(quantity * scanResult.defaultGrams)}</span> g total
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Add button */}
            <button
              onClick={handleAddFood}
              className="w-full h-14 mt-2 rounded-[20px] font-medium text-[15px] flex items-center justify-center transition-all bg-[#f97316] text-white shadow-[0_8px_20px_rgba(249,115,22,0.25)] hover:-translate-y-0.5 hover:shadow-[0_12px_25px_rgba(249,115,22,0.3)] active:scale-[0.98]">
              Add {scanResult.foodName} • {calculatedNutrition.calories} kcal
            </button>
          </div>
        )}

        {/* Adding step */}
        {step === "adding" && (
          <div className="flex flex-col items-center py-12">
            <div className="w-12 h-12 rounded-full animate-spin border-4 border-slate-100 border-t-orange-500" />
            <p className="text-slate-800 font-bold text-lg mt-5">Logging meal...</p>
            <p className="text-[13px] font-medium text-slate-500 mt-1.5">Updating your daily macros</p>
          </div>
        )}
      </div>
    </div>
  );
}
