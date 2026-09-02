"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  X, Clock, CheckCircle2, AlertTriangle, AlertOctagon,
  FlaskConical, Gauge, Package, TrendingUp, DollarSign,
  Activity, Zap, Loader2, ChevronRight, FileText, ClipboardList, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DnaBadge } from "@/components/dna";
import { useRouter } from "next/navigation";

interface WoDetailDrawerProps {
  woId: string | null;
  onClose: () => void;
}

const STAGE_LABELS: Record<string, string> = {
  PLANNING: "Planning", WAITING_MATERIAL: "Wait Material",
  WAITING_PROCUREMENT: "Wait Procurement", READY_TO_PRODUCE: "Ready",
  MIXING: "Mixing", PENDING_QC: "QC Hold", QC_HOLD: "QC Hold",
  FILLING: "Filling", PACKING: "Packing", FINISHED_GOODS: "FG",
  DONE: "Done", DELIVERED: "Delivered", CLOSED: "Closed",
};

const STAGE_ORDER = [
  'PLANNING', 'WAITING_MATERIAL', 'WAITING_PROCUREMENT', 'READY_TO_PRODUCE',
  'MIXING', 'PENDING_QC', 'QC_HOLD', 'FILLING', 'PACKING', 'FINISHED_GOODS', 'DONE'
];

