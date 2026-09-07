"use client";

import React from "react";
import { CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DnaBulkActionBarProps {
  selectedCount: number;
  label?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Sticky Bulk Actions Bar (Benchmark Spec Section of Visual DNA)
 * Renders when 1 or more table rows are selected.
 */
export function DnaBulkActionBar({
  selectedCount,
  label = "item terpilih",
  children,
  className,
}: DnaBulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        "bg-slate-900 text-white rounded-xl p-3 px-4 flex items-center justify-between shadow-md text-[12px] animate-in fade-in slide-in-from-top-2 duration-150",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <CheckSquare className="w-4 h-4 text-blue-400 shrink-0" />
        <span className="font-semibold">
          {selectedCount} {label}
        </span>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
