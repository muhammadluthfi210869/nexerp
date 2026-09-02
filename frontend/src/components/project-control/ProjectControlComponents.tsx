"use client";

import React from "react";
import { ProjectStatus, MilestoneStatus, ProjectHealthSummary } from "@/types/project-control";
import { AlertTriangle, CheckCircle2, Clock, HelpCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  switch (status) {
    case "ON_TRACK":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          ON TRACK
        </span>
      );
    case "AT_RISK":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          AT RISK
        </span>
      );
    case "OFF_TRACK":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
          <XCircle className="w-3 h-3 text-rose-600" />
          OFF TRACK
        </span>
      );
    case "NOT_UPDATED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
          <Clock className="w-3 h-3 text-slate-400" />
          NOT UPDATED
        </span>
      );
    case "DONE":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <CheckCircle2 className="w-3 h-3 text-blue-600" />
          DONE
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
          {status}
        </span>
      );
  }
}

export function MilestoneStatusBadge({ status }: { status: MilestoneStatus }) {
  switch (status) {
    case "DONE":
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">DONE</span>;
    case "WAITING_VERIFICATION":
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 animate-pulse">WAITING VERIFY</span>;
    case "IN_PROGRESS":
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">IN PROGRESS</span>;
    case "OVERDUE":
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">OVERDUE</span>;
    default:
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">NOT STARTED</span>;
  }
}

export function ProjectHealthMeter({ summary }: { summary: ProjectHealthSummary }) {
  const total = summary.totalActive || 1;
  const onTrackPct = Math.round((summary.onTrack / total) * 100);
  const atRiskPct = Math.round((summary.atRisk / total) * 100);
  const offTrackPct = Math.round((summary.offTrack / total) * 100);
  const notUpdatedPct = Math.round((summary.notUpdated / total) * 100);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[12px] font-bold text-slate-900 uppercase tracking-wide">
          Distribusi Kesehatan Proyek Aktif
        </h4>
        <span className="text-[11px] text-slate-500 font-medium">{summary.totalActive} Total Proyek</span>
      </div>

      {/* Progress meter bar */}
      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
        <div style={{ width: `${onTrackPct}%` }} className="bg-emerald-500 transition-all" title={`On Track: ${summary.onTrack}`} />
        <div style={{ width: `${atRiskPct}%` }} className="bg-amber-400 transition-all" title={`At Risk: ${summary.atRisk}`} />
        <div style={{ width: `${offTrackPct}%` }} className="bg-rose-500 transition-all" title={`Off Track: ${summary.offTrack}`} />
        <div style={{ width: `${notUpdatedPct}%` }} className="bg-slate-400 transition-all" title={`Not Updated: ${summary.notUpdated}`} />
      </div>

      {/* Legend & stats */}
      <div className="grid grid-cols-4 gap-2 mt-3 text-center">
        <div className="p-1.5 bg-emerald-50/60 rounded-lg border border-emerald-100">
          <p className="text-[10px] font-bold text-emerald-800 uppercase">On Track</p>
          <p className="text-[14px] font-extrabold text-emerald-700">{summary.onTrack} <span className="text-[10px] font-medium text-emerald-600">({onTrackPct}%)</span></p>
        </div>
        <div className="p-1.5 bg-amber-50/60 rounded-lg border border-amber-100">
          <p className="text-[10px] font-bold text-amber-800 uppercase">At Risk</p>
          <p className="text-[14px] font-extrabold text-amber-700">{summary.atRisk} <span className="text-[10px] font-medium text-amber-600">({atRiskPct}%)</span></p>
        </div>
        <div className="p-1.5 bg-rose-50/60 rounded-lg border border-rose-100">
          <p className="text-[10px] font-bold text-rose-800 uppercase">Off Track</p>
          <p className="text-[14px] font-extrabold text-rose-700">{summary.offTrack} <span className="text-[10px] font-medium text-rose-600">({offTrackPct}%)</span></p>
        </div>
        <div className="p-1.5 bg-slate-50/60 rounded-lg border border-slate-200">
          <p className="text-[10px] font-bold text-slate-700 uppercase">Not Updated</p>
          <p className="text-[14px] font-extrabold text-slate-800">{summary.notUpdated} <span className="text-[10px] font-medium text-slate-500">({notUpdatedPct}%)</span></p>
        </div>
      </div>
    </div>
  );
}
