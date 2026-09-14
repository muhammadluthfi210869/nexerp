"use client";

import React, { useState, useEffect } from "react";
import { Search, X, Filter, ChevronDown, Check, Calendar, ArrowUp, ArrowDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type DnaDateMode = "ALL" | "1_DAY" | "1_WEEK" | "1_MONTH" | "1_YEAR" | "CUSTOM";

export interface DnaFilterColumnConfig {
  key: string;
  label: string;
  type?: "select" | "sort_alpha" | "sort_numeric";
  options?: string[];
}

export interface DnaTableToolbarProps {
  // Search
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;

  // 2-Level Column & Value Filter
  filterColumns?: DnaFilterColumnConfig[];
  selectedColumn?: string;
  onSelectColumn?: (colKey: string) => void;
  filterValue?: string;
  onFilterValueChange?: (val: string) => void;

  // Date Filter
  enableDateFilter?: boolean;
  dateMode?: DnaDateMode;
  onDateModeChange?: (mode: DnaDateMode) => void;
  startDate?: string;
  onStartDateChange?: (val: string) => void;
  endDate?: string;
  onEndDateChange?: (val: string) => void;
  onApplyCustomRange?: () => void;

  // Primary Action Button
  actionButton?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };

  // Additional custom actions
  extraActions?: React.ReactNode;
  className?: string;
}

