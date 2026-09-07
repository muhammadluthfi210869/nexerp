"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type ProgressTone = "emerald" | "blue" | "amber" | "rose" | "auto";

export interface DnaProgressProps {
  value: number;
  tone?: ProgressTone;
  variant?: ProgressTone;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

const TONE_CLASSES: Record<ProgressTone, string> = {
  emerald: "bg-emerald-500",
  blue: "bg-blue-600",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  auto: "",
};

export function DnaProgress({
  value,
  tone,
  variant,
  size = "sm",
  showLabel = true,
  className,
}: DnaProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const resolvedTone: ProgressTone = tone || variant || "auto";

  let fillClass = TONE_CLASSES[resolvedTone];
  if (resolvedTone === "auto") {
    if (clampedValue === 100) fillClass = "bg-emerald-500 dark:shadow-[0_0_8px_rgba(16,185,129,0.5)]";
    else if (clampedValue >= 60) fillClass = "bg-blue-600 dark:bg-blue-500 dark:shadow-[0_0_8px_rgba(59,130,246,0.5)]";
    else if (clampedValue >= 30) fillClass = "bg-amber-500 dark:shadow-[0_0_8px_rgba(245,158,11,0.5)]";
    else fillClass = "bg-rose-500 dark:shadow-[0_0_8px_rgba(244,63,94,0.5)]";
  }

  const heightClass = size === "sm" ? "h-1.5" : "h-2.5";

  return (
    <div className={cn("flex items-center gap-2.5 min-w-[120px]", className)}>
      <div className={cn("flex-1 bg-slate-100 dark:bg-[#0c1322] border border-slate-200/80 dark:border-slate-800 rounded-xs overflow-hidden", heightClass)}>
        <div
          className={cn("h-full transition-all duration-300 rounded-xs", fillClass)}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-[11px] font-mono font-medium text-slate-700 dark:text-slate-300 tabular-nums w-8 text-right shrink-0">
          {clampedValue}%
        </span>
      )}
    </div>
  );
}
