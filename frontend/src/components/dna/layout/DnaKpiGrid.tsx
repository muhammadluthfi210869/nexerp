"use client";

import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DnaKpiCardItem {
  key?: string;
  title?: string;
  label?: string;
  value?: string | number;
  deltaText?: string;
  trend?: string;
  subValue?: string;
  isDeltaPositive?: boolean;
  subtext?: string;
  subtitle?: string;
  icon?: any;
  iconBg?: string;
  iconColor?: string;
  variant?: "blue" | "emerald" | "green" | "amber" | "yellow" | "purple" | "critical" | "rose" | "red";
  status?: string;
  badge?: any;
  isSelected?: boolean;
  onClick?: () => void;
}

export function DnaKpiCard({
  title,
  label,
  value,
  deltaText,
  trend,
  subValue,
  isDeltaPositive = true,
  subtext,
  subtitle,
  icon,
  iconBg = "bg-blue-50",
  iconColor = "text-blue-600",
  variant,
  isSelected = false,
  onClick,
}: DnaKpiCardItem) {
  const displayTitle = title || label || "";
  const displayDelta = deltaText || trend || subValue;
  const displaySubtext = subtext || subtitle;

  const variantMap: Record<string, { bg: string; color: string }> = {
    blue: { bg: "bg-blue-50", color: "text-blue-600" },
    emerald: { bg: "bg-emerald-50", color: "text-emerald-600" },
    green: { bg: "bg-emerald-50", color: "text-emerald-600" },
    amber: { bg: "bg-amber-50", color: "text-amber-600" },
    yellow: { bg: "bg-amber-50", color: "text-amber-600" },
    purple: { bg: "bg-purple-50", color: "text-purple-600" },
    critical: { bg: "bg-rose-50", color: "text-rose-600" },
    rose: { bg: "bg-rose-50", color: "text-rose-600" },
    red: { bg: "bg-rose-50", color: "text-rose-600" },
  };

  const finalBg = iconBg || (variant ? variantMap[variant]?.bg : undefined) || "bg-blue-50";
  const finalColor = iconColor || (variant ? variantMap[variant]?.color : undefined) || "text-blue-600";

  // Safely render icon whether it's a JSX element or a component type (forwardRef)
  const renderIcon = () => {
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
  };

  const renderedIcon = renderIcon();

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between h-[116px] transition-all select-none",
        onClick && "cursor-pointer hover:border-slate-300",
        isSelected
          ? "ring-2 ring-blue-500 border-blue-400 bg-blue-50/20"
          : "border-slate-200/80"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10.5px] font-bold text-slate-400 tracking-wider uppercase">
          {displayTitle}
        </span>
        {renderedIcon && (
          <div
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold shadow-2xs",
              finalBg,
              finalColor
            )}
          >
            {renderedIcon}
          </div>
        )}
      </div>

      <div>
        <div className="text-[22px] font-black text-slate-900 tracking-tight leading-none">
          {value ?? ""}
        </div>
        {displayDelta ? (
          <div className="flex items-center gap-1.5 mt-2 text-[11px] font-semibold">
            <span
              className={cn(
                "flex items-center gap-0.5",
                isDeltaPositive ? "text-emerald-600" : "text-rose-600"
              )}
            >
              {isDeltaPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{displayDelta}</span>
            </span>
          </div>
        ) : displaySubtext ? (
          <div className="text-[10.5px] text-slate-400 mt-1.5 truncate font-medium">
            {displaySubtext}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export interface DnaKpiGridProps {
  cards?: DnaKpiCardItem[];
  items?: DnaKpiCardItem[];
  children?: React.ReactNode;
  cols?: number;
  columns?: number;
  className?: string;
}

export function DnaKpiGrid({ cards, items, children, cols, columns, className }: DnaKpiGridProps) {
  const gridCols = cols || columns || 4;
  const gridClass =
    gridCols === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : gridCols === 3
      ? "grid-cols-1 sm:grid-cols-3"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

  if (children) {
    return <div className={cn("grid gap-4", gridClass, className)}>{children}</div>;
  }

  const rawList = cards || items || [];
  const effectiveCards: DnaKpiCardItem[] = rawList.map((item, idx) => ({
    key: item.key || String(idx),
    ...item,
  }));

  return (
    <div className={cn("grid gap-4", gridClass, className)}>
      {effectiveCards.map(({ key, ...cardProps }) => (
        <DnaKpiCard key={key} {...cardProps} />
      ))}
    </div>
  );
}
