"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DnaPaginationProps {
  currentPage: number;
  totalPages: number;
  totalEntries?: number;
  totalItems?: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export function DnaPagination({
  currentPage,
  totalPages,
  totalEntries,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className,
}: DnaPaginationProps) {
  const entriesCount = totalEntries ?? totalItems ?? 0;
  if (entriesCount === 0) return null;

  const startEntry = Math.min((currentPage - 1) * pageSize + 1, entriesCount);
  const endEntry = Math.min(currentPage * pageSize, entriesCount);

  return (
    <div className={cn("flex items-center justify-between px-3.5 py-2 text-xs text-slate-500", className)}>
      <span>
        Menampilkan <strong className="font-semibold text-slate-700">{startEntry}</strong>–
        <strong className="font-semibold text-slate-700">{endEntry}</strong> dari{" "}
        <strong className="font-semibold text-slate-700">{entriesCount}</strong> data
      </span>

      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-3">
            <span className="text-[11px] text-slate-400">Tampilkan</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-7 px-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 font-medium focus:outline-none focus:border-blue-500"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-slate-400">per halaman</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className={cn(
            "h-8 px-2.5 rounded-lg border flex items-center gap-1 text-[11px] font-medium transition-colors border-none bg-transparent cursor-pointer",
            currentPage <= 1
              ? "text-slate-300 cursor-not-allowed"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          )}
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Sebelumnya
        </button>

        <div className="flex items-center gap-1 px-1">
          {Array.from({ length: Math.min(totalPages, 5) }, (_, idx) => {
            const pageNum = idx + 1;
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                className={cn(
                  "w-7 h-7 rounded-lg text-[11px] font-semibold flex items-center justify-center transition-colors border-none cursor-pointer",
                  currentPage === pageNum
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 bg-transparent"
                )}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className={cn(
            "h-8 px-2.5 rounded-lg border flex items-center gap-1 text-[11px] font-medium transition-colors border-none bg-transparent cursor-pointer",
            currentPage >= totalPages
              ? "text-slate-300 cursor-not-allowed"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          )}
        >
          Selanjutnya <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
