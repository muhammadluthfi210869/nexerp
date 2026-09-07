"use client";

import React from "react";
import { Search, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DnaToolbarProps {
  searchValue?: string;
  search?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  actionButton?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  onReset?: () => void;
  isFiltered?: boolean;
  className?: string;
  variant?: "embedded" | "card";
}

/**
 * Canonical Toolbar Filter Bar (Section 07 of Visual DNA)
 * Unified 1-row layout: Search (w-64, h-9) + Filter Selectors + Date Filter + Reset + Primary Action on right.
 * Fully supports Light & Dark Mode.
 */
export function DnaToolbar({
  searchValue,
  search,
  onSearchChange,
  searchPlaceholder = "Cari data...",
  filters,
  actionButton,
  actions,
  children,
  onReset,
  isFiltered,
  className,
  variant = "embedded",
}: DnaToolbarProps) {
  const isCard = variant === "card";
  const activeSearch = searchValue !== undefined ? searchValue : search;
  const activeActions = actionButton !== undefined ? actionButton : actions;

  return (
    <div
      className={cn(
        "flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 w-full",
        isCard && "bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 shadow-2xs",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2.5 flex-1">
        {onSearchChange !== undefined && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={activeSearch ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-white dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 h-9 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        )}

        {filters}
        {children}

        {isFiltered && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-bold text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:underline px-2 py-1 cursor-pointer flex items-center gap-1 border-none bg-transparent transition-colors"
          >
            Reset Filter ✕
          </button>
        )}
      </div>

      {activeActions && <div className="flex items-center gap-2 shrink-0">{activeActions}</div>}
    </div>
  );
}
