"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown, Check, RotateCcw, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DateFilterValue {
  mode?: "ALL" | "PRESET" | "MONTH_YEAR" | "CUSTOM_RANGE" | string;
  label?: string;
  startDate?: string;
  endDate?: string;
  month?: number; // 1-12
  year?: number;
  preset?: string;
  period?: string;
}

export interface DnaDateFilterProps {
  value?: DateFilterValue;
  onChange?: (val: DateFilterValue) => void;
  className?: string;
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const PRESETS = [
  { id: "ALL", label: "Semua Tanggal", mode: "ALL" as const },
  { id: "TODAY", label: "Hari Ini", mode: "PRESET" as const },
  { id: "7DAYS", label: "7 Hari Terakhir", mode: "PRESET" as const },
  { id: "THIS_MONTH", label: "Bulan Ini", mode: "PRESET" as const },
  { id: "LAST_MONTH", label: "Bulan Lalu", mode: "PRESET" as const },
  { id: "THIS_YEAR", label: "Tahun 2026", mode: "PRESET" as const },
];

export function DnaDateFilter({
  value = { mode: "PRESET", label: "Bulan Ini (Sep 2026)", month: 9, year: 2026 },
  onChange,
  className
}: DnaDateFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"PRESET_MONTH" | "CUSTOM_CALENDAR">("PRESET_MONTH");
  const popoverRef = useRef<HTMLDivElement>(null);

  // Form State inside Popover
  const [selectedMonth, setSelectedMonth] = useState<number>(value.month || 9);
  const [selectedYear, setSelectedYear] = useState<number>(value.year || 2026);
  const [customStart, setCustomStart] = useState<string>(value.startDate || "2026-09-01");
  const [customEnd, setCustomEnd] = useState<string>(value.endDate || "2026-09-30");

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    let result: DateFilterValue;
    if (preset.id === "ALL") {
      result = { mode: "ALL", label: "Semua Tanggal" };
    } else if (preset.id === "TODAY") {
      const today = new Date().toISOString().substring(0, 10);
      result = { mode: "PRESET", label: "Hari Ini", startDate: today, endDate: today };
    } else if (preset.id === "7DAYS") {
      result = { mode: "PRESET", label: "7 Hari Terakhir" };
    } else if (preset.id === "THIS_MONTH") {
      result = { mode: "PRESET", label: "Bulan Ini (Sep 2026)", month: 9, year: 2026, startDate: "2026-09-01", endDate: "2026-09-30" };
    } else if (preset.id === "LAST_MONTH") {
      result = { mode: "PRESET", label: "Bulan Lalu (Agt 2026)", month: 8, year: 2026, startDate: "2026-08-01", endDate: "2026-08-31" };
    } else {
      result = { mode: "PRESET", label: "Tahun 2026", year: 2026, startDate: "2026-01-01", endDate: "2026-12-31" };
    }
    onChange?.(result);
    setIsOpen(false);
  };

  const handleApplyMonthYear = () => {
    const monthName = MONTH_NAMES[selectedMonth - 1];
    const padMonth = String(selectedMonth).padStart(2, "0");
    const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
    const result: DateFilterValue = {
      mode: "MONTH_YEAR",
      label: `${monthName} ${selectedYear}`,
      month: selectedMonth,
      year: selectedYear,
      startDate: `${selectedYear}-${padMonth}-01`,
      endDate: `${selectedYear}-${padMonth}-${lastDay}`,
    };
    onChange?.(result);
    setIsOpen(false);
  };

  const handleApplyCustomCalendar = () => {
    if (!customStart || !customEnd) return;
    const formatDisplay = (dStr: string) => {
      const [y, m, d] = dStr.split("-");
      return `${d}/${m}/${y}`;
    };
    const result: DateFilterValue = {
      mode: "CUSTOM_RANGE",
      label: `${formatDisplay(customStart)} – ${formatDisplay(customEnd)}`,
      startDate: customStart,
      endDate: customEnd,
    };
    onChange?.(result);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative inline-block", className)} ref={popoverRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-9 px-3 bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer select-none",
          isOpen && "ring-2 ring-blue-500/20 border-blue-500",
          value.mode !== "ALL" && "border-blue-300 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300"
        )}
      >
        <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
        <span className="truncate max-w-[160px]">{value.label}</span>
        <ChevronDown className={cn("w-3 h-3 text-slate-400 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {/* Hybrid Popover Content */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-1.5 w-[330px] bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-3.5 text-slate-900 dark:text-slate-100 animate-in fade-in-50 zoom-in-95">
          {/* Dual Mode Switch Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-lg text-[11px] font-bold mb-3 border border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setActiveSubTab("PRESET_MONTH")}
              className={cn(
                "flex-1 py-1.5 rounded-md text-center transition-all cursor-pointer",
                activeSubTab === "PRESET_MONTH"
                  ? "bg-white dark:bg-[#1a2336] text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              )}
            >
              Preset & Bulan
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab("CUSTOM_CALENDAR")}
              className={cn(
                "flex-1 py-1.5 rounded-md text-center transition-all cursor-pointer flex items-center justify-center gap-1",
                activeSubTab === "CUSTOM_CALENDAR"
                  ? "bg-white dark:bg-[#1a2336] text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              )}
            >
              <span>Kalender Tanggal</span>
              <span className="px-1 py-0.2 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded text-[9px] font-bold">
                Finance
              </span>
            </button>
          </div>

          {/* TAB 1: PRESET & BULAN (SCM, GUDANG, OPERASIONAL) */}
          {activeSubTab === "PRESET_MONTH" && (
            <div className="space-y-3">
              {/* Quick Preset Buttons */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Pilihan Cepat
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {PRESETS.map((p) => {
                    const isSelected = (value.label || "").includes(p.label) || (p.id === "ALL" && value.mode === "ALL");
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleApplyPreset(p)}
                        className={cn(
                          "px-2.5 py-1.5 rounded-lg text-left text-xs font-medium border transition-all cursor-pointer flex items-center justify-between",
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-600 dark:text-blue-400 font-bold"
                            : "bg-slate-50 dark:bg-[#0c1322] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                        )}
                      >
                        <span className="truncate">{p.label}</span>
                        {isSelected && <Check className="w-3 h-3 text-blue-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Month & Year Selection */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Pilih Bulan & Tahun
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="w-full h-8 px-2 bg-slate-50 dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {MONTH_NAMES.map((m, idx) => (
                      <option key={m} value={idx + 1}>
                        {m}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full h-8 px-2 bg-slate-50 dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleApplyMonthYear}
                  className="w-full mt-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Terapkan Bulan & Tahun
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: KALENDER RENTANG TANGGAL (FINANCE & AUDIT CUT-OFF) */}
          {activeSubTab === "CUSTOM_CALENDAR" && (
            <div className="space-y-3">
              <div className="p-2 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-[11px] text-blue-700 dark:text-blue-300">
                Rentang kalender presisi untuk audit pembukuan, mutasi kas/bank, dan rekonsiliasi harian.
              </div>

              <div className="space-y-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Dari Tanggal (Mulai)
                  </label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full h-8 px-2.5 bg-slate-50 dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Sampai Tanggal (Selesai)
                  </label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full h-8 px-2.5 bg-slate-50 dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCustomStart("2026-09-01");
                    setCustomEnd("2026-09-30");
                  }}
                  className="px-2.5 py-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleApplyCustomCalendar}
                  className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Terapkan Rentang Tanggal
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
