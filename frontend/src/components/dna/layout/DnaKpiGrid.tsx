"use client";

import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DnaKpiCardItem {
  key: string;
  title: string;
  value: string | number;
  deltaText?: string;
  isDeltaPositive?: boolean;
  icon?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export function DnaKpiCard({
  title,
  value,
  deltaText,
  isDeltaPositive = true,
  icon,
  iconBg = "bg-blue-50",
  iconColor = "text-blue-600",
  isSelected = false,
  onClick,
}: DnaKpiCardItem) {
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
          {title}
        </span>
        {icon && (
          <div
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold shadow-2xs",
              iconBg,
              iconColor
            )}
          >
            {icon}
          </div>
        )}
      </div>

      <div>
        <div className="text-[22px] font-black text-slate-900 tracking-tight leading-none">
          {value}
        </div>
        {deltaText && (
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
              <span>{deltaText}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export interface DnaKpiGridProps {
  cards?: DnaKpiCardItem[];
  items?: any[];
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

  const effectiveCards: DnaKpiCardItem[] =
    cards ||
    (items || []).map((item, idx) => ({
      key: item.key || item.id || String(idx),
      title: item.title || item.label || "",
      value: item.value || "",
      deltaText: item.deltaText || item.subtext,
      isDeltaPositive: item.isDeltaPositive ?? true,
      icon: item.icon,
      iconBg: item.iconBg,
      iconColor: item.iconColor,
      onClick: item.onClick,
    }));

  return (
    <div className={cn("grid gap-4", gridClass, className)}>
      {effectiveCards.map(({ key, ...cardProps }) => (
        <DnaKpiCard key={key} {...cardProps} />
      ))}
    </div>
  );
}
