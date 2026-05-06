"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Zap, Activity, Target, DollarSign, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { DashboardCards } from "@/components/bussdev/DashboardCards";
import { BussdevActionDialog } from "@/components/bussdev/BussdevActionDialog";
import { GranularPipelineTable } from "@/components/bussdev/GranularPipelineTable";
import { useGranularData } from "@/hooks/use-granular-data";
import { usePerformanceAudit } from "@/hooks/usePerformanceAudit";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { SectionDivider } from "@/components/layout/SectionDivider";
import { DataTable, DataTableHead, DataTableTh, DataTableBody, DataTableRow, DataTableCell } from "@/components/layout/DataTable";
import { LiveStatusBadge } from "@/components/layout/LiveStatusBadge";
import { BusDevActivityStream } from "@/components/dashboard/BusDevActivityStream";

export default function BussdevDashboardClient({ initialDashboard, initialGranular }: any) {
  usePerformanceAudit("Bussdev Dashboard");
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const { data: granularData } = useGranularData();

  const { data: dashboard } = useQuery({ 
    queryKey: ["dashboardAnalytics"], 
    queryFn: async () => (await api.get("/bussdev/dashboard")).data,
    initialData: initialDashboard,
    refetchInterval: 10000 
  });

  const perfData = [
    { name: "Andi Pratama", leads: 450, fu: 1240, crSmpl: 26, crDeal: 18, clsSmpl: 117, clsNew: 81, clsRo: 42, rev: "3.24M", status: "MELAMPAUI TARGET" },
    { name: "Citra Kirana", leads: 320, fu: 980, crSmpl: 29, crDeal: 15, clsSmpl: 92, clsNew: 48, clsRo: 28, rev: "2.15M", status: "SESUAI TARGET" },
    { name: "Budi Santoso", leads: 180, fu: 420, crSmpl: 12, crDeal: 8, clsSmpl: 22, clsNew: 14, clsRo: 5, rev: "0.85M", status: "BAWAH TARGET" },
  ];
  const lostData = dashboard?.lostChurn;

  return (
    <div className="space-y-8">
      {/* 🚀 I. BUSINESS DEVELOPMENT COMMAND HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">SALES INTELLIGENCE ACTIVE</span>
           </div>
           <h1 className="text-4xl font-black text-brand-black tracking-tighter uppercase italic leading-none">
             DIVISI PENGEMBANGAN <span className="text-slate-300">BISNIS</span>
           </h1>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">(Pusat Komando Pertumbuhan)</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="text-right hidden md:block">
              <p className="text-[10px] font-black text-brand-black uppercase tracking-widest">PIPELINE VELOCITY</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">OPTIMIZED PERFORMANCE</p>
           </div>
           <div className="flex items-center gap-2 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-[10px] font-black text-brand-black uppercase">LIVE SYNC</span>
           </div>
        </div>
      </div>
      <DashboardCards variant="dashboard" data={dashboard} />

      {/* 📊 II & III. PERFORMANCE & CHURN MATRIX */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* BD PERFORMANCE EVALUATION */}
        <div className="xl:col-span-9 space-y-4">
          <div className="flex items-center gap-2">
             <h3 className="text-sm font-black uppercase tracking-widest text-brand-black italic">2. BD PERFORMANCE EVALUATION</h3>
          </div>
          <div className="bento-card overflow-hidden bg-white border border-slate-100 rounded-2xl shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">BD NAME</th>
                    <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">LEADS</th>
                    <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">FOLLOW UP</th>
                    <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">CR SAMPLE</th>
                    <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">CR DEAL</th>
                    <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">CLS SAMPLE</th>
                    <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">CLS NEW CLIENT</th>
                    <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">CLS RO</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">ACTUAL REVENUE</th>
                    <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { name: "Andi Pratama", leads: 450, fu: 1240, crSmpl: 26, crDeal: 18, clsSmpl: 117, clsNew: 81, clsRo: 42, rev: "3.24M", status: "MELAMPAUI TARGET" },
                    { name: "Citra Kirana", leads: 320, fu: 980, crSmpl: 29, crDeal: 15, clsSmpl: 92, clsNew: 48, clsRo: 28, rev: "2.15M", status: "SESUAI TARGET" },
                    { name: "Budi Santoso", leads: 180, fu: 420, crSmpl: 12, crDeal: 8, clsSmpl: 22, clsNew: 14, clsRo: 5, rev: "0.85M", status: "BAWAH TARGET" },
                  ].map((staff) => (
                    <tr key={staff.name} className="group hover:bg-slate-50/50 transition-all cursor-default">
                      <td className="px-6 py-5">
                        <p className="text-[12px] font-black text-brand-black uppercase italic">{staff.name}</p>
                      </td>
                      <td className="px-4 py-5 text-center">
                        <span className="text-[12px] font-black text-slate-900 tabular">{staff.leads}</span>
                      </td>
                      <td className="px-4 py-5 text-center">
                        <span className="text-[12px] font-black text-slate-900 tabular">{staff.fu}</span>
                      </td>
                      <td className="px-4 py-5 text-center">
                        <span className="text-[12px] font-black text-blue-600 tabular">{staff.crSmpl}%</span>
                      </td>
                      <td className="px-4 py-5 text-center">
                        <span className="text-[12px] font-black text-blue-600 tabular">{staff.crDeal}%</span>
                      </td>
                      <td className="px-4 py-5 text-center">
                        <span className="text-[12px] font-black text-slate-900 tabular">{staff.clsSmpl}</span>
                      </td>
                      <td className="px-4 py-5 text-center">
                        <span className="text-[12px] font-black text-slate-900 tabular">{staff.clsNew} JT</span>
                      </td>
                      <td className="px-4 py-5 text-center">
                        <span className="text-[12px] font-black text-slate-900 tabular">{staff.clsRo} JT</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <p className="text-[12px] font-black text-brand-black tabular">Rp {staff.rev}</p>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <StatusBadge status={staff.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* LOST & CHURN */}
        <div className="xl:col-span-3 space-y-4">
          <div className="flex items-center gap-2">
             <h3 className="text-sm font-black uppercase tracking-widest text-brand-black italic">3. LOST & CHURN TABLE</h3>
          </div>
          <div className="bento-card overflow-hidden bg-rose-50/20 border border-rose-100/50 rounded-2xl shadow-sm">
            <div className="px-6 py-4 bg-white/50 border-b border-rose-100/30 flex justify-between">
               <span className="text-[9px] font-black text-rose-600 uppercase">BRAND / BD</span>
               <span className="text-[9px] font-black text-rose-600 uppercase">LOST VALUE</span>
            </div>
            <div className="divide-y divide-rose-100/30 bg-white/30">
              {[
                { brand: "Nature Glow", reason: "Price", bd: "Andi P.", val: "250Jt" },
                { brand: "Zen Skin", reason: "Sample", bd: "Budi S.", val: "120Jt" },
                { brand: "Aqua Pure", reason: "Ghosting", bd: "Andi P.", val: "450Jt" },
              ].map((l, i) => (
                <div key={i} className="px-6 py-5 flex justify-between items-center group hover:bg-rose-100/50 transition-all cursor-default">
                  <div className="space-y-0.5">
                    <p className="text-[12px] font-black text-brand-black uppercase italic group-hover:text-rose-600 transition-colors">{l.brand}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{l.reason} ({l.bd})</p>
                  </div>
                  <div className="text-right">
                     <p className="text-[12px] font-black text-rose-600 tabular tracking-tighter">Rp {l.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 📑 IV. PIPELINE MATRIX */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
           <h3 className="text-sm font-black uppercase tracking-widest text-brand-black italic">4. GRANULAR PIPELINE MATRIX</h3>
        </div>
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
          <div className="flex items-center gap-2">
             <h3 className="text-sm font-black uppercase tracking-widest text-brand-black italic">5. LIVE OPERATIONS STREAM</h3>
          </div>
          <div className="bento-card bg-white p-4 border border-slate-100 rounded-2xl shadow-sm">
             <BusDevActivityStream />
          </div>
        </div>
      </div>

      <BussdevActionDialog 
        isOpen={isActionModalOpen}
        onOpenChange={setIsActionModalOpen}
        lead={selectedLead}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    "MELAMPAUI TARGET": "bg-emerald-500 text-white",
    "SESUAI TARGET": "bg-brand-black text-white",
    "BAWAH TARGET": "bg-rose-500 text-white"
  };
  return (
    <Badge className={cn("border-none font-black text-[8px] uppercase py-0.5 px-2.5 shadow-sm", styles[status])}>
      {status}
    </Badge>
  );
}

