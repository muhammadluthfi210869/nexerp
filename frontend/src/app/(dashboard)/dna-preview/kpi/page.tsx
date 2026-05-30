"use client";

import React from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { SectionLabel, StatCard } from "@/components/dna";
import { Factory, DollarSign, TrendingUp, Activity } from "lucide-react";

function KpiCard({
  label,
  value,
  targetPct,
  subValue,
  icon,
}: {
  label: string;
  value: string;
  targetPct: number;
  subValue?: string;
  icon?: React.ReactNode;
}) {
  const isUnder = targetPct < 70;
  const isOnTrack = targetPct >= 100;
  const borderClass = isUnder
    ? "border-rose-300 !border-rose-300"
    : isOnTrack
    ? "border-emerald-300 !border-emerald-300"
    : "";
  const valueClass = isUnder
    ? "text-rose-600"
    : isOnTrack
    ? "text-emerald-600"
    : "";
  const barColor = isUnder ? "bg-rose-400" : isOnTrack ? "bg-emerald-500" : "bg-slate-900";

  const iconEl = React.isValidElement(icon) ? (
    <div className={`p-3.5 rounded-xl shrink-0 ${isUnder ? "bg-rose-50 text-rose-400" : isOnTrack ? "bg-emerald-50 text-emerald-400" : "bg-slate-50 text-slate-400"}`}>
      <span className="[&>svg]:w-[16px] [&>svg]:h-[16px]">{icon}</span>
    </div>
  ) : null;

  return (
    <div
      className={`bg-white border rounded-[24px] p-7 shadow-sm transition-all group overflow-hidden relative h-[148px] flex items-center ${borderClass}`}
      style={isUnder ? { animation: "kpi-pulse-border 2s cubic-bezier(0.22, 1, 0.36, 1) infinite" } : undefined}
    >
      <div className="flex justify-between items-center relative z-10 w-full">
        <div className="space-y-1.5 flex-1 min-w-0 pr-4">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">{label}</p>
          <h3 className={`text-[32px] font-black tracking-[-0.02em] tabular leading-tight ${valueClass}`}>
            {value}
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full ${barColor} rounded-full`} style={{ width: `${Math.min(targetPct, 100)}%` }} />
            </div>
            <span className={`text-[9px] font-black tabular ${valueClass}`}>{targetPct}%</span>
          </div>
        </div>
        {iconEl}
      </div>
    </div>
  );
}

export default function KpiPreviewPage() {
  return (
    <DashboardShell
      title="KPI Card"
      titleAccent="Design"
      subtitle="Minimal approach — identical to StatCard, only adding colored value + border + target bar. No extra elements."
    >
      <style>{`
        @keyframes kpi-pulse-border {
          0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.2); }
          50% { box-shadow: 0 0 0 6px rgba(220, 38, 38, 0); }
        }
      `}</style>

      <div className="space-y-12">

        {/* ── CURRENT STATCARD (DNA Standard) ── */}
        <SectionLabel>STANDARD STATCARD — unchanged DNA component</SectionLabel>
        <div className="grid grid-cols-4 gap-8">
          <StatCard label="Revenue" value="Rp 1.25 M" subValue="Revenue MTD" icon={<DollarSign />} />
          <StatCard label="Output" value="12,450" subValue="Finished Goods" icon={<Factory />} />
          <StatCard label="OEE" value="62.4%" subValue="Overall Equipment" icon={<Activity />} />
          <StatCard label="Yield" value="98.2%" subValue="Quality Rate" icon={<TrendingUp />} />
        </div>

        {/* ── KPI CARD — same structure, + color + target bar ── */}
        <SectionLabel>KPI CARD — same as StatCard + value color + border color + target bar</SectionLabel>
        <p className="text-[9px] font-bold text-slate-400 -mt-6">No extra elements (no dot, no insight callout, no &quot;Target:&quot; text). Only the card structure changes.</p>

        <div className="grid grid-cols-4 gap-8">
          <KpiCard label="Revenue" value="Rp 850 Jt" targetPct={57} subValue="57% · below target" icon={<DollarSign />} />
          <KpiCard label="Output" value="12,450" targetPct={108} subValue="108% · above target" icon={<Factory />} />
          <KpiCard label="OEE" value="62.4%" targetPct={62} subValue="62% · below target" icon={<Activity />} />
          <KpiCard label="Yield" value="92.1%" targetPct={92} subValue="92% · on target" icon={<TrendingUp />} />
        </div>

        {/* ── COMPARISON SPEC ── */}
        <div className="bento-card p-8 space-y-5">
          <SectionLabel>DNA COMPLIANCE — WHAT CHANGED FROM STATCARD</SectionLabel>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#F9FAFB] border-b">
                  <th className="text-table-header text-slate-400 px-6 py-6 w-48">Element</th>
                  <th className="text-table-header text-slate-400 px-6 py-6 w-48">StatCard (DNA)</th>
                  <th className="text-table-header text-slate-400 px-6 py-6">KpiCard (new)</th>
                  <th className="text-table-header text-slate-400 px-6 py-6 w-20">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {[
                  { el: "Card Height",     stat: "h-[148px]",          kpi: "h-[148px]",                          chg: "same" },
                  { el: "Card Padding",    stat: "p-7",                kpi: "p-7",                                chg: "same" },
                  { el: "Card Radius",     stat: "rounded-[24px]",     kpi: "rounded-[24px]",                     chg: "same" },
                  { el: "Card Shadow",     stat: "shadow-sm",          kpi: "shadow-sm",                          chg: "same" },
                  { el: "Label Style",     stat: "9px / 900w / 0.1em",kpi: "9px / 900w / 0.1em",                 chg: "same" },
                  { el: "Value Size",      stat: "32px / 900w / tab",  kpi: "32px / 900w / tab",                  chg: "same" },
                  { el: "Icon Container",  stat: "p-4 bg-slate-50",    kpi: "p-3.5 (slightly smaller icon box)", chg: "minor" },
                  { el: "❯ Value Color",   stat: "text-slate-900",     kpi: "Rose-600 / Emerald-600 / Slate-900", chg: "NEW" },
                  { el: "❯ Border Color",  stat: "border-slate-200",   kpi: "Rose-300 / Emerald-300 / Slate-200", chg: "NEW" },
                  { el: "❯ Target Bar",    stat: "— (none)",           kpi: "4px progress bar at bottom",          chg: "NEW" },
                ].map((row, i) => (
                  <tr key={i}>
                    <td className="text-[11px] font-bold text-slate-700 px-6 py-3">{row.el}</td>
                    <td className="text-[11px] font-bold text-slate-500 px-6 py-3">{row.stat}</td>
                    <td className="text-[11px] font-bold text-slate-500 px-6 py-3">{row.kpi}</td>
                    <td className="text-[11px] font-black text-slate-900 px-6 py-3">{row.chg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </DashboardShell>
  );
}
