import React from "react";
import { cn } from "@/lib/utils";

interface SectionDividerProps {
  number: number;
  title: string;
  accentColor?: "primary" | "rose" | "slate" | "emerald" | "amber";
}

const colorMap = {
  primary: "bg-primary",
  rose: "bg-rose-500",
  slate: "bg-slate-900",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
};

/**
 * Standardized section divider for labeled content sections.
 * Replaces 4+ different section header patterns across the ERP.
 */
export function SectionDivider({ number, title, accentColor = "primary" }: SectionDividerProps) {
  return (
    <div className="flex items-center gap-3 mb-3" style={{ marginTop: 'var(--section-gap)' }}>
      <div className={cn("w-1 h-5 rounded-full", colorMap[accentColor])} />
      <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
        {number}. {title}
      </h2>
    </div>
  );
}

