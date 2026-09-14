"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, CheckCircle2, AlertCircle, Info } from "lucide-react";

export interface DnaSubMetric {
  label: string;
  value: string | number;
  delta?: string;
  isPositive?: boolean;
}

export interface DnaMacroPillarCardProps {
  category: string;
  categoryTone?: "blue" | "purple" | "emerald" | "amber" | "rose" | "dark";
  icon?: React.ReactNode;
  title: string;
  value: string | number;
  progress?: {
    percentage: number;
    targetLabel?: string;
  };
  subMetrics?: DnaSubMetric[];
  statusSignal?: {
    text: string;
    type: "healthy" | "warning" | "critical" | "info";
  };
  className?: string;
}

const TONE_STYLES = {
  blue: {
    pill: "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900",
    bar: "bg-blue-600",
    accent: "text-blue-600",
  },
  purple: {
    pill: "bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-900",
    bar: "bg-purple-600",
    accent: "text-purple-600",
  },
  emerald: {
    pill: "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900",
    bar: "bg-emerald-600",
    accent: "text-emerald-600",
  },
  amber: {
    pill: "bg-amber-50 text-amber-800 border-amber-200/60 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900",
    bar: "bg-amber-500",
    accent: "text-amber-600",
  },
  rose: {
    pill: "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-900",
    bar: "bg-rose-600",
    accent: "text-rose-600",
  },
  dark: {
    pill: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700",
    bar: "bg-slate-900 dark:bg-slate-100",
    accent: "text-slate-900 dark:text-slate-100",
  },
};

const SIGNAL_STYLES = {
  healthy: {
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  warning: {
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
    icon: AlertCircle,
  },
  critical: {
    dot: "bg-rose-500",
    text: "text-rose-700 dark:text-rose-400",
    icon: AlertCircle,
  },
  info: {
    dot: "bg-blue-500",
    text: "text-blue-700 dark:text-blue-400",
    icon: Info,
  },
};

/**
 * Standard Macro Pillar Card according to old_erp/ACUAN_DASHBOARD & Aureon Visual DNA.
 * Combines category pill, primary hero metric with progress, and split sub-metrics in footer.
 */
export function DnaMacroPillarCard({
  category,
  categoryTone = "blue",
  icon,
  title,
  value,
  progress,
  subMetrics = [],
  statusSignal,
  className,
}: DnaMacroPillarCardProps) {
  const tone = TONE_STYLES[categoryTone] || TONE_STYLES.blue;

  return (
    <div
      className={cn(
        "rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90",
        className
      )}
    >
      {/* Header Pill & Icon */}
      <div className="flex items-center justify-between mb-4">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider",
            tone.pill
          )}
        >
          {category}
        </span>
        {icon && <div className={cn("text-slate-400", tone.accent)}>{icon}</div>}
      </div>

      {/* Hero Metric */}
      <div className="mb-4">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {title}
        </p>
        <h3 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white tabular-nums">
          {value}
        </h3>

        {/* Optional Progress Bar & Target Context */}
        {progress && (
          <div className="mt-2.5 space-y-1.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className={cn("h-full rounded-full transition-all duration-500", tone.bar)}
                style={{ width: `${Math.min(100, Math.max(0, progress.percentage))}%` }}
              />
            </div>
            {progress.targetLabel && (
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                <span>{progress.targetLabel}</span>
                <span className={tone.accent}>({progress.percentage}%)</span>
              </div>
            )}
          </div>
        )}

        {/* Optional Status Signal */}
        {statusSignal && (
          <div className="mt-2 flex items-center gap-1.5">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                SIGNAL_STYLES[statusSignal.type]?.dot || "bg-slate-400"
              )}
            />
            <span
              className={cn(
                "text-[10.5px] font-bold",
                SIGNAL_STYLES[statusSignal.type]?.text || "text-slate-500"
              )}
            >
              {statusSignal.text}
            </span>
          </div>
        )}
      </div>

      {/* Split Sub-metrics Footer */}
      {subMetrics.length > 0 && (
        <div className="mt-4 flex divide-x divide-slate-100 border-t border-slate-100 pt-3.5 dark:divide-slate-800 dark:border-slate-800">
          {subMetrics.map((metric, idx) => (
            <div
              key={idx}
              className={cn(
                "flex-1",
                idx === 0 ? "pr-3" : idx === subMetrics.length - 1 ? "pl-3" : "px-3"
              )}
            >
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
                {metric.label}
              </p>
              <div className="mt-0.5 flex items-baseline gap-1.5">
                <span className="text-sm font-black text-slate-800 dark:text-slate-100 tabular-nums">
                  {metric.value}
                </span>
                {metric.delta && (
                  <span
                    className={cn(
                      "inline-flex items-center text-[10px] font-bold",
                      metric.isPositive
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    )}
                  >
                    {metric.isPositive ? (
                      <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                    ) : (
                      <TrendingDown className="w-2.5 h-2.5 mr-0.5" />
                    )}
                    {metric.delta}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
