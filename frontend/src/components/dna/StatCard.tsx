"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number | React.ReactNode;
  subValue?: string | React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

/**
 * Canonical-aligned StatCard. Uses canonical MetricCard layout:
 * - 12px radius
 * - subtle 1px neutral border
 * - fixed min-height
 * - semantic tints only when appropriate
 */
export function StatCard({ label, value, subValue, icon, className }: StatCardProps) {
  const helper = subValue !== undefined && subValue !== null && subValue !== false
    ? (typeof subValue === "string" || typeof subValue === "number" ? subValue : null)
    : null;

  return (
    <div
      role="group"
      aria-label={`${label} metric`}
      data-metric-card
      data-variant="neutral"
      className={cn(
        "erp-metric-card flex flex-col justify-between rounded-[12px] border border-[#E2E8F0] bg-white",
        "px-5 py-4 min-h-[116px] min-w-0 w-full",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium text-slate-500 leading-4 uppercase tracking-wide">
          {label}
        </p>
        {icon && (
          <span
            aria-hidden="true"
            className="h-9 w-9 shrink-0 rounded-lg flex items-center justify-center bg-slate-50 text-slate-500"
          >
            {icon}
          </span>
        )}
      </div>
      <div className="mt-2">
        <p className="text-[26px] font-semibold leading-[30px] tracking-tight tabular-nums text-slate-900">
          {value ?? "—"}
        </p>
        {helper && (
          <p className="mt-1 text-[11px] leading-4 text-slate-500">{helper}</p>
        )}
      </div>
    </div>
  );
}
