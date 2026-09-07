"use client";

import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DnaPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  totalEntries?: number;
  pageSize?: number;
  entriesPerPage?: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  className?: string;
}

/**
 * Canonical Table Pagination Footer (Section 07 of Visual DNA)
 * Unified row count display + page size selector + numeric controls
 */
export function DnaPagination({
  currentPage,
  totalPages,
  totalItems,
  totalEntries,
  pageSize = 10,
  entriesPerPage,
  pageSizeOptions = [10, 25, 50],
  onPageChange,
  onPageSizeChange,
  className,
}: DnaPaginationProps) {
  const actualTotal = totalItems !== undefined ? totalItems : totalEntries;
  const effectivePageSize = entriesPerPage !== undefined ? entriesPerPage : pageSize;
  const from = Math.max(1, (currentPage - 1) * effectivePageSize + 1);
  const to = actualTotal ? Math.min(currentPage * effectivePageSize, actualTotal) : currentPage * effectivePageSize;

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3 text-[12px] text-slate-500 dark:text-slate-400 pt-2", className)}>
      <div>
        {actualTotal !== undefined ? (
          <span>
            Menampilkan <strong className="text-slate-800 dark:text-slate-200">{from}–{to}</strong> dari <strong className="text-slate-800 dark:text-slate-200">{actualTotal}</strong> data
          </span>
        ) : (
          <span>Halaman <strong className="text-slate-800 dark:text-slate-200">{currentPage}</strong> dari <strong className="text-slate-800 dark:text-slate-200">{Math.max(1, totalPages)}</strong></span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {onPageSizeChange && (
          <select
            value={effectivePageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-slate-50 dark:bg-[#0c1322] border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-[12px] text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt} / page
              </option>
            ))}
          </select>
        )}

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(1)}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-40 disabled:hover:bg-transparent border-none bg-transparent cursor-pointer transition-colors"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-40 disabled:hover:bg-transparent border-none bg-transparent cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-semibold text-[12px] flex items-center justify-center shadow-2xs">
            {currentPage}
          </span>

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-40 disabled:hover:bg-transparent border-none bg-transparent cursor-pointer transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(totalPages)}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-40 disabled:hover:bg-transparent border-none bg-transparent cursor-pointer transition-colors"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
