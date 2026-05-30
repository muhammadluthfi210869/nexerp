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

  const { data: dashboard } = useQuery({
    queryKey: ["dashboardAnalytics"],
    queryFn: async () => (await api.get("/bussdev/dashboard")).data,
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
                  {[
                    { name: "Andi Pratama", leads: 450, fu: 1240, crSmpl: 26, crDeal: 18, clsSmpl: 117, clsNew: 81, clsRo: 42, rev: "3.24M", status: "MELAMPAUI TARGET" },
                    { name: "Citra Kirana", leads: 320, fu: 980, crSmpl: 29, crDeal: 15, clsSmpl: 92, clsNew: 48, clsRo: 28, rev: "2.15M", status: "SESUAI TARGET" },
                    { name: "Budi Santoso", leads: 180, fu: 420, crSmpl: 12, crDeal: 8, clsSmpl: 22, clsNew: 14, clsRo: 5, rev: "0.85M", status: "BAWAH TARGET" },
                  ].map((staff) => (
                    <tr key={staff.name} className="group hover:bg-slate-50/50 transition-all cursor-default border-b border-slate-50">
                      <td className="px-6 py-4">
                        <p className="text-xs font-black text-slate-900 uppercase">{staff.name}</p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-xs font-black text-slate-900 tabular">{staff.leads}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-xs font-black text-slate-900 tabular">{staff.fu}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-xs font-black text-blue-600 tabular">{staff.crSmpl}%</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-xs font-black text-blue-600 tabular">{staff.crDeal}%</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-xs font-black text-slate-900 tabular">{staff.clsSmpl}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-xs font-black text-slate-900 tabular">{staff.clsNew} JT</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-xs font-black text-slate-900 tabular">{staff.clsRo} JT</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-xs font-black text-slate-900 tabular">Rp {staff.rev}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={staff.status} />
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
              {[
                { brand: "Nature Glow", reason: "Price", bd: "Andi P.", val: "250Jt" },
                { brand: "Zen Skin", reason: "Sample", bd: "Budi S.", val: "120Jt" },
                { brand: "Aqua Pure", reason: "Ghosting", bd: "Andi P.", val: "450Jt" },
              ].map((l, i) => (
                <div key={i} className="px-6 py-4 flex justify-between items-center group hover:bg-rose-50/10 transition-all cursor-default border-b border-slate-50 last:border-none">
                  <div className="space-y-0.5">
                    <p className="text-xs font-black text-slate-900 uppercase group-hover:text-rose-600 transition-colors">{l.brand}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{l.reason} ({l.bd})</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-rose-600 tabular tracking-tighter">Rp {l.val}</p>
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

