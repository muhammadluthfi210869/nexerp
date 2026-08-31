"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DashboardMetricProps {
  label: string;
  value: string | number;
  subValue?: string;
  /** Legacy progress bar (0-100). Rendered as compact bar under value. */
  progressPct?: number;
  progressColor?: string;
  colorClass?: string;
  className?: string;
}

/**
 * Canonical-aligned DashboardMetric. Used inside DashboardCard.
 * Visual: small label, large value, optional progress bar.
 */
export function DashboardMetric({
  label,
  value,
  subValue,
  progressPct,
  progressColor,
  colorClass,
  className,
}: DashboardMetricProps) {
  const barColor = progressColor && progressColor.startsWith("bg-")
    ? progressColor
    : progressColor
    ? `bg-[${progressColor}]`
    : "bg-blue-600";

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
        {label}
      </p>
      <p
        className={cn(
          "text-[24px] font-semibold leading-[28px] tracking-tight tabular-nums",
          colorClass || "text-slate-900",
        )}
      >
        {value}
      </p>
      {progressPct !== undefined && (
        <div className="flex flex-col gap-1">
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", barColor)}
              style={{ width: `${Math.min(progressPct, 100)}%` }}
            />
          </div>
          {subValue && (
            <span className="text-[10px] text-slate-500 tabular-nums">
              {progressPct}% · {subValue}
            </span>
          )}
        </div>
      )}
      {subValue && progressPct === undefined && (
        <p className="text-[11px] text-slate-500">{subValue}</p>
      )}
    </div>
  );
}

interface DashboardMetricGridProps {
  children: React.ReactNode;
  cols?: 2 | 3 | 4;
  className?: string;
}

export function DashboardMetricGrid({ children, cols = 2, className }: DashboardMetricGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4 pt-3 border-t border-slate-100",
        cols === 2 && "grid-cols-2",
        cols === 3 && "grid-cols-3",
        cols === 4 && "grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
