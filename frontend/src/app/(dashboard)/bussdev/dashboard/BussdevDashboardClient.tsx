"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

import { api } from "@/lib/api";
import { DashboardCards } from "@/components/bussdev/DashboardCards";
import { StageConfirmDialog } from "@/components/bussdev/StageConfirmDialog";
import { GranularPipelineTable } from "@/components/bussdev/GranularPipelineTable";
import { useGranularData } from "@/hooks/use-granular-data";
import { usePerformanceAudit } from "@/hooks/usePerformanceAudit";
import { BusDevActivityStream } from "@/components/dashboard/BusDevActivityStream";
import { SectionLabel } from "@/components/dna";
import { TableWrapper } from "@/components/dna/TableWrapper";

export default function BussdevDashboardClient() {
  usePerformanceAudit("Bussdev Dashboard");
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const { data: granularData } = useGranularData();

  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ["dashboardAnalytics"],
    queryFn: async () => (await api.get("/bussdev/dashboard")).data,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  const { data: staffPerformance, isLoading: staffLoading } = useQuery({
    queryKey: ["staffPerformance"],
    queryFn: async () => (await api.get("/bussdev/analytics/staff-performance")).data,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  const lostData = dashboard?.lostChurn;

  return (
    <>
      <DashboardCards variant="dashboard" data={dashboard} />

      {/* 📊 II & III. PERFORMANCE & CHURN MATRIX */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* BD PERFORMANCE EVALUATION */}
        <div className="xl:col-span-9 space-y-4">
          <SectionLabel>2. BD PERFORMANCE EVALUATION</SectionLabel>
          <TableWrapper>
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-table-header text-slate-400">BD NAME</th>
                    <th className="px-4 py-4 text-table-header text-slate-400 text-center">LEADS</th>
                    <th className="px-4 py-4 text-table-header text-slate-400 text-center">FOLLOW UP</th>
                    <th className="px-4 py-4 text-table-header text-slate-400 text-center">CR SAMPLE</th>
                    <th className="px-4 py-4 text-table-header text-slate-400 text-center">CR DEAL</th>
                    <th className="px-4 py-4 text-table-header text-slate-400 text-center">CLS SAMPLE</th>
                    <th className="px-4 py-4 text-table-header text-slate-400 text-center">CLS NEW CLIENT</th>
                    <th className="px-4 py-4 text-table-header text-slate-400 text-center">CLS RO</th>
                    <th className="px-6 py-4 text-table-header text-slate-400 text-right">ACTUAL REVENUE</th>
                    <th className="px-6 py-4 text-table-header text-slate-400 text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(staffPerformance || []).map((s: any) => (
                    <tr key={s.name} className="group hover:bg-slate-50/50 transition-all cursor-default border-b border-slate-50">
                      <td className="px-6 py-4">
                        <p className="text-xs font-black text-slate-900 uppercase">{s.name}</p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-xs font-black text-slate-900 tabular">{s.leads}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-xs font-black text-slate-900 tabular">{s.followUp}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-xs font-black text-blue-600 tabular">{parseFloat(s.crSample).toFixed(1)}%</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-xs font-black text-blue-600 tabular">{parseFloat(s.crDeal).toFixed(1)}%</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-xs font-black text-slate-900 tabular">{s.clsSample}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-xs font-black text-slate-900 tabular">{Math.round(s.clsNewClient / 1_000_000)} JT</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-xs font-black text-slate-900 tabular">{Math.round(s.clsRO / 1_000_000)} JT</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-xs font-black text-slate-900 tabular">Rp {(s.actualRevenue / 1_000_000).toFixed(2)}M</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={s.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </TableWrapper>
        </div>

        {/* LOST & CHURN */}
        <div className="xl:col-span-3 space-y-4">
          <SectionLabel>3. LOST & CHURN TABLE</SectionLabel>
          <div className="rounded-2xl border border-rose-200/50 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between">
              <span className="text-[9px] font-black text-rose-600 uppercase">BRAND / BD</span>
              <span className="text-[9px] font-black text-rose-600 uppercase">LOST VALUE</span>
            </div>
            <div className="divide-y divide-slate-100 bg-white">
              {(lostData || []).map((l: any, i: number) => (
                <div key={i} className="px-6 py-4 flex justify-between items-center group hover:bg-rose-50/10 transition-all cursor-default border-b border-slate-50 last:border-none">
                  <div className="space-y-0.5">
                    <p className="text-xs font-black text-slate-900 uppercase group-hover:text-rose-600 transition-colors">{l.brand}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{l.reason} ({l.bd})</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-rose-600 tabular tracking-tighter">Rp {l.lostValue >= 1_000_000 ? `${(l.lostValue / 1_000_000).toFixed(0)}Jt` : l.lostValue.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 📑 IV. PIPELINE MATRIX */}
      <div className="space-y-4">
        <SectionLabel>4. GRANULAR PIPELINE MATRIX</SectionLabel>
        <GranularPipelineTable
          data={granularData}
          onAction={(lead) => {
            setSelectedLead(lead);
            setIsActionModalOpen(true);
          }}
        />
      </div>

      {/* 📊 V. LIVE OPERATIONS */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-12 space-y-4">
          <SectionLabel>5. LIVE OPERATIONS STREAM</SectionLabel>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <BusDevActivityStream />
          </div>
        </div>
      </div>

      <StageConfirmDialog isOpen={isActionModalOpen} onOpenChange={setIsActionModalOpen} lead={selectedLead} targetStage="" />
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    "MELAMPAUI TARGET": "badge-success text-emerald-600 bg-emerald-50 border border-emerald-100",
    "SESUAI TARGET": "badge-warning text-amber-600 bg-amber-50 border border-amber-100",
    "BAWAH TARGET": "badge-critical text-rose-600 bg-rose-50 border border-rose-100"
  };
  return (
    <span className={cn("font-black text-[8px] uppercase py-1 px-2.5 rounded-lg shadow-sm border", styles[status])}>
      {status}
    </span>
  );
}

