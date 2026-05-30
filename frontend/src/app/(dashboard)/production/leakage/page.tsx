"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  AlertOctagon, AlertTriangle, Droplets, Clock, Scale,
  ShieldOff, SkipForward, TrendingUp, ChevronRight,
  Loader2, RefreshCw, FlaskConical
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DnaBadge } from "@/components/dna";
import { WoDetailDrawer } from "@/components/production/WoDetailDrawer";

interface LeakItem {
  woNumber: string;
  stage?: string;
  [key: string]: any;
}

const LEAKAGE_CATEGORIES = [
  { key: "materialLeakage", label: "Material Leakage", icon: Droplets, color: "rose", desc: "Input > Output di stage produksi" },
  { key: "timeLeakage", label: "Time Leakage", icon: Clock, color: "amber", desc: "Gap antar stage > 4 jam" },
  { key: "weightDeviation", label: "Weight Deviation", icon: Scale, color: "orange", desc: "Actual > 0.5% dari BOM" },
  { key: "missingQCGate", label: "Missing QC Gate", icon: ShieldOff, color: "violet", desc: "Stage selesai tanpa QC" },
  { key: "sequenceViolation", label: "Sequence Violation", icon: SkipForward, color: "rose", desc: "Stage dilompati" },
  { key: "rejectSpikes", label: "Reject Spikes", icon: TrendingUp, color: "red", desc: "Reject rate > 10% per shift" },
];

const CATEGORY_CLASSES: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  rose: { bg: "bg-rose-50/50", border: "border-rose-200", text: "text-rose-700", badge: "bg-rose-500" },
  amber: { bg: "bg-amber-50/50", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-500" },
  orange: { bg: "bg-orange-50/50", border: "border-orange-200", text: "text-orange-700", badge: "bg-orange-500" },
  violet: { bg: "bg-violet-50/50", border: "border-violet-200", text: "text-violet-700", badge: "bg-violet-500" },
  red: { bg: "bg-red-50/50", border: "border-red-200", text: "text-red-700", badge: "bg-red-500" },
};