export function WoDetailDrawer({ woId, onClose }: WoDetailDrawerProps) {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ["wo-timeline", woId],
    queryFn: async () => (await api.get(`/production/work-orders/${woId}/timeline`)).data,
    enabled: !!woId,
  });

  React.useEffect(() => {
    if (!woId) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [woId, onClose]);

  if (!woId) return null;

  const currentStageIdx = data ? STAGE_ORDER.indexOf(data.currentStage) : -1;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white border-l border-slate-200 shadow-2xl overflow-y-auto animate-in slide-in-from-right">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-sm font-black italic tracking-tighter uppercase">
              {data?.woNumber || 'Loading...'}
            </h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{data?.productName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : data ? (
          <div className="p-6 space-y-8">
            {/* Client Info */}
            <div className="flex gap-4">
              <div className="flex-1 bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Client</p>
                <p className="text-xs font-bold text-slate-800">{data.clientName}</p>
              </div>
              <div className="flex-1 bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Qty</p>
                <p className="text-xs font-bold text-slate-800">{data.targetQty?.toLocaleString()} pcs</p>
              </div>
              <div className="flex-1 bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Stage</p>
                <p className="text-xs font-bold text-slate-800">{STAGE_LABELS[data.currentStage] || data.currentStage}</p>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                <Clock className="w-3 h-3" /> TIMELINE
              </h3>
              <div className="space-y-2">
                {STAGE_ORDER.filter(s => data.timeline?.some((t: any) => t.stage === s) || STAGE_ORDER.indexOf(s) <= currentStageIdx).map((stage, idx) => {
                  const log = data.timeline?.find((t: any) => t.stage === stage);
                  const isActive = stage === data.currentStage;
                  const isCompleted = idx < currentStageIdx;
                  const isPending = !isCompleted && !isActive;
                  return (
                    <div key={stage} className={cn(
                      "flex items-center gap-4 p-3 rounded-xl border transition-all",
                      isActive ? "bg-blue-50 border-blue-200" :
                      isCompleted ? "bg-emerald-50/50 border-emerald-100" :
                      "bg-white border-slate-100 opacity-50"
                    )}>
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                        isActive ? "bg-blue-500" :
                        isCompleted ? "bg-emerald-500" : "bg-slate-200"
                      )}>
                        {isCompleted ? <CheckCircle2 className="w-4 h-4 text-white" /> :
                         isActive ? <Activity className="w-4 h-4 text-white animate-pulse" /> :
                         <div className="w-2 h-2 rounded-full bg-slate-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-[11px] font-black uppercase tracking-tight",
                          isActive ? "text-blue-700" : isCompleted ? "text-emerald-700" : "text-slate-400"
                        )}>
                          {STAGE_LABELS[stage] || stage}
                          {isActive && <span className="ml-2 text-[8px] text-blue-500 animate-pulse">● LIVE</span>}
                        </p>
                        {log && (
                          <div className="flex gap-3 mt-1">
                            <span className="text-[9px] text-slate-500 tabular-nums">
                              Input: {log.inputQty}
                            </span>
                            <span className="text-[9px] text-emerald-600 tabular-nums">
                              Good: {log.goodQty}
                            </span>
                            {log.rejectQty > 0 && (
                              <span className="text-[9px] text-rose-600 tabular-nums">
                                Reject: {log.rejectQty}
                              </span>
                            )}
                            {log.durationMin > 0 && (
                              <span className="text-[9px] text-slate-400 tabular-nums">
                                {log.durationMin}m
                              </span>
                            )}
                          </div>
                        )}
                        {log?.machineName && (
                          <p className="text-[8px] text-slate-400 mt-0.5">Machine: {log.machineName}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stage Actions */}
            {data && (
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                  <Activity className="w-3 h-3" /> ACTIONS
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => router.push(`/production/schedules?wo=${data.id}&stage=${data.currentStage}`)}
                    className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-all group"
                  >
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase text-blue-700 tracking-tight">Schedule</p>
                      <p className="text-[8px] text-blue-500 mt-0.5">Create/Edit Schedule</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-blue-400 ml-auto group-hover:translate-x-1 transition-transform" />
                  </button>

                  {['MIXING', 'FILLING', 'PACKING'].includes(data.currentStage) && (
                    <button
                      onClick={() => router.push(`/production/batch-records?wo=${data.id}`)}
                      className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl hover:bg-emerald-100 transition-all group"
                    >
                      <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                        <ClipboardList className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-black uppercase text-emerald-700 tracking-tight">QC Sign-Off</p>
                        <p className="text-[8px] text-emerald-500 mt-0.5">Log Stage Results</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-emerald-400 ml-auto group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}

                  <button
                    onClick={() => router.push(`/production/work-orders?detail=${data.id}`)}
                    className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-all group"
                  >
                    <div className="w-10 h-10 bg-slate-500 rounded-xl flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase text-slate-700 tracking-tight">Advance Stage</p>
                      <p className="text-[8px] text-slate-400 mt-0.5">Move to next stage</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 ml-auto group-hover:translate-x-1 transition-transform" />
                  </button>

                  {data.currentStage === 'FINISHED_GOODS' && (
                    <button
                      onClick={() => router.push(`/logistics/delivery-orders?wo=${data.id}`)}
                      className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-100 rounded-xl hover:bg-purple-100 transition-all group"
                    >
                      <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-black uppercase text-purple-700 tracking-tight">Create DO</p>
                        <p className="text-[8px] text-purple-500 mt-0.5">Delivery Order</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-purple-400 ml-auto group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Mass Balance */}
            {data.massBalance && (
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                  <Gauge className="w-3 h-3" /> NERACA MASSA
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Input</p>
                    <p className="text-lg font-black text-slate-800 tabular-nums">{data.massBalance.totalInput}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 text-center">
                    <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Good</p>
                    <p className="text-lg font-black text-emerald-700 tabular-nums">{data.massBalance.totalGood}</p>
                  </div>
                  <div className={cn("rounded-xl p-3 border text-center",
                    data.massBalance.leakage > 0 ? "bg-rose-50 border-rose-100" : "bg-slate-50 border-slate-100"
                  )}>
                    <p className={cn("text-[8px] font-black uppercase tracking-widest",
                      data.massBalance.leakage > 0 ? "text-rose-600" : "text-slate-400"
                    )}>Leakage</p>
                    <p className={cn("text-lg font-black tabular-nums",
                      data.massBalance.leakage > 0 ? "text-rose-700" : "text-slate-800"
                    )}>{data.massBalance.leakage}</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 text-center">
                    <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest">Yield</p>
                    <p className="text-lg font-black text-amber-700 tabular-nums">{data.massBalance.effectiveYield}%</p>
                  </div>
                </div>
              </div>
            )}

            {/* Costing */}
            {data.costing && (
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                  <DollarSign className="w-3 h-3" /> COSTING
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Labor</p>
                    <p className="text-xs font-black text-slate-800 tabular-nums">
                      Rp {data.costing.totalLaborCost?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Overhead</p>
                    <p className="text-xs font-black text-slate-800 tabular-nums">
                      Rp {data.costing.totalOverheadCost?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                    <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Total Cost</p>
                    <p className="text-xs font-black text-blue-700 tabular-nums">
                      Rp {data.costing.totalCost?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Anomalies from timeline logs */}
            {data.timeline?.some((t: any) => t.rejectQty > 0 || t.notes?.includes('CRITICAL')) && (
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-4 flex items-center gap-2">
                  <AlertOctagon className="w-3 h-3" /> ANOMALI
                </h3>
                <div className="space-y-2">
                  {data.timeline.filter((t: any) => t.rejectQty > 0 || t.downtimeMinutes > 30).map((log: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-rose-50 rounded-xl border border-rose-100">
                      <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] font-black text-rose-700 uppercase">{STAGE_LABELS[log.stage] || log.stage}</p>
                        <p className="text-[9px] text-rose-600 mt-0.5">
                          {log.rejectQty > 0 && `${log.rejectQty} unit reject`}
                          {log.rejectQty > 0 && log.downtimeMinutes > 30 && ' | '}
                          {log.downtimeMinutes > 30 && `Downtime ${log.downtimeMinutes}m`}
                        </p>
                        {log.notes && !log.notes.startsWith('RELAY') && (
                          <p className="text-[8px] text-rose-400 mt-1">{log.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
