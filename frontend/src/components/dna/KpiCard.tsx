"use client";

import React from "react";

interface KpiCardProps {
  label: string;
  value: string;
  targetPct: number;
  subValue?: string;
  icon?: React.ReactNode;
}

export function KpiCard({ label, value, targetPct, subValue, icon }: KpiCardProps) {
  const isUnder = targetPct < 70;
  const isOnTrack = targetPct >= 100;

  const borderClass = isUnder
    ? "border-rose-300"
    : isOnTrack
    ? "border-emerald-300"
    : "";

  const valueClass = isUnder
    ? "text-rose-600"
    : isOnTrack
    ? "text-emerald-600"
    : "";

  const barColor = isUnder ? "bg-rose-400" : isOnTrack ? "bg-emerald-500" : "bg-slate-900";

  const iconEl = React.isValidElement(icon) ? (
    <div
      className={`p-3.5 rounded-xl shrink-0 ${
        isUnder
          ? "bg-rose-50 text-rose-400"
          : isOnTrack
          ? "bg-emerald-50 text-emerald-400"
          : "bg-slate-50 text-slate-400"
      }`}
    >
      <span className="[&>svg]:w-[16px] [&>svg]:h-[16px]">{icon}</span>
    </div>
  ) : null;

  const bgIcon = React.isValidElement(icon)
    ? React.cloneElement(icon as React.ReactElement<SVGElement>, {
        className: "w-[110px] h-[110px] stroke-[0.75px] text-slate-300/25 transition-all duration-700",
      })
    : null;

  return (
    <div
      className={`bg-white border rounded-[24px] p-7 shadow-sm transition-all group overflow-hidden relative h-[148px] flex items-center animate-fade-slide-in ${borderClass}`}
      style={
        isUnder
          ? { animation: "kpi-pulse-border 2s cubic-bezier(0.22, 1, 0.36, 1) infinite" }
          : undefined
      }
    >
      <div className="flex justify-between items-center relative z-10 w-full">
        <div className="space-y-1.5 flex-1 min-w-0 pr-4">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">{label}</p>
          <h3 className={`text-[32px] font-black tracking-[-0.02em] tabular leading-tight ${valueClass}`}>
            {value}
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${barColor} rounded-full`}
                style={{ width: `${Math.min(targetPct, 100)}%` }}
              />
            </div>
            <span className={`text-[9px] font-black tabular ${valueClass}`}>{targetPct}%</span>
          </div>
        </div>
        {iconEl}
      </div>
      {bgIcon && (
        <div className="absolute -bottom-5 -right-5 pointer-events-none select-none z-0">
          {bgIcon}
        </div>
      )}
    </div>
  );
}
