"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Activity, AlertTriangle, AlertOctagon, Clock, User,
  Cpu, Timer, ChevronRight, Factory, RefreshCw,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DnaBadge } from "@/components/dna";
import { WoDetailDrawer } from "@/components/production/WoDetailDrawer";

const STAGE_LABELS: Record<string, string> = {
  PLANNING: "Planning", WAITING_MATERIAL: "Wait Mat",
  WAITING_PROCUREMENT: "Procurement", READY_TO_PRODUCE: "Ready",
  MIXING: "Mixing", PENDING_QC: "QC Bulk",
  QC_HOLD: "QC Hold", REWORK: "Rework",
  FILLING: "Filling", PACKING: "Packing",
  FINISHED_GOODS: "FG Done",
};

const STAGE_COLORS: Record<string, string> = {
  PLANNING: "border-t-slate-400",
  WAITING_MATERIAL: "border-t-amber-400",
  WAITING_PROCUREMENT: "border-t-rose-400",
  READY_TO_PRODUCE: "border-t-emerald-400",
  MIXING: "border-t-blue-500",
  PENDING_QC: "border-t-violet-400",
  QC_HOLD: "border-t-rose-500",
  REWORK: "border-t-orange-500",
  FILLING: "border-t-indigo-500",
  PACKING: "border-t-purple-500",
  FINISHED_GOODS: "border-t-emerald-600",
};

const BG_COLORS: Record<string, string> = {
  PLANNING: "bg-slate-50", WAITING_MATERIAL: "bg-amber-50/50",
  WAITING_PROCUREMENT: "bg-rose-50/50", READY_TO_PRODUCE: "bg-emerald-50/50",
  MIXING: "bg-blue-50/50", PENDING_QC: "bg-violet-50/50",
  QC_HOLD: "bg-rose-50/50", REWORK: "bg-orange-50/50",
  FILLING: "bg-indigo-50/50", PACKING: "bg-purple-50/50",
  FINISHED_GOODS: "bg-emerald-50/50",
};

const HEALTH_CFG: Record<string, { icon: any; class: string; label: string }> = {
  ON_TRACK: { icon: Activity, class: "text-emerald-600 bg-emerald-50 border-emerald-200", label: "On Track" },
  DELAYED: { icon: AlertTriangle, class: "text-amber-600 bg-amber-50 border-amber-200", label: "Delayed" },
  CRITICAL: { icon: AlertOctagon, class: "text-rose-600 bg-rose-50 border-rose-200", label: "CRITICAL" },
};

const DISPLAY_STAGES = [
  'PLANNING', 'WAITING_MATERIAL', 'WAITING_PROCUREMENT', 'READY_TO_PRODUCE',
  'MIXING', 'PENDING_QC', 'QC_HOLD', 'REWORK', 'FILLING', 'PACKING', 'FINISHED_GOODS'
];

