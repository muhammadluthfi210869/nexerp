"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  /** Legacy: target % bar (0-100). Mapped to helper text. */
  targetPct?: number;
  subValue?: string;
  icon?: React.ReactNode;
  className?: string;
}

/**
 * Canonical-aligned KpiCard. Wraps canonical MetricCard.
 * Preserves legacy `targetPct` prop by mapping it to helper text.
 */
export function KpiCard({ label, value, targetPct, subValue, icon, className }: KpiCardProps) {
  const isUnder = targetPct !== undefined && targetPct < 70;
  const isOnTrack = targetPct !== undefined && targetPct >= 100;
  const variant: "success" | "warning" | "danger" | "neutral" = isUnder
    ? "danger"
    : isOnTrack
    ? "success"
    : targetPct !== undefined
    ? "warning"
    : "neutral";

  const helperParts: string[] = [];
  if (subValue) helperParts.push(subValue);
  if (targetPct !== undefined) helperParts.push(`${targetPct}%`);

  return (
    <div
      role="group"
      aria-label={`${label} metric`}
      data-metric-card
      data-variant={variant}
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
        <p
          className={cn(
            "text-[26px] font-semibold leading-[30px] tracking-tight tabular-nums",
            isUnder ? "text-rose-600" : isOnTrack ? "text-emerald-600" : "text-slate-900",
          )}
        >
          {value ?? "—"}
        </p>
        {helperParts.length > 0 && (
          <p className="mt-1 text-[11px] leading-4 text-slate-500">{helperParts.join(" · ")}</p>
        )}
      </div>
    </div>
  );
}
