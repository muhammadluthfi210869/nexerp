"use client";
import React from "react";

import { cn } from "@/lib/utils";

/**
 * KpiCard — Operational DNA Card
 *
 * @scope OPERATIONAL PAGES ONLY
 * @see /VISUAL_DNA.md (Operational DNA contract)
 * @see /frontend/src/app/(dashboard)/dna-visual/golden-reference/page.tsx (implementation)
 * @see /plan/NEX_ERP_REFACTOR_ROADMAP.md Section 0.2 (Two-DNA-System)
 *
 * @deprecated — use `DnaStatCard` from `@/components/dna/DnaStatCard.tsx` instead.
 *   DnaStatCard provides the canonical 3-layer layout (label+icon top, value middle,
 *   subtext bottom) with 14 semantic variants (neutral/blue/emerald/rose/amber/sky/slate/
 *   and aliases) and a fixed `h-[104px]` for grid alignment. Migrate existing KpiCard
 *   usage to DnaStatCard and remove this file in Sprint 9.
 *
 * For DASHBOARD PAGES, use `StatCard` instead (different DNA system — Aureon Matrix).
 *
 * @example
 * ```tsx
 * <KpiCard
 *   label="Sample Approved"
 *   value={1}
 *   targetPct={94}
 *   icon={<CheckCircle2 />}
 * />
 * ```
 */
export interface KpiCardProps {
  /** Card label (small uppercase text above value). Alias: `title` */
  label?: string;
  /** Alias for `label` — kept for backwards compat */
  title?: string;
  /** Main KPI value (number or formatted string) */
  value: string | number;
  /** Target percentage (0-100). Shows progress bar + color codes the card. */
  targetPct?: number;
  /** Optional supporting text below value. Alias: `subtext` */
  subValue?: string;
  /** Alias for `subValue` — kept for backwards compat */
  subtext?: string;
  /** Reserved for future use */
  trend?: any;
  /** Reserved for future use */
  variant?: string;
  /** Reserved for future use */
  color?: string;
  /** Reserved for future use */
  active?: boolean;
  /** Optional click handler — makes card interactive */
  onClick?: () => void;
  /** Optional icon (Lucide React component or element) */
  icon?: React.ReactNode | React.ComponentType<{ className?: string }>;
  /** Additional CSS classes to merge */
  className?: string;
}

/**
 * Color coding logic (per VISUAL_DNA.md):
 * - targetPct < 70  → rose (underperform)
 * - targetPct >= 100 → emerald (on track)
 * - 70 <= targetPct < 100 → slate (stable)
 */
export function KpiCard({
  label,
  title,
  value,
  targetPct,
  subValue,
  subtext,
  icon,
  className,
  onClick,
}: KpiCardProps) {
  const displayLabel = label || title || "";
  const displaySub = subValue || subtext || "";
  const pct = targetPct ?? 100;
  const isUnder = pct < 70;
  const isOnTrack = pct >= 100;

  const borderClass = isUnder
    ? "border-rose-300 dark:border-rose-800"
    : isOnTrack
    ? "border-emerald-300 dark:border-emerald-800"
    : "border-slate-200/80 dark:border-slate-800";

  const valueClass = isUnder
    ? "text-rose-600 dark:text-rose-400"
    : isOnTrack
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-slate-900 dark:text-slate-100";

  const barColor = isUnder ? "bg-rose-400" : isOnTrack ? "bg-emerald-500" : "bg-blue-600";

  const iconEl = React.isValidElement(icon) ? (
    <div
      className={cn(
        "p-3 rounded-xl shrink-0",
        isUnder
          ? "bg-rose-50 text-rose-500 dark:bg-rose-950/50"
          : isOnTrack
          ? "bg-emerald-50 text-emerald-500 dark:bg-emerald-950/50"
          : "bg-slate-50 text-slate-500 dark:bg-slate-800"
      )}
    >
      <span className="[&>svg]:w-4 [&>svg]:h-4">{icon}</span>
    </div>
  ) : typeof icon === "function" ? (
    <div
      className={cn(
        "p-3 rounded-xl shrink-0",
        isUnder
          ? "bg-rose-50 text-rose-500 dark:bg-rose-950/50"
          : isOnTrack
          ? "bg-emerald-50 text-emerald-500 dark:bg-emerald-950/50"
          : "bg-slate-50 text-slate-500 dark:bg-slate-800"
      )}
    >
      {React.createElement(icon as React.ComponentType<{ className?: string }>, { className: "w-4 h-4" })}
    </div>
  ) : null;

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white dark:bg-[#0c1322] border rounded-xl p-5 shadow-2xs transition-all group overflow-hidden relative min-h-[120px] flex items-center justify-between",
        borderClass,
        onClick && "cursor-pointer hover:shadow-sm",
        className
      )}
    >
      <div className="flex justify-between items-center relative z-10 w-full">
        <div className="space-y-1.5 flex-1 min-w-0 pr-4">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{displayLabel}</p>
          <h3 className={cn("text-2xl font-bold tracking-tight tabular-nums leading-tight", valueClass)}>
            {value}
          </h3>
          {targetPct !== undefined ? (
            <div className="flex items-center gap-2 pt-0.5">
              <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full", barColor)}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <span className={cn("text-[10px] font-semibold tabular-nums", valueClass)}>{pct}%</span>
            </div>
          ) : displaySub ? (
            <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400">{displaySub}</p>
          ) : null}
        </div>
        {iconEl}
      </div>
    </div>
  );
}
