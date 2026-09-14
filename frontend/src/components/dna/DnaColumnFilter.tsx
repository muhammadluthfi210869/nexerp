"use client";

import React from "react";
import { Filter, ArrowUpDown, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type ColumnFilterType = "category" | "sort";

export interface ColumnOption {
  id: string;
  label: string;
  type: ColumnFilterType;
  categoryOptions?: { label: string; value: string }[];
  sortLabels?: {
    asc: string;
    desc: string;
  };
}

export interface DnaColumnFilterProps {
  columns: ColumnOption[];
  selectedColumnId: string;
  onColumnChange: (columnId: string) => void;
  filterValue: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function DnaColumnFilter({
  columns,
  selectedColumnId,
  onColumnChange,
  filterValue,
  onValueChange,
  className,
}: DnaColumnFilterProps) {
  // Always resolve to an active column (fallback to first column if not found)
  const activeColId = selectedColumnId && selectedColumnId !== "ALL"
    ? selectedColumnId
    : (columns[0]?.id || "");
  const currentColumn = columns.find((c) => c.id === activeColId) || columns[0];

  const handleColumnSelect = (colId: string) => {
    onColumnChange(colId);
    const col = columns.find((c) => c.id === colId);
    if (!col) {
      onValueChange("ALL");
      return;
    }
    if (col.type === "category") {
      onValueChange("ALL");
    } else {
      onValueChange("asc");
    }
  };

  return (
    <div className={cn("inline-flex items-center shadow-2xs rounded-lg", className)}>
      {/* BAGIAN KIRI: PILIH KOLOM */}
      <div className="relative inline-flex items-center">
        <Filter className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
        <select
          value={activeColId}
          onChange={(e) => handleColumnSelect(e.target.value)}
          className="h-9 pl-8 pr-7 text-xs font-bold bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 rounded-l-lg border-r-0 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 min-w-[130px]"
          title="Pilih Kolom"
        >
          {columns.map((col) => (
            <option key={col.id} value={col.id}>
              {col.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3 h-3 absolute right-2 text-slate-400 pointer-events-none" />
      </div>

      {/* BAGIAN KANAN: PILIH NILAI KATEGORI ATAU SORTING ATAS/BAWAH (SELALU AKTIF) */}
      <div className="relative inline-flex items-center">
        {currentColumn?.type === "sort" ? (
          <ArrowUpDown className="w-3.5 h-3.5 absolute left-2.5 text-blue-500 dark:text-blue-400 pointer-events-none" />
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 absolute left-2.5 pointer-events-none" />
        )}
        <select
          value={filterValue || (currentColumn?.type === "category" ? "ALL" : "asc")}
          onChange={(e) => onValueChange(e.target.value)}
          className={cn(
            "h-9 pl-6 pr-7 text-xs font-semibold bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 rounded-r-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none transition-colors min-w-[170px]",
            filterValue && filterValue !== "ALL" && "text-blue-600 dark:text-blue-400 font-bold"
          )}
          title="Pilihan Filter atau Urutan"
        >
          {currentColumn?.type === "category" ? (
            <>
              <option value="ALL">Semua {currentColumn.label}</option>
              {currentColumn.categoryOptions?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </>
          ) : (
            <>
              <option value="asc">
                {currentColumn?.sortLabels?.asc || "Urutkan dari Atas (A → Z / Terkecil)"}
              </option>
              <option value="desc">
                {currentColumn?.sortLabels?.desc || "Urutkan dari Bawah (Z → A / Terbesar)"}
              </option>
            </>
          )}
        </select>
        <ChevronDown className="w-3 h-3 absolute right-2 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}
