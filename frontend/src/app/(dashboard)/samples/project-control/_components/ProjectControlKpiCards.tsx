"use client";

import React from "react";
import { FolderOpen, ShieldAlert, AlertTriangle, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ProjectRow,
  ProjectControlSummary,
} from "../_types/project-control.types";

export interface ProjectControlKpiCardsProps {
  summary: ProjectControlSummary;
  onTrackPct: number;
  attentionProjects: ProjectRow[];
  data: ProjectRow[];
}

export function ProjectControlKpiCards({
  summary,
  onTrackPct,
  attentionProjects,
  data,
}: ProjectControlKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Status Eksekusi Proyek */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
            Status Eksekusi Proyek
          </span>
          <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <FolderOpen className="w-4 h-4" />
          </span>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-[32px] font-black text-slate-900 leading-tight">
              {summary.totalActive}
            </h3>
            <span className="text-[13px] font-bold text-slate-500">
              Proyek Aktif
            </span>
          </div>
          <div className="space-y-1 mt-2">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-emerald-600">On Track: {summary.onTrack}</span>
              <span className="text-slate-700">{onTrackPct}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${onTrackPct}%` }}
                className="bg-emerald-500 h-full rounded-full transition-all"
              />
            </div>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span>âš¡ {summary.atRisk} At Risk</span>
          <span>ðŸ•’ {summary.onHold} On Hold</span>
          <span>ðŸ“‹ {summary.planned} Planned</span>
        </div>
      </div>

      {/* 2. Blocker Tercatat */}
      <div
        className={cn(
          "bg-white border rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-3",
          summary.blocked > 0
            ? "border-purple-300 bg-purple-50/20"
            : "border-slate-200"
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold text-purple-700 uppercase tracking-wider">
            Blocker Tercatat
          </span>
          <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
            <ShieldAlert className="w-4 h-4" />
          </span>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-[32px] font-black text-purple-950 leading-tight">
              {summary.blocked}
            </h3>
            <span className="text-[12px] font-bold text-purple-700">
              Proyek Terhambat
            </span>
          </div>
          <div className="space-y-1 mt-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-purple-700">
              <span>Diambil dari catatan blocker proyek</span>
              <span>{summary.blocked} Proyek</span>
            </div>
            <div className="w-full h-2 bg-purple-100 rounded-full overflow-hidden">
              <div
                style={{
                  width: `${Math.round(
                    (summary.blocked / (summary.totalActive || 1)) * 100
                  )}%`,
                }}
                className="bg-purple-600 h-full rounded-full"
              />
            </div>
          </div>
        </div>
        <div className="pt-2 border-t border-purple-100 text-[11px] font-semibold text-purple-800 truncate">
          {summary.blocked > 0
            ? `ðŸ“Œ ${
                attentionProjects.find((p) => p.blockers?.trim())?.name ||
                "Lihat tabel perhatian"
              }`
            : "Tidak ada blocker tercatat"}
        </div>
      </div>

      {/* 3. At Risk */}
      <div
        className={cn(
          "bg-white border rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-3",
          summary.atRisk > 0
            ? "border-rose-300 bg-rose-50/20"
            : "border-slate-200"
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold text-rose-600 uppercase tracking-wider">
            At Risk
          </span>
          <span className="p-2 rounded-xl bg-rose-100 text-rose-600">
            <AlertTriangle className="w-4 h-4" />
          </span>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-[32px] font-black text-rose-950 leading-tight">
              {summary.atRisk}
            </h3>
            <span className="text-[12px] font-bold text-rose-700">
              Proyek Berisiko
            </span>
          </div>
          <div className="space-y-1 mt-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-rose-700">
              <span>canonicalStatus = AT_RISK</span>
              <span>
                {Math.round(
                  (summary.atRisk / (summary.totalActive || 1)) * 100
                )}
                % dari aktif
              </span>
            </div>
            <div className="w-full h-2 bg-rose-100 rounded-full overflow-hidden">
              <div
                style={{
                  width: `${Math.round(
                    (summary.atRisk / (summary.totalActive || 1)) * 100
                  )}%`,
                }}
                className="bg-rose-600 h-full"
              />
            </div>
          </div>
        </div>
        <div className="pt-2 border-t border-rose-100 text-[11px] font-semibold text-rose-800 truncate">
          {summary.atRisk > 0
            ? `âš ï¸ ${data
                .filter((p) => p.status === "AT_RISK")
                .map((p) => p.name)
                .slice(0, 2)
                .join(" & ")}`
            : "Tidak ada proyek berisiko"}
        </div>
      </div>

      {/* 4. Milestone Achievement */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider">
            Milestone Achievement
          </span>
          <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
            <Target className="w-4 h-4" />
          </span>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-[32px] font-black text-slate-900 leading-tight">
              {summary.completed}
            </h3>
            <span className="text-[12px] font-bold text-emerald-700">
              Proyek Selesai
            </span>
          </div>
          <div className="space-y-1 mt-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700">
              <span>Rata-Rata Progress Portofolio Aktif</span>
              <span>{summary.avgProgress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                style={{ width: `${summary.avgProgress}%` }}
                className="bg-emerald-500 h-full rounded-full"
              />
            </div>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-100 text-[11px] font-semibold text-emerald-700 truncate">
          {data.length} proyek tercatat di register
        </div>
      </div>
    </div>
  );
}
