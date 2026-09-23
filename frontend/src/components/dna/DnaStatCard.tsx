"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type DnaStatCardVariant =
  | "neutral"
  | "blue"
  | "emerald"
  | "rose"
  | "amber"
  | "sky"
  | "slate"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "critical"
  | "info"
  | "purple"
  | "indigo"
  | "default";

export interface DnaStatCardProps {
  label?: string;
  title?: string;
  value: string | number | React.ReactNode;
  subtext?: string | React.ReactNode;
  description?: string | React.ReactNode;
  subValue?: string | React.ReactNode;
  delta?: { value: string; isPositive?: boolean } | string;
  icon?: any;
  variant?: DnaStatCardVariant;
  onClick?: () => void;
  isSelected?: boolean;
  className?: string;
}

const VARIANT_STYLES: Record<string, {
  container: string;
  iconBadge: string;
}> = {
  neutral: {
    container: "border-slate-200/80 bg-white",
    iconBadge: "bg-slate-100 text-slate-600",
  },
  default: {
    container: "border-slate-200/80 bg-white",
    iconBadge: "bg-slate-100 text-slate-600",
  },
  blue: {
    container: "border-slate-200/80 bg-white",
    iconBadge: "bg-blue-50 text-blue-600",
  },
  primary: {
    container: "border-slate-200/80 bg-white",
    iconBadge: "bg-blue-50 text-blue-600",
  },
  emerald: {
    container: "border-slate-200/80 bg-white",
    iconBadge: "bg-emerald-50 text-emerald-600",
  },
  success: {
    container: "border-slate-200/80 bg-white",
    iconBadge: "bg-emerald-50 text-emerald-600",
  },
  rose: {
    container: "border-slate-200/80 bg-white",
    iconBadge: "bg-rose-50 text-rose-600",
  },
  danger: {
    container: "border-slate-200/80 bg-white",
    iconBadge: "bg-rose-50 text-rose-600",
  },
  critical: {
    container: "border-slate-200/80 bg-white",
    iconBadge: "bg-rose-50 text-rose-600",
  },
  amber: {
    container: "border-slate-200/80 bg-white",
    iconBadge: "bg-amber-50 text-amber-600",
  },
  warning: {
    container: "border-slate-200/80 bg-white",
    iconBadge: "bg-amber-50 text-amber-600",
  },
  sky: {
    container: "border-slate-200/80 bg-white",
    iconBadge: "bg-sky-50 text-sky-600",
  },
  info: {
    container: "border-slate-200/80 bg-white",
    iconBadge: "bg-sky-50 text-sky-600",
  },
  slate: {
    container: "border-slate-200/80 bg-white",
    iconBadge: "bg-slate-100 text-slate-600",
  },
  secondary: {
    container: "border-slate-200/80 bg-white",
    iconBadge: "bg-slate-100 text-slate-600",
  },
  purple: {
    container: "border-slate-200/80 bg-white",
    iconBadge: "bg-purple-50 text-purple-600",
  },
  indigo: {
    container: "border-slate-200/80 bg-white",
    iconBadge: "bg-indigo-50 text-indigo-600",
  },
};

function renderIcon(icon: any): React.ReactNode {
  if (!icon) return null;
  if (React.isValidElement(icon)) {
    return icon;
  }
  if (
    typeof icon === "function" ||
    (typeof icon === "object" && icon !== null && ("$$typeof" in icon || "render" in icon))
  ) {
    const IconComp = icon as React.ComponentType<{ className?: string }>;
    return <IconComp className="w-3.5 h-3.5" />;
  }
  return null;
}

export function DnaStatCard({
  label,
  title,
  value,
  subtext,
  description,
  subValue,
  delta,
  icon,
  variant,
  onClick,
  isSelected,
  className,
}: DnaStatCardProps) {
  const styles = (variant && VARIANT_STYLES[variant]) || VARIANT_STYLES.neutral;
  const isInteractive = !!onClick;
  const displayLabel = label || title || "";
  const displaySubtext = subtext || description || subValue;

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between min-h-[116px] transition-all select-none",
        isInteractive && "cursor-pointer hover:border-slate-300",
        isSelected && "ring-2 ring-blue-500 border-blue-400 bg-blue-50/10",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10.5px] font-bold text-slate-400 tracking-wider uppercase">
          {displayLabel}
        </span>
        {icon && (
          <div
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold shadow-2xs shrink-0",
              styles.iconBadge
            )}
          >
            {renderIcon(icon)}
          </div>
        )}
      </div>

      <div>
        <div className="text-[22px] font-black text-slate-900 tracking-tight leading-none tabular-nums">
          {value}
        </div>
        <div className="min-h-[18px] mt-2 flex items-center gap-1.5 text-[10.5px] font-medium text-slate-400">
          {delta && (
            <span
              className={cn(
                "flex items-center gap-0.5 font-semibold",
                typeof delta === "object"
                  ? delta.isPositive
                    ? "text-emerald-600"
                    : "text-rose-600"
                  : "text-slate-600"
              )}
            >
              {typeof delta === "object" ? delta.value : delta}
            </span>
          )}
          {displaySubtext && <span className="truncate">{displaySubtext}</span>}
        </div>
      </div>
    </div>
  );
}
