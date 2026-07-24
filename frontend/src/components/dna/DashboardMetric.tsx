import { cn } from "@/lib/utils";
import React from "react";

interface DashboardMetricProps {
  label: string;
  value: string | number;
  subValue?: string;
  progressPct?: number;
  progressColor?: string;
  colorClass?: string;
  className?: string;
}

/**
 * MATCHES: reference `.macro-card` value rows
 * Multi-metric display inside a DashboardCard.
 * Big number (32px/900) + label + optional progress bar.
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
  const barColor = progressColor || "bg-[var(--status-action)]";

  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="text-[9px] font-extrabold text-[var(--gray-400)] uppercase tracking-[0.1em]">
        {label}
      </p>
      <p
        className={cn(
          "text-[32px] font-black tracking-[-0.02em] leading-tight tabular",
          colorClass || "text-[var(--gray-900)]"
        )}
      >
        {value}
      </p>
      {progressPct !== undefined && (
        <div className="space-y-1.5">
          <div className="h-1 bg-[var(--gray-100)] rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-600", barColor)}
              style={{ width: `${Math.min(progressPct, 100)}%` }}
            />
          </div>
          <div className="flex justify-between">
            <span className="text-[9px] font-extrabold text-[var(--gray-400)] uppercase tabular">
              {progressPct}%
            </span>
            {subValue && (
              <span className="text-[9px] font-extrabold text-[var(--gray-400)] uppercase tabular">
                {subValue}
              </span>
            )}
          </div>
        </div>
      )}
      {subValue && progressPct === undefined && (
        <p className="text-[10px] font-extrabold text-[var(--gray-400)] uppercase tracking-[0.05em]">
          {subValue}
        </p>
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
        "grid gap-6 pt-4 border-t border-[var(--gray-50)]",
        cols === 2 && "grid-cols-2",
        cols === 3 && "grid-cols-3",
        cols === 4 && "grid-cols-4",
        className
      )}
    >
      {children}
    </div>
  );
}