export function DnaTableToolbar({
  searchQuery = "",
  onSearchChange,
  searchPlaceholder = "Cari data...",

  filterColumns,
  selectedColumn,
  onSelectColumn,
  filterValue = "ALL",
  onFilterValueChange,

  enableDateFilter = false,
  dateMode = "1_MONTH",
  onDateModeChange,
  startDate = "",
  onStartDateChange,
  endDate = "",
  onEndDateChange,
  onApplyCustomRange,

  actionButton,
  extraActions,
  className,
}: DnaTableToolbarProps) {
  const [isColumnOpen, setIsColumnOpen] = useState(false);
  const [isValueOpen, setIsValueOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-dna-filter-pill]")) {
        setIsColumnOpen(false);
        setIsValueOpen(false);
      }
      if (!target.closest("[data-dna-date-picker]")) {
        setIsDatePickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const activeColConfig = filterColumns?.find((c) => c.key === selectedColumn) || filterColumns?.[0];

  const getColLabel = () => activeColConfig?.label || "Kolom";

  const getValueLabel = () => {
    if (!filterValue || filterValue === "ALL") return `Semua ${getColLabel()}`;
    if (filterValue === "ASC") return "Urutan A → Z (Asc)";
    if (filterValue === "DESC") return "Urutan Z → A (Desc)";
    if (filterValue === "NUM_DESC") return "Tertinggi ke Terendah";
    if (filterValue === "NUM_ASC") return "Terendah ke Tertinggi";
    return filterValue;
  };

  const getDateButtonLabel = () => {
    switch (dateMode) {
      case "1_DAY":
        return "1 Hari Lalu";
      case "1_WEEK":
        return "1 Minggu Lalu";
      case "1_MONTH":
        return "1 Bulan Lalu";
      case "1_YEAR":
        return "1 Tahun Lalu";
      case "CUSTOM":
        return startDate && endDate ? `${startDate} – ${endDate}` : "Rentang Kustom";
      default:
        return "Semua Waktu";
    }
  };

  return (
    <div className={cn("p-4 border-b border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3", className)}>
      <div className="flex flex-1 flex-wrap items-center gap-2.5">
        {/* 1. SEARCH BAR - Compact & Breathable */}
        {onSearchChange && (
          <div className="relative w-56 sm:w-64 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-7 h-9 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full border-none bg-transparent cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* 2. TWO-LEVEL FILTER PILL */}
        {filterColumns && filterColumns.length > 0 && onSelectColumn && onFilterValueChange && (
          <div
            className="bg-white border border-slate-200/90 rounded-xl px-2.5 h-9 flex items-center gap-1.5 shadow-2xs relative select-none"
            data-dna-filter-pill
          >
            {/* Left Pill: Column Picker */}
            <button
              type="button"
              onClick={() => {
                setIsColumnOpen(!isColumnOpen);
                setIsValueOpen(false);
                setIsDatePickerOpen(false);
              }}
              className="flex items-center gap-1.5 text-[12px] font-medium text-slate-700 hover:text-blue-600 border-none bg-transparent cursor-pointer p-0.5"
            >
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>{getColLabel()}</span>
              <ChevronDown
                className={cn(
                  "w-3 h-3 text-slate-400 transition-transform",
                  isColumnOpen && "rotate-180 text-blue-600"
                )}
              />
            </button>

            {/* Dot Separator */}
            <span className="text-slate-300 font-bold select-none text-[10px]">•</span>

            {/* Right Pill: Value / Sorting Picker */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setIsValueOpen(!isValueOpen);
                  setIsColumnOpen(false);
                  setIsDatePickerOpen(false);
                }}
                className="flex items-center gap-1.5 text-[12px] font-medium text-slate-700 hover:text-blue-600 border-none bg-transparent cursor-pointer p-0.5"
              >
                <span className="truncate max-w-[130px] font-semibold text-slate-800">
                  {getValueLabel()}
                </span>
                <ChevronDown
                  className={cn(
                    "w-3 h-3 text-slate-400 transition-transform",
                    isValueOpen && "rotate-180 text-blue-600"
                  )}
                />
              </button>

              {filterValue !== "ALL" && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFilterValueChange("ALL");
                  }}
                  className="p-0.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-rose-600 border-none bg-transparent cursor-pointer transition-colors"
                  title="Reset filter ini"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Menu Popover 1: Column Choice */}
            {isColumnOpen && (
              <div className="absolute left-0 top-10 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1.5 text-[12px] animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Pilih Kolom Filter / Urutan
                </div>
                {filterColumns.map((col) => (
                  <button
                    key={col.key}
                    onClick={() => {
                      onSelectColumn(col.key);
                      onFilterValueChange("ALL");
                      setIsColumnOpen(false);
                      setIsValueOpen(true);
                    }}
                    className={cn(
                      "w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-slate-50 cursor-pointer border-none bg-transparent text-[12px]",
                      selectedColumn === col.key ? "font-bold text-blue-600 bg-blue-50/50" : "text-slate-700"
                    )}
                  >
                    <span>{col.label}</span>
                    {selectedColumn === col.key && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                ))}
              </div>
            )}

            {/* Menu Popover 2: Value / Order Choice */}
            {isValueOpen && activeColConfig && (
              <div className="absolute right-0 top-10 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1.5 text-[12px] animate-in fade-in zoom-in-95 duration-150 max-h-64 overflow-y-auto">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Pilihan {activeColConfig.label}
                </div>

                <button
                  onClick={() => {
                    onFilterValueChange("ALL");
                    setIsValueOpen(false);
                  }}
                  className={cn(
                    "w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-slate-50 cursor-pointer border-none bg-transparent text-[12px]",
                    filterValue === "ALL" ? "font-bold text-blue-600 bg-blue-50/50" : "text-slate-700"
                  )}
                >
                  <span>Semua (Reset)</span>
                  {filterValue === "ALL" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>

                {activeColConfig.type === "sort_alpha" && (
                  <>
                    <div className="h-px bg-slate-100 my-1" />
                    <button
                      onClick={() => {
                        onFilterValueChange("ASC");
                        setIsValueOpen(false);
                      }}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-50 cursor-pointer border-none bg-transparent text-slate-700 text-[12px]"
                    >
                      <ArrowUp className="w-3.5 h-3.5 text-slate-400" /> Urutkan A → Z (Ascending)
                    </button>
                    <button
                      onClick={() => {
                        onFilterValueChange("DESC");
                        setIsValueOpen(false);
                      }}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-50 cursor-pointer border-none bg-transparent text-slate-700 text-[12px]"
                    >
                      <ArrowDown className="w-3.5 h-3.5 text-slate-400" /> Urutkan Z → A (Descending)
                    </button>
                  </>
                )}

                {activeColConfig.type === "sort_numeric" && (
                  <>
                    <div className="h-px bg-slate-100 my-1" />
                    <button
                      onClick={() => {
                        onFilterValueChange("NUM_DESC");
                        setIsValueOpen(false);
                      }}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-50 cursor-pointer border-none bg-transparent text-slate-700 text-[12px]"
                    >
                      <ArrowDown className="w-3.5 h-3.5 text-slate-400" /> Tertinggi ke Terendah (Max → Min)
                    </button>
                    <button
                      onClick={() => {
                        onFilterValueChange("NUM_ASC");
                        setIsValueOpen(false);
                      }}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-50 cursor-pointer border-none bg-transparent text-slate-700 text-[12px]"
                    >
                      <ArrowUp className="w-3.5 h-3.5 text-slate-400" /> Terendah ke Tertinggi (Min → Max)
                    </button>
                  </>
                )}

                {(!activeColConfig.type || activeColConfig.type === "select") && activeColConfig.options && (
                  <>
                    <div className="h-px bg-slate-100 my-1" />
                    {activeColConfig.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          onFilterValueChange(opt);
                          setIsValueOpen(false);
                        }}
                        className={cn(
                          "w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-slate-50 cursor-pointer border-none bg-transparent text-[12px]",
                          filterValue === opt ? "font-bold text-blue-600 bg-blue-50/50" : "text-slate-700"
                        )}
                      >
                        <span className="truncate">{opt}</span>
                        {filterValue === opt && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* 3. DATE RANGE SELECTOR (Presets in 2 columns + Custom Date-to-Date below) */}
        {enableDateFilter && onDateModeChange && (
          <div className="relative shrink-0" data-dna-date-picker>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setIsDatePickerOpen(!isDatePickerOpen);
                  setIsColumnOpen(false);
                  setIsValueOpen(false);
                }}
                className={cn(
                  "h-9 px-3 border rounded-xl text-[12px] font-medium flex items-center justify-between gap-2 cursor-pointer transition-colors",
                  dateMode !== "ALL"
                    ? "bg-blue-50/50 border-blue-200 text-blue-700 hover:bg-blue-50"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>{getDateButtonLabel()}</span>
                </div>
                <ChevronDown
                  className={cn(
                    "w-3 h-3 transition-transform",
                    isDatePickerOpen ? "rotate-180 text-blue-600" : "text-slate-400"
                  )}
                />
              </button>

              {dateMode !== "ALL" && (
                <button
                  type="button"
                  onClick={() => onDateModeChange("ALL")}
                  className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-rose-600 border-none bg-transparent cursor-pointer transition-colors"
                  title="Reset filter tanggal"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Popover Pilihan Periode (2 Kolom Preset) + Rentang Kustom (Antara Tanggal) */}
            {isDatePickerOpen && (
              <div className="absolute left-0 sm:right-0 sm:left-auto top-10 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-3.5 space-y-3 text-[12px] animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                    Periode & Rentang Tanggal
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsDatePickerOpen(false)}
                    className="p-0.5 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Section 1: 2 Kolom Pilihan Cepat */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Pilihan Cepat
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { key: "1_DAY", label: "1 Hari Lalu" },
                      { key: "1_WEEK", label: "1 Minggu Lalu" },
                      { key: "1_MONTH", label: "1 Bulan Lalu" },
                      { key: "1_YEAR", label: "1 Tahun Lalu" },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => {
                          onDateModeChange(opt.key as DnaDateMode);
                          setIsDatePickerOpen(false);
                        }}
                        className={cn(
                          "px-2.5 py-1.5 rounded-lg text-[11px] font-medium border text-left transition-colors cursor-pointer flex items-center justify-between",
                          dateMode === opt.key
                            ? "bg-blue-50 border-blue-200 text-blue-700 font-semibold"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/80"
                        )}
                      >
                        <span>{opt.label}</span>
                        {dateMode === opt.key && <Check className="w-3 h-3 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-slate-100" />

                {/* Section 2: Antara Tanggal Ini dan Tanggal Ini */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Antara Tanggal (Kustom)
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-medium mb-1">
                        Dari Tanggal:
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => onStartDateChange && onStartDateChange(e.target.value)}
                        className="w-full h-8 px-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-medium mb-1">
                        Sampai Tanggal:
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => onEndDateChange && onEndDateChange(e.target.value)}
                        className="w-full h-8 px-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onDateModeChange("ALL");
                      setIsDatePickerOpen(false);
                    }}
                    className="text-[11px] text-slate-500 hover:text-slate-800 underline border-none bg-transparent cursor-pointer"
                  >
                    Semua Waktu (Reset)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDateModeChange("CUSTOM");
                      if (onApplyCustomRange) onApplyCustomRange();
                      setIsDatePickerOpen(false);
                    }}
                    className="h-8 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold border-none cursor-pointer shadow-2xs"
                  >
                    Terapkan Rentang
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Side: Primary Action & Extra Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {extraActions}
        {actionButton && (
          <button
            type="button"
            onClick={actionButton.onClick}
            className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[12px] font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-all border-none cursor-pointer shrink-0"
          >
            {actionButton.icon || <Plus className="w-4 h-4" />}
            <span>{actionButton.label}</span>
          </button>
        )}
      </div>
    </div>
  );
}
