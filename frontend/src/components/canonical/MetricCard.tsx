/**
 * NEX ERP Canonical MetricCard — visual authority for the unified design system.
 *
 * Required visual structure (Batch 1 visual gate):
 *   - label / value / helper
 *   - consistent icon badge top-right
 *   - subtle 1px neutral border (#E2E8F0)
 *   - 12px radius
 *   - fixed height, no decorative shadows
 *   - semantic tint only when the metric has semantic meaning
 *
 * Variants:
 *   neutral — default, white surface
 *   info    — subtle blue tint on icon badge + value emphasis
 *   success — subtle green tint
 *   warning — subtle amber tint
 *   danger  — subtle red tint
 */
import * as React from "react";
import { cn } from "@/lib/utils";

export type MetricCardVariant = "neutral" | "info" | "success" | "warning" | "danger";

const VARIANT_TONE: Record<MetricCardVariant, {
  surface: string;       // wrapper bg (very subtle tint for semantic variants)
  border: string;        // wrapper border (kept neutral — no strong colored outline)
  iconBg: string;        // icon badge bg
  iconFg: string;        // icon badge fg
  value: string;         // value emphasis
  helper: string;        // helper fg
}> = {
  neutral: {
    surface: "bg-white",
    border: "border-[#E2E8F0]",
    iconBg: "bg-slate-50",
    iconFg: "text-slate-500",
    value: "text-slate-900",
    helper: "text-slate-500",
  },
  info: {
    surface: "bg-blue-50/40",
    border: "border-[#E2E8F0]",
    iconBg: "bg-blue-50",
    iconFg: "text-blue-600",
    value: "text-slate-900",
    helper: "text-slate-500",
  },
  success: {
    surface: "bg-emerald-50/40",
    border: "border-[#E2E8F0]",
    iconBg: "bg-emerald-50",
    iconFg: "text-emerald-600",
    value: "text-slate-900",
    helper: "text-slate-500",
  },
  warning: {
    surface: "bg-amber-50/40",
    border: "border-[#E2E8F0]",
    iconBg: "bg-amber-50",
    iconFg: "text-amber-600",
    value: "text-slate-900",
    helper: "text-slate-500",
  },
  danger: {
    surface: "bg-rose-50/40",
    border: "border-[#E2E8F0]",
    iconBg: "bg-rose-50",
    iconFg: "text-rose-600",
    value: "text-rose-600",
    helper: "text-slate-500",
  },
};

export interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  helper?: React.ReactNode;
  icon?: React.ReactNode;
  variant?: MetricCardVariant;
  className?: string;
}

function normalizeIcon(icon: React.ReactNode): React.ReactNode {
  if (!React.isValidElement(icon)) return null;
  // Force a consistent 18×18 icon size on the badge.
  return React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
    className: "h-[18px] w-[18px]",
  });
}

export function MetricCard({
  label,
  value,
  helper,
  icon,
  variant = "neutral",
  className,
}: MetricCardProps) {
  const tone = VARIANT_TONE[variant];
  const iconEl = normalizeIcon(icon);

  return (
    <div
      role="group"
      aria-label={`${label} metric`}
      data-metric-card
      data-variant={variant}
      className={cn(
        "erp-metric-card flex flex-col justify-between rounded-[12px] border",
        "px-5 py-4 min-h-[104px]",
        tone.surface,
        tone.border,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium text-slate-500 leading-4 uppercase tracking-wide">
          {label}
        </p>
        {iconEl ? (
          <span
            aria-hidden="true"
            className={cn(
              "h-9 w-9 shrink-0 rounded-lg flex items-center justify-center",
              tone.iconBg,
              tone.iconFg,
            )}
          >
            {iconEl}
          </span>
        ) : null}
      </div>

      <div className="mt-1.5">
        <p
          className={cn(
            "text-[24px] font-semibold leading-[28px] tracking-tight tabular-nums",
            tone.value,
          )}
        >
          {value ?? "—"}
        </p>
        {helper ? (
          <p className={cn("mt-1 text-[11px] leading-4", tone.helper)}>
            {helper}
          </p>
        ) : null}
      </div>
    </div>
  );
}
