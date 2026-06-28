"use client";

import { api } from "@/lib/axios";
import { getSocket } from "@/lib/socket";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { Props, ScanResult } from "../../../types/nutrients.types";

function OrangeSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  return (
    <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>

      <div className="absolute inset-0 rounded-full bg-orange-500/10 animate-ping opacity-75" style={{ animationDuration: "1.5s" }} />
      <div className="absolute w-3/4 h-3/4 rounded-full bg-orange-500/5 blur-sm" />
      <svg
        className="w-full h-full animate-spin-smooth"
        viewBox="0 0 50 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          stroke="url(#orange-spinner-gradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="90 30"
        />
        <defs>
          <linearGradient id="orange-spinner-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="60%" stopColor="#fdba74" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export default function FoodScanModal({ mealType, date, onClose, onAdded }: Props) {
  const [step, setStep] = useState<"upload" | "scanning" | "result" | "adding" | "error">("upload");
  const [activeTab, setActiveTab] = useState<"scan" | "search">("scan");

  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [grams, setGrams] = useState(100);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Search DB State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const stepRef = useRef<string>("upload");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketEventRef = useRef<string | null>(null);

  // Debounced search for DB foods
  useEffect(() => {
    if (activeTab !== "search" || step !== "upload") return;
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await api.get(`/nutrition/search-foods?q=${searchQuery}`);
        setSearchResults(res.data.foods || []);
      } catch {
        toast.error("Failed to search database");
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, activeTab, step]);

  const clearTimers = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (socketEventRef.current) {
      getSocket().off(socketEventRef.current);
      socketEventRef.current = null;
    }
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
      const eventName = `scan:complete:${scanId}`;
      socketEventRef.current = eventName;

      const socket = getSocket();

      socket.on(eventName, ({ data }: { status: string; data: any }) => {
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
      });

      const fallbackPoll = async () => {
        try {
          const result = await api.get(`/nutrition/scan-result/${scanId}`);
          const { status, data } = result.data;
          if (status === "done" && stepRef.current === "scanning") {
            clearTimers();
            if (data?.error) { stepRef.current = "error"; setStep("error"); setErrorMessage(data.message || ""); return; }
            if (!data.isFood) { toast.error(data.message || "This doesn't look like food!"); stepRef.current = "upload"; setStep("upload"); return; }
            setScanResult({ ...data }); setQuantity(data.defaultQuantity || 1); setGrams(data.defaultGrams || 100); stepRef.current = "result"; setStep("result");
          }
        } catch {}
      };

      const retryTimer = setInterval(fallbackPoll, 3000);
      timeoutRef.current = retryTimer as any;

      setTimeout(() => {
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

  const handleSelectSearchedFood = (food: any) => {
    setScanResult({
      isFood: true,
      foodName: food.name,
      category: food.category,
      type: food.servingType,
      defaultQuantity: food.defaultQuantity || 1,
      defaultUnit: food.defaultUnit || "piece",
      defaultGrams: food.defaultGrams || 100,
      nutritionPerUnit: food.nutritionPerUnit || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
      nutritionPer100g: food.nutritionPer100g || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
      confidence: "high",
      imageUrl: "",
    });
    setQuantity(food.defaultQuantity || 1);
    setGrams(food.defaultGrams || 100);
    stepRef.current = "result";
    setStep("result");
  };

  const handleRetry = () => {
    setStep("upload");
    stepRef.current = "upload";
    setErrorMessage("");
    setImagePreview(null);
    setScanResult(null);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleAddFood = async () => {
    if (!scanResult || !calculatedNutrition) return;
    setStep("adding");

    try {
      const payload = {
        mealType,
        foodName: scanResult.foodName,
        category: scanResult.category || "other",
        date,
        quantity: scanResult.type === "countable" ? quantity : 1,
        unit: scanResult.type === "countable" ? scanResult.defaultUnit : "g",
        grams: scanResult.type === "countable" ? quantity * scanResult.defaultGrams : grams,
        ...calculatedNutrition,
        imageUrl: scanResult.imageUrl || undefined,
        source: scanResult.imageUrl ? "scan" : "search",
        scanData: scanResult.imageUrl ? {
          type: scanResult.type,
          nutritionPer100g: scanResult.nutritionPer100g,
          nutritionPerUnit: scanResult.nutritionPerUnit,
          confidence: scanResult.confidence,
        } : undefined,
      };
      const formData = new FormData();
      formData.append("data", JSON.stringify(payload));
      if (selectedFile && scanResult.imageUrl) {
        formData.append("image", selectedFile);
      }

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
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-all" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md bg-white rounded-t-[32px] lg:rounded-[32px] p-6 shadow-[0_20px_60px_rgb(0,0,0,0.08)] transition-all transform duration-300" style={{ maxHeight: "90vh", overflowY: "auto" }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-medium text-slate-900 capitalize">Add to {mealType}</h2>
            <p className="text-[13px] font-medium text-slate-500 mt-1">
              {step === "upload"
                ? (activeTab === "scan" ? "Upload a food photo" : "Search database by name")
                : step === "scanning"
                ? "AI analyzing..."
                : step === "result"
                ? "Review nutritional content"
                : step === "error"
                ? "Scan failed"
                : "Adding..."}
            </p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            ✕
          </button>
        </div>

        {/* Tab Selection (only visible in upload stage) */}
        {step === "upload" && (
          <div className="flex gap-2 p-1 bg-slate-50 rounded-[18px] border border-slate-100 mb-6 shadow-inner">
            <button
              onClick={() => setActiveTab("scan")}
              className={`flex-1 py-2.5 rounded-[14px] text-[13px] font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === "scan" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              📸 AI Scan
            </button>
            <button
              onClick={() => setActiveTab("search")}
              className={`flex-1 py-2.5 rounded-[14px] text-[13px] font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === "search" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              🔍 Search DB
            </button>
          </div>
        )}

        {/* Upload/Scan Tab */}
        {step === "upload" && activeTab === "scan" && (
          <label className="flex flex-col items-center justify-center h-56 rounded-[24px] border-2 border-dashed border-slate-200 bg-slate-50 cursor-pointer transition-all hover:border-orange-300 hover:bg-orange-50/50 group">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm border border-slate-100 group-hover:scale-105 transition-transform">📸</div>
            <p className="text-[15px] font-bold text-slate-700">Take or upload a photo</p>
            <p className="text-xs font-medium text-slate-400 mt-1.5">JPG, PNG up to 10MB</p>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
          </label>
        )}

        {/* Search DB Tab */}
        {step === "upload" && activeTab === "search" && (
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-slate-400 text-base">🔍</span>
              </div>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search food by name..."
                className="w-full rounded-[16px] border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all shadow-sm"
              />
            </div>

            {isSearching ? (
              <div className="py-12 flex justify-center">
                <OrangeSpinner size="sm" />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-[24px] bg-slate-50/50">
                <p className="text-sm font-bold text-slate-400 px-4 leading-relaxed">
                  {searchQuery ? "No matching foods found in database" : "Type above to search database"}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {searchResults.map((food) => {
                  const cal = food.servingType === "countable"
                    ? food.nutritionPerUnit?.calories
                    : food.nutritionPer100g?.calories;
                  return (
                    <button
                      key={food._id}
                      onClick={() => handleSelectSearchedFood(food)}
                      className="w-full p-4 rounded-[20px] bg-slate-50 hover:bg-slate-100 border border-slate-100/50 transition-colors flex items-center justify-between text-left group"
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-800 group-hover:text-slate-900">{food.name}</p>
                        <p className="text-[11px] font-medium text-slate-400 mt-1 uppercase tracking-wider">
                          {food.servingType} • {food.servingType === "countable" ? `1 ${food.defaultUnit || 'piece'}` : "100g"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-orange-500">
                          {cal ?? 0} kcal
                        </span>
                        <span className="text-slate-300 group-hover:text-slate-600 transition-colors">➔</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Scanning step */}
        {step === "scanning" && (
          <div className="flex flex-col items-center py-12">
            {imagePreview && (
              <div className="w-32 h-32 rounded-[24px] overflow-hidden mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-1 bg-white relative group">
                <Image src={imagePreview} fill className="object-cover rounded-[18px]" alt="food preview" unoptimized sizes="128px" />
                <div className="absolute inset-1 rounded-[18px] bg-gradient-to-b from-orange-500/10 to-transparent pointer-events-none animate-scan-pulse" />
              </div>
            )}
            <div className="mb-5">
              <OrangeSpinner size="md" />
            </div>
            <p className="text-slate-800 font-bold text-lg">Analyzing food...</p>
            <p className="text-[13px] font-medium text-slate-500 mt-1.5">AI is identifying nutrients & macros</p>
          </div>
        )}

        {/* Error step */}
        {step === "error" && (
          <div className="flex flex-col items-center py-10 text-center">
            {imagePreview && (
              <div className="w-32 h-32 rounded-[24px] overflow-hidden mb-6 opacity-50 border border-slate-100 p-1 bg-white relative">
                <Image src={imagePreview} fill className="object-cover rounded-[18px]" alt="food preview" unoptimized sizes="128px" />
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
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Food representation */}
            <div className="flex items-center gap-4 p-4 rounded-[24px] bg-slate-50 border border-slate-100">
              <div className="w-16 h-16 rounded-[18px] overflow-hidden shrink-0 bg-white shadow-sm border border-slate-50 p-0.5">
                {imagePreview ? (
                  <div className="relative w-full h-full">
                    <Image src={imagePreview} fill className="object-cover rounded-[14px]" alt={scanResult.foodName} unoptimized sizes="64px" />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl bg-orange-50 text-orange-500 rounded-[14px]">🍽️</div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-slate-900 font-medium text-lg leading-tight">{scanResult.foodName}</p>
                  {scanResult.category && (
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      {scanResult.category}
                    </span>
                  )}
                </div>
                {scanResult.imageUrl ? (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className={`w-2 h-2 rounded-full ${scanResult.confidence === "high" ? "bg-emerald-400" : scanResult.confidence === "medium" ? "bg-amber-400" : "bg-red-400"}`} />
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{scanResult.confidence} confidence</span>
                  </div>
                ) : (
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1.5 inline-block">Database Verified</span>
                )}
              </div>
            </div>

            {/* Nutrition display */}
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

              {scanResult.type === "countable" && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[15px] text-slate-800 font-bold">Quantity ({scanResult.defaultUnit})</span>
                    <span className="text-[12px] font-medium text-slate-500">Default: {scanResult.defaultQuantity}</span>
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

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[15px] text-slate-800 font-bold">Grams</span>
                  <span className="text-[12px] font-medium text-slate-500">Default: {scanResult.defaultGrams}g</span>
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

            {/* Submit / Retry Actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleAddFood}
                className="w-full h-14 rounded-[20px] font-medium text-[15px] flex items-center justify-center transition-all bg-[#f97316] text-white shadow-[0_8px_20px_rgba(249,115,22,0.25)] hover:-translate-y-0.5 hover:shadow-[0_12px_25px_rgba(249,115,22,0.3)] active:scale-[0.98]">
                Add {scanResult.foodName} • {calculatedNutrition.calories} kcal
              </button>

              <button
                onClick={handleRetry}
                className="w-full h-12 rounded-[20px] font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                Back to Search/Upload
              </button>
            </div>
          </div>
        )}

        {/* Adding step */}
        {step === "adding" && (
          <div className="flex flex-col items-center py-12">
            <OrangeSpinner size="md" />
            <p className="text-slate-800 font-bold text-lg mt-5">Logging meal...</p>
            <p className="text-[13px] font-medium text-slate-500 mt-1.5">Updating your daily macros</p>
          </div>
        )}
      </div>
    </div>
  );
}