export default function LeakageCenterPage() {
  const [selectedWoId, setSelectedWoId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["prodLeakage"],
    queryFn: async () => (await api.get("/production/leakage")).data,
    refetchInterval: 30000,
  });

  const summary = data?.summary;

  return (
    <DashboardShell
      title="Leakage"
      titleAccent="Detection Center"
      subtitle="Real-Time Anomaly & Inconsistency Monitor"
      actions={
        <div className="flex items-center gap-3">
          {summary && (
            <>
              <DnaBadge status={summary.criticalCount > 0 ? "critical" : "success"} className="text-[9px]">
                {summary.criticalCount} Critical
              </DnaBadge>
              <DnaBadge status={summary.totalAnomalies > 0 ? "warning" : "default"} className="text-[9px]">
                {summary.totalAnomalies} Total
              </DnaBadge>
            </>
          )}
          <button onClick={() => refetch()} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      }
    >
      {isLoading ? (
        <div className="h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
        </div>
      ) : isError ? (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
          <AlertOctagon className="w-12 h-12 text-rose-300" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Failed to load leakage data</p>
          <button onClick={() => refetch()} className="text-[9px] font-black text-blue-600 underline">Retry</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {LEAKAGE_CATEGORIES.map((cat) => {
            const items: LeakItem[] = data?.[cat.key] || [];
            const classes = CATEGORY_CLASSES[cat.color] || CATEGORY_CLASSES.rose;
            const Icon = cat.icon;
            const isExpanded = activeCategory === cat.key;

            if (items.length === 0) {
              return (
                <div key={cat.key} className={cn("rounded-2xl border p-5", classes.bg, classes.border, "opacity-60")}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn("p-2 rounded-xl", classes.bg, "border", classes.border)}>
                      <Icon className={cn("w-4 h-4", classes.text)} />
                    </div>
                    <div>
                      <p className={cn("text-[10px] font-black uppercase tracking-widest", classes.text)}>{cat.label}</p>
                      <p className="text-[8px] text-slate-400 mt-0.5">{cat.desc}</p>
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-400 italic">No anomalies detected</p>
                </div>
              );
            }

            return (
              <div key={cat.key} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <button
                  onClick={() => setActiveCategory(isExpanded ? null : cat.key)}
                  className="w-full p-5 flex items-start gap-3 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className={cn("p-2 rounded-xl shrink-0", classes.bg, "border", classes.border)}>
                    <Icon className={cn("w-4 h-4", classes.text)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn("text-[10px] font-black uppercase tracking-widest", classes.text)}>{cat.label}</p>
                      <span className={cn("text-white text-[8px] font-black px-1.5 py-0.5 rounded", classes.badge)}>
                        {items.length}
                      </span>
                    </div>
                    <p className="text-[8px] text-slate-400 mt-0.5">{cat.desc}</p>
                    <p className="text-[9px] font-bold text-slate-600 mt-1">
                      {cat.key === "materialLeakage" && `${items.filter((i: any) => i.lossPct > 10).length} critical leaks`}
                      {cat.key === "timeLeakage" && `${items.filter((i: any) => i.gapHours > 8).length} extended delays`}
                      {cat.key === "weightDeviation" && `${items.length} components affected`}
                      {cat.key === "missingQCGate" && `${items.length} stages skipped`}
                      {cat.key === "sequenceViolation" && `${items.length} sequence breaks`}
                      {cat.key === "rejectSpikes" && `${items.filter((i: any) => i.rejectRate > 20).length} severe`}
                    </p>
                  </div>
                  <ChevronRight className={cn(
                    "w-4 h-4 text-slate-300 mt-2 transition-transform",
                    isExpanded && "rotate-90"
                  )} />
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 divide-y divide-slate-50">
                    {items.slice(0, 10).map((item: any, i: number) => (
                      <div
                        key={i}
                        className="px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => item.woNumber && setSelectedWoId(item.woNumber)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[9px] font-black text-slate-800">{item.woNumber || 'N/A'}</p>
                          {cat.key === "materialLeakage" && (
                            <DnaBadge status={item.lossPct > 10 ? "critical" : "warning"} className="text-[8px]">
                              -{item.lossPct}%
                            </DnaBadge>
                          )}
                          {cat.key === "timeLeakage" && (
                            <DnaBadge status="warning" className="text-[8px]">
                              +{item.gapHours}h
                            </DnaBadge>
                          )}
                          {cat.key === "weightDeviation" && (
                            <DnaBadge status="warning" className="text-[8px]">
                              {item.devPct}%
                            </DnaBadge>
                          )}
                          {cat.key === "rejectSpikes" && (
                            <DnaBadge status={item.rejectRate > 20 ? "critical" : "warning"} className="text-[8px]">
                              {item.rejectRate}%
                            </DnaBadge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[8px] text-slate-400">
                          {item.stage && <span>{item.stage}</span>}
                          {item.productName && <><span>·</span><span className="truncate">{item.productName}</span></>}
                          {item.machineName && <><span>·</span><span>{item.machineName}</span></>}
                        </div>
                        {cat.key === "materialLeakage" && (
                          <div className="mt-1 flex gap-2 text-[8px] text-slate-500">
                            <span>Input: {item.input}</span>
                            <span>Output: {item.output}</span>
                            <span className="text-rose-500">Loss: {item.loss}</span>
                          </div>
                        )}
                        {cat.key === "timeLeakage" && (
                          <div className="mt-1 flex gap-2 text-[8px] text-slate-500">
                            <span>{item.fromStage} → {item.toStage}</span>
                          </div>
                        )}
                        {cat.key === "weightDeviation" && (
                          <div className="mt-1 flex gap-2 text-[8px] text-slate-500">
                            <span>Target: {item.theoretical}</span>
                            <span>Actual: {item.actual}</span>
                          </div>
                        )}
                        {cat.key === "missingQCGate" && (
                          <div className="mt-1 text-[8px] text-slate-500">
                            <span>Stage: {item.stage} · Completed without QC verification</span>
                          </div>
                        )}
                        {cat.key === "sequenceViolation" && (
                          <div className="mt-1 flex gap-2 text-[8px] text-slate-500">
                            <span>Skipped: {item.skippedStages?.join(', ') || 'unknown'}</span>
                          </div>
                        )}
                        {cat.key === "rejectSpikes" && (
                          <div className="mt-1 flex gap-2 text-[8px] text-slate-500">
                            <span>Reject: {item.totalReject}</span>
                            <span>Total: {item.totalOutput}</span>
                            <span>Date: {item.date}</span>
                          </div>
                        )}
                      </div>
                    ))}
                    {items.length > 10 && (
                      <div className="px-5 py-3 text-center">
                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">
                          +{items.length - 10} more anomalies
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <WoDetailDrawer woId={selectedWoId} onClose={() => setSelectedWoId(null)} />
    </DashboardShell>
  );
}
