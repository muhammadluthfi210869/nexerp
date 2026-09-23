"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface KpiCardProps {
  label?: string;
  title?: string;
  value: string | number;
  targetPct?: number;
  subValue?: string;
  subtext?: string;
  trend?: any;
  variant?: string;
  color?: string;
  active?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode | React.ComponentType<{ className?: string }>;
  className?: string;
}

export function KpiCard({
  label,
  title,
  value,
  targetPct,
  subValue,
  subtext,
  icon,
  variant,
  color,
  active,
  className,
  onClick,
}: KpiCardProps) {
  const displayLabel = label || title || "";
  const displaySub = subValue || subtext || "";

  const variantStyles: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    green: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
    red: "bg-rose-50 text-rose-600",
    amber: "bg-amber-50 text-amber-600",
    yellow: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
    slate: "bg-slate-100 text-slate-600",
  };

  const finalIconStyle = (variant && variantStyles[variant]) || (color && variantStyles[color]) || "bg-blue-50 text-blue-600";

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    if (typeof icon === "function") {
      return React.createElement(icon as React.ComponentType<{ className?: string }>, { className: "w-3.5 h-3.5" });
    }
    return null;
  };

  const renderedIcon = renderIcon();

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white dark:bg-[#0c1322] border border-slate-200/80 rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between min-h-[116px] select-none",
        onClick && "cursor-pointer hover:border-slate-300",
        active && "ring-2 ring-blue-500 border-blue-400 bg-blue-50/10",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10.5px] font-bold text-slate-400 tracking-wider uppercase">
          {displayLabel}
        </span>
        {renderedIcon && (
          <div
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold shadow-2xs shrink-0",
              finalIconStyle
            )}
          >
            {renderedIcon}
          </div>
        )}
      </div>

      <div>
        <div className="text-[22px] font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none tabular-nums">
          {value}
        </div>
        <div className="min-h-[18px] mt-2 flex items-center">
          {displaySub ? (
            <p className="text-[10.5px] font-medium text-slate-400 truncate">
              {displaySub}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

