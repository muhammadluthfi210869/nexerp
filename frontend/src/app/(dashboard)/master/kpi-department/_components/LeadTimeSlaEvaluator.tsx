"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Clock,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
} from "lucide-react";
import {
  DnaCard,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaBadge,
  DnaButton,
} from "@/components/dna";

interface StageMetric {
  stageId: string;
  stageName: string;
  division: string;
  targetDays: number;
  actualAvgDays: number;
  complianceRate: number;
  status: "EXCELLENT" | "ON_TRACK" | "AT_RISK" | "OFF_TRACK";
  bottleneckCount: number;
  leadTimeBenchmark: string;
  description: string;
}

interface LeadTimeData {
  totalTargetDays: number;
  totalActualAvgDays: number;
  overallCompanySlaRate: number;
  bottleneckStage: string;
  evaluatedOrdersCount: number;
  stages: StageMetric[];
  evaluatedAt: string;
}

export function LeadTimeSlaEvaluator() {
  const [isExpanded, setIsExpanded] = useState(true);

  const { data, isLoading } = useQuery<LeadTimeData>({
    queryKey: ["kpi-stage-lead-times"],
    queryFn: async () => {
      const res = await api.get("/kpi/lead-times");
      return res.data;
    },
  });

  if (isLoading || !data) {
    return (
      <DnaCard className="p-4 animate-pulse bg-slate-50 border-slate-200">
        <div className="h-6 w-1/3 bg-slate-200 rounded mb-2" />
        <div className="h-4 w-1/2 bg-slate-200 rounded" />
      </DnaCard>
    );
  }

  return (
    <DnaCard className="p-5 space-y-4 border-blue-200/80 bg-gradient-to-b from-blue-50/20 to-white shadow-2xs">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[16px] font-black text-slate-900 tracking-tight">
                Evaluasi Lead-Time Operasional Antar-Divisi & SLA Bottleneck
              </h3>
              <DnaBadge variant="info">Realtime Pipeline</DnaBadge>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Pelacakan durasi riil siklus Lead &rarr; Formulasi &rarr; DP 50% &rarr; Produksi &rarr; QC Release &rarr; Pengiriman ({data.evaluatedOrdersCount} Siklus Operasional).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DnaButton
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-600 hover:text-slate-900"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                <span>Ringkas</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                <span>Buka Detail</span>
              </>
            )}
          </DnaButton>
        </div>
      </div>

      {/* 4 Summary Stat Mini-Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-white rounded-xl border border-slate-200/80">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total End-to-End Cycle</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-[22px] font-black text-slate-900 tabular-nums">
              {data.totalActualAvgDays} Hari
            </span>
            <span className="text-[11px] font-bold text-emerald-600">
              (Target &le; {data.totalTargetDays} Hari)
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Total siklus pabrikasi & pengiriman</span>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200/80">
          <span className="text-[10px] font-bold text-slate-400 uppercase">SLA Compliance Rate</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-[22px] font-black text-blue-700 tabular-nums">
              {data.overallCompanySlaRate}%
            </span>
            <span className="text-[11px] font-bold text-slate-500">On-Time</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Tingkat kepatuhan jadwal keseluruhan</span>
        </div>

        <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200">
          <span className="text-[10px] font-bold text-amber-800 uppercase">Fokus Hambatan (Bottleneck)</span>
          <div className="text-[13px] font-bold text-amber-900 mt-1 truncate">
            {data.bottleneckStage}
          </div>
          <span className="text-[10px] text-amber-700 font-medium">Tahap dengan durasi deviasi tertinggi</span>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200/80">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Sinkronisasi Terakhir</span>
          <div className="text-[14px] font-black text-slate-800 mt-1 tabular-nums">
            {data.evaluatedAt}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Auto-agregasi dari State Machine</span>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Visual Step Timeline */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 overflow-x-auto">
            <div className="flex items-center justify-between min-w-[700px] gap-2">
              {data.stages.map((stage, idx) => {
                const isWarning = stage.complianceRate < 90;
                return (
                  <React.Fragment key={stage.stageId}>
                    <div className="flex-1 bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs text-center">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase block">
                        Tahap {idx + 1}
                      </span>
                      <span className="text-[11px] font-black text-slate-800 block truncate mt-0.5">
                        {stage.division.split("/")[0]}
                      </span>
                      <div className="flex items-center justify-center gap-1 mt-1 text-[11px] font-bold tabular-nums">
                        <span className={isWarning ? "text-amber-700" : "text-emerald-700"}>
                          {stage.actualAvgDays}h
                        </span>
                        <span className="text-slate-400 font-normal">/ {stage.targetDays}h</span>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded mt-1 inline-block ${
                          isWarning
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {stage.complianceRate}% SLA
                      </span>
                    </div>

                    {idx < data.stages.length - 1 && (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow>
                  <DnaTh>Tahap & Divisi Penanggung Jawab</DnaTh>
                  <DnaTh>Benchmark SLA</DnaTh>
                  <DnaTh>Rata-Rata Riil</DnaTh>
                  <DnaTh>SLA Compliance</DnaTh>
                  <DnaTh>Keterlambatan (Bottleneck)</DnaTh>
                  <DnaTh className="text-right">Status Evaluasi</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {data.stages.map((stage) => (
                  <DnaTableRow key={stage.stageId}>
                    <DnaTd>
                      <span className="font-bold text-slate-900 block text-[12px]">
                        {stage.stageName}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {stage.description}
                      </span>
                    </DnaTd>

                    <DnaTd>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-bold">
                        {stage.leadTimeBenchmark}
                      </span>
                    </DnaTd>

                    <DnaTd>
                      <span className="font-black text-slate-900 tabular-nums text-[13px]">
                        {stage.actualAvgDays} Hari
                      </span>
                    </DnaTd>

                    <DnaTd>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-blue-700 tabular-nums text-[12px]">
                          {stage.complianceRate}%
                        </span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              stage.complianceRate >= 90
                                ? "bg-emerald-500"
                                : stage.complianceRate >= 80
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            }`}
                            style={{ width: `${Math.min(stage.complianceRate, 100)}%` }}
                          />
                        </div>
                      </div>
                    </DnaTd>

                    <DnaTd>
                      {stage.bottleneckCount > 0 ? (
                        <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-bold inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>{stage.bottleneckCount} Kasus</span>
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-semibold text-[11px] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Nihil (Lancar)</span>
                        </span>
                      )}
                    </DnaTd>

                    <DnaTd className="text-right">
                      <DnaBadge
                        variant={
                          stage.status === "EXCELLENT"
                            ? "success"
                            : stage.status === "ON_TRACK"
                            ? "info"
                            : stage.status === "AT_RISK"
                            ? "warning"
                            : "danger"
                        }
                      >
                        {stage.status.replace("_", " ")}
                      </DnaBadge>
                    </DnaTd>
                  </DnaTableRow>
                ))}
              </DnaTableBody>
            </DnaTable>
          </div>
        </>
      )}
    </DnaCard>
  );
}