export default function ProductionFloorPage() {
  const [selectedWoId, setSelectedWoId] = useState<string | null>(null);
  const [filterStage, setFilterStage] = useState<string>("ALL");
  const [liveTime, setLiveTime] = useState("");

  useEffect(() => {
    setLiveTime(new Date().toLocaleTimeString('id-ID', { hour12: false }));
    const interval = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString('id-ID', { hour12: false }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["prodFloor"],
    queryFn: async () => (await api.get("/production/floor")).data,
    refetchInterval: 15000,
  });

  const stages = data?.stages || {};
  const totalActive = data?.totalActive || 0;

  const visibleStages = filterStage === "ALL"
    ? DISPLAY_STAGES
    : DISPLAY_STAGES.filter(s => s === filterStage);

  return (
    <DashboardShell
      title="Production"
      titleAccent="Floor"
      subtitle="Real-Time Swimlane · Plant Overview"
      actions={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-200 rounded-xl text-[10px] font-black text-slate-500">
            <Timer className="w-3.5 h-3.5" />
            {liveTime}
          </div>
          <DnaBadge status={totalActive > 0 ? "success" : "default"} className="text-[9px]">
            {totalActive} Active
          </DnaBadge>
          <button onClick={() => refetch()} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      }
    >
      {/* Stage Filter */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setFilterStage("ALL")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all shrink-0",
            filterStage === "ALL"
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
          )}
        >
          All
        </button>
        {DISPLAY_STAGES.map(stage => (
          <button
            key={stage}
            onClick={() => setFilterStage(stage)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all shrink-0",
              filterStage === stage
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
            )}
          >
            {STAGE_LABELS[stage] || stage}
          </button>
        ))}
      </div>

      {/* Swimlane */}
      {isLoading ? (
        <div className="h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
        </div>
      ) : isError ? (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
          <AlertOctagon className="w-12 h-12 text-rose-300" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Failed to load floor data</p>
          <button onClick={() => refetch()} className="text-[9px] font-black text-blue-600 underline">Retry</button>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "60vh" }}>
          {visibleStages.map(stage => {
            const wos = stages[stage] || [];
            const count = wos.length;

            return (
              <div key={stage} className="flex flex-col min-w-[280px] w-[280px] shrink-0">
                {/* Stage Header */}
                <div className={cn(
                  "border-t-4 rounded-xl bg-white border border-slate-200 p-3 mb-2 shadow-sm",
                  STAGE_COLORS[stage] || "border-t-slate-400"
                )}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                      {STAGE_LABELS[stage] || stage}
                    </p>
                    <span className={cn(
                      "text-[9px] font-black px-2 py-0.5 rounded-md",
                      count > 0 ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"
                    )}>
                      {count}
                    </span>
                  </div>
                  {count > 0 && (
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          count > 3 ? "bg-rose-500" : count > 1 ? "bg-amber-500" : "bg-emerald-500"
                        )}
                        style={{ width: `${Math.min(count / 5 * 100, 100)}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* WO Cards */}
                <div className="flex flex-col gap-2 flex-1">
                  {count === 0 ? (
                    <div className="flex-1 border-2 border-dashed border-slate-100 rounded-xl flex items-center justify-center">
                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Empty</p>
                    </div>
                  ) : (
                    wos.map((wo: any) => {
                      const hCfg = HEALTH_CFG[wo.health] || HEALTH_CFG.ON_TRACK;
                      const HealthIcon = hCfg.icon;
                      return (
                        <button
                          key={wo.id}
                          onClick={() => setSelectedWoId(wo.id)}
                          className="text-left w-full bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:border-slate-300 hover:shadow-md transition-all group"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-[10px] font-black italic tracking-tight text-slate-800 truncate">
                              {wo.woNumber}
                            </p>
                            <span className={cn(
                              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[7px] font-black border",
                              hCfg.class
                            )}>
                              <HealthIcon className="w-2.5 h-2.5" />
                              {hCfg.label}
                            </span>
                          </div>
                          <p className="text-[9px] font-bold text-slate-600 truncate mb-2">
                            {wo.productName}
                          </p>
                          <div className="flex items-center gap-3 text-[8px] text-slate-400 font-black">
                            {wo.machineName && (
                              <span className="flex items-center gap-1">
                                <Cpu className="w-2.5 h-2.5" /> {wo.machineName}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Timer className="w-2.5 h-2.5" /> {wo.targetQty} pcs
                            </span>
                          </div>
                          {wo.timeSinceUpdate !== null && (
                            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                              <span className={cn(
                                "text-[7px] font-black uppercase tracking-wider",
                                wo.timeSinceUpdate > 4 ? "text-rose-400" : "text-slate-400"
                              )}>
                                {wo.timeSinceUpdate > 0 ? `${wo.timeSinceUpdate}h ago` : 'Just now'}
                              </span>
                              <ChevronRight className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <WoDetailDrawer woId={selectedWoId} onClose={() => setSelectedWoId(null)} />
    </DashboardShell>
  );
}
