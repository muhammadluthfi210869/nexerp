"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { Card } from "@/components/ui/card";
import { DashboardShell } from "@/components/layout/DashboardShell";

const FALLBACK_PIPELINE = [
  { id: 'RD-9001', brand: 'Glow Up Clinic', prod: 'Serum Vitamin C 15%', cat: 'SKINCARE', stage: 4, rev: 1, stab: 'PASSED', time: '4.2d', status: 'IN_REVIEW' },
  { id: 'RD-9005', brand: 'Brand Aesthetic X', prod: 'Hydrating Toner', cat: 'SKINCARE', stage: 2, rev: 0, stab: 'TESTING', time: '1.5d', status: 'FORMULATING' },
  { id: 'RD-8998', brand: 'Sun & Skin Co.', prod: 'Sunscreen SPF 50', cat: 'SUNCARE', stage: 5, rev: 2, stab: 'PASSED', time: '12.8d', status: 'APPROVED' },
  { id: 'RD-9012', brand: 'Indo Care', prod: 'Moisturizer Gel', cat: 'BODYCARE', stage: 1, rev: 0, stab: 'PENDING', time: '0.5d', status: 'QUEUE' },
];

const FALLBACK_PIC = [
  { name: 'Dr. Sarah', output: '12 / 10', eff: '92% OT', avg: '3.5d', quality: '85%', qualNote: 'FIRST-TIME', util: '95%' },
  { name: 'Irfan J.', output: '8 / 6', eff: '75% OT', avg: '5.2d', quality: '68%', qualNote: 'FIRST-TIME', util: '88%' },
  { name: 'Maya T.', output: '10 / 9', eff: '88% OT', avg: '4.1d', quality: '75%', qualNote: 'FIRST-TIME', util: '92%' },
];

const FALLBACK_FAILURES = [
  { prod: 'Aqua Serum', stage: 'TESTING', reason: 'Instability', pic: 'Irfan' },
  { prod: 'Cleanser Gel', stage: 'APPROVAL', reason: 'Color Change', pic: 'Maya' },
  { prod: 'Lip Balm V2', stage: 'DEVELOPMENT', reason: 'Odor Issue', pic: 'Irfan' },
];

export default function RndExecutiveDashboard() {
  const metricsQuery = useQuery({
    queryKey: ["rnd-metrics"],
    queryFn: async () => {
      const res = await api.get("/rnd/dashboard");
      return res.data?.data || res.data;
    },
    refetchInterval: 30000,
  });

  const metrics = metricsQuery.data;

  const pipelineRows = useMemo(() => {
    const raw = metrics?.tables?.pipelineMaster;
    if (!raw || raw.length === 0) return FALLBACK_PIPELINE;
    return raw.map((r: any) => ({
      id: r.id,
      brand: r.brand || 'Generic',
      prod: r.product || '—',
      cat: 'SKINCARE',
      stage: r.stage,
      rev: parseInt(r.revisions) || 0,
      stab: 'N/A',
      time: (r.totalTime || '').replace('Total: ', '').replace(' Days', 'd') || '—',
      status: r.status,
    }));
  }, [metrics]);

  const picRows = useMemo(() => {
    const raw = metrics?.tables?.performanceEvaluation;
    if (!raw || raw.length === 0) return FALLBACK_PIC;
    return raw.map((r: any) => ({
      name: r.picName,
      output: r.output,
      eff: r.efficiency,
      avg: (r.efficiency || '').replace('% OT', '') + 'd',
      quality: r.quality,
      qualNote: 'FIRST-TIME',
      util: r.utilization,
    }));
  }, [metrics]);

  const failureRows = useMemo(() => {
    const raw = metrics?.tables?.failureLogs;
    if (!raw || raw.length === 0) return FALLBACK_FAILURES;
    return raw.map((r: any) => ({
      prod: r.productName,
      stage: r.stage,
      reason: r.reason,
      pic: r.picName,
    }));
  }, [metrics]);

  if (metricsQuery.isLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
       <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Syncing Intelligence...</p>
    </div>
  );

  return (
    <DashboardShell title="R&D Intelligence Center">
      
      {/* 🚀 I. EXECUTIVE R&D AUDIT (ULTRA-COMPACT) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        
        {/* 🔴 A. TIMELINESS */}
        <Card className="rounded-xl p-4 border border-slate-100 shadow-sm bg-white flex flex-col justify-between min-h-[180px]">
          <div className="flex items-center gap-2 mb-2">
             <p className="text-[10px] font-black text-brand-black uppercase tracking-widest italic">A. TIMELINESS</p>
          </div>
          <div className="bg-slate-50/50 rounded-lg p-2.5 flex flex-col items-center justify-center mb-2">
             <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">ON-TIME SAMPLE RATE</p>
             <p className="text-2xl font-black text-emerald-500 tabular tracking-tighter leading-none">{metrics?.timeliness?.onTimeRate ?? 85.4}%</p>
          </div>
          <div className="flex justify-between items-end border-t border-slate-50 pt-1.5">
             <div>
                <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest leading-none">AVG CYCLE</p>
                <p className="text-[11px] font-black text-brand-black uppercase">{metrics?.timeliness?.avgCycleTime ?? 4.2} <span className="text-[7px] text-slate-400">DAYS</span></p>
             </div>
             <div className="text-right">
                <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest leading-none">OVERDUE</p>
                <p className="text-[11px] font-black text-rose-500 uppercase">{metrics?.timeliness?.overdueCount ?? 3} <span className="text-[7px]">SAMPLES</span></p>
             </div>
          </div>
        </Card>

        {/* 🟠 B. ACCURACY */}
        <Card className="rounded-xl p-4 border border-slate-100 shadow-sm bg-white flex flex-col justify-between min-h-[180px]">
          <div className="flex items-center gap-2 mb-2">
             <p className="text-[10px] font-black text-brand-black uppercase tracking-widest italic">B. ACCURACY</p>
          </div>
          <div className="bg-slate-50/50 rounded-lg p-2.5 flex flex-col items-center justify-center mb-2">
             <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">FIRST-TIME APPROVAL</p>
             <p className="text-2xl font-black text-blue-600 tabular tracking-tighter leading-none">{metrics?.accuracy?.firstTimeApprovalRate ?? 72.1}%</p>
          </div>
          <div className="flex justify-between items-end border-t border-slate-50 pt-1.5">
             <div>
                <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest leading-none">AVG REVISION</p>
                <p className="text-[11px] font-black text-brand-black uppercase">{metrics?.accuracy?.avgRevision ?? 1.4} <span className="text-[7px] text-slate-400">x</span></p>
             </div>
             <div className="text-right">
                <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest leading-none">FAILED</p>
                <p className="text-[11px] font-black text-rose-500 uppercase">{metrics?.accuracy?.failedItemsCount ?? 5} <span className="text-[7px]">ITEMS</span></p>
             </div>
          </div>
        </Card>

        {/* 🟡 C. APPROVAL PERFORMANCE */}
        <Card className="rounded-xl p-4 border border-slate-100 shadow-sm bg-white flex flex-col justify-between min-h-[180px]">
          <div className="flex items-center gap-2 mb-1">
             <p className="text-[10px] font-black text-brand-black uppercase tracking-widest italic">C. APPROVAL PERFORMANCE</p>
          </div>
          <div className="flex flex-col items-center justify-center flex-1 py-1">
             <p className="text-2xl font-black text-brand-black tabular tracking-tighter leading-none">{metrics?.approval?.overallRate ?? 84.4}%</p>
             <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-0.5">OVERALL APPROVAL RATE</p>
          </div>
          <div className="bg-amber-50/50 border border-amber-100/50 rounded-lg p-2 flex justify-between items-center">
             <div className="text-center flex-1 border-r border-amber-100/50">
                <p className="text-[7px] font-black text-amber-600 uppercase">SUBMITTED</p>
                <p className="text-sm font-black text-brand-black tabular leading-none">{metrics?.approval?.submitted ?? 45}</p>
             </div>
             <div className="text-center flex-1">
                 <p className="text-[7px] font-black text-amber-600 uppercase">APPROVED</p>
                 <p className="text-sm font-black text-brand-black tabular leading-none">{metrics?.approval?.approved ?? 38}</p>
             </div>
          </div>
        </Card>

        {/* 🔵 D. R&D PERFORMANCE */}
        <Card className="rounded-xl p-4 border border-slate-100 shadow-sm bg-white flex flex-col justify-between min-h-[180px]">
          <div className="flex items-center gap-2 mb-2">
             <p className="text-[10px] font-black text-brand-black uppercase tracking-widest italic">D. R&D PERFORMANCE</p>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
             <div className="bg-blue-50 rounded-lg p-2">
                <p className="text-[6px] font-black text-blue-600 uppercase mb-0.5">ACTIVE PRKT</p>
                 <p className="text-base font-black text-brand-black tabular leading-none">{metrics?.performance?.activeProjects ?? 12}</p>
             </div>
             <div className="bg-emerald-50 rounded-lg p-2">
                <p className="text-[6px] font-black text-emerald-600 uppercase mb-0.5">COMPLETED</p>
                 <p className="text-base font-black text-brand-black tabular leading-none">{metrics?.performance?.completedProjects ?? 28}</p>
             </div>
          </div>
          <div className="space-y-1">
             <div className="flex justify-between items-center">
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">UTILIZATION RATE</p>
                 <p className="text-[8px] font-black text-brand-black leading-none">{metrics?.performance?.utilizationRate ?? 92}%</p>
             </div>
             <div className="h-1 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${metrics?.performance?.utilizationRate ?? 92}%` }} />
             </div>
          </div>
        </Card>
      </div>

      {/* 1. R&D PIPELINE MASTER (FLOW VELOCITY) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
           <div className="w-1 h-4 bg-rose-500 rounded-full" />
           <h3 className="text-[12px] font-black uppercase tracking-widest text-brand-black italic">1. R&D PIPELINE MASTER (FLOW VELOCITY)</h3>
        </div>
        <Card className="rounded-xl overflow-hidden border border-slate-100 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1600px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase">RND ID / BRAND</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase">PRODUCT NAME / CATEGORY</th>
                  <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase">STAGE PROGRESSION</th>
                  <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase">ACCURACY (REV)</th>
                  <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase">STABILITY</th>
                  <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase">CYCLE TIME</th>
                  <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {pipelineRows.map((row: any, i: number) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-5">
                      <p className="text-[13px] font-black text-brand-black">#{row.id}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{row.brand}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-[12px] font-black text-brand-black uppercase">{row.prod}</p>
                      <p className="text-[9px] font-bold text-slate-400">{row.cat}</p>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <StageVisual progress={row.stage.toString()} />
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={cn(
                        "text-sm font-black",
                        row.rev === 0 ? "text-emerald-500" : (row.rev < 2 ? "text-amber-500" : "text-rose-500")
                      )}>{row.rev}x</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <span className={cn(
                         "px-2 py-0.5 rounded text-[8px] font-black text-white",
                         row.stab === 'PASSED' ? 'bg-emerald-500' : (row.stab === 'TESTING' ? 'bg-blue-500' : 'bg-slate-500')
                       )}>{row.stab}</span>
                    </td>
                    <td className="px-6 py-5 text-right text-sm font-black tabular text-brand-black">{row.time}</td>
                    <td className="px-6 py-5 text-center">
                      <span className={cn(
                        "px-3 py-1 rounded-md text-[9px] font-black text-white",
                        row.status === 'APPROVED' ? 'bg-emerald-500' : 'bg-brand-black'
                      )}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* 📊 2. PIC PERFORMANCE EVALUATION & ⚠️ 3. FAILURE / REJECT LOG (PARITY DESIGN) */}
      <div className="flex flex-col xl:flex-row gap-8 items-start">
        
        {/* 2. PIC PERFORMANCE EVALUATION */}
        <div className="flex-1 w-full space-y-4">
           <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-slate-900 rounded-full" />
              <h3 className="text-sm font-black uppercase tracking-widest text-brand-black italic">2. PIC PERFORMANCE EVALUATION</h3>
           </div>
           <Card className="rounded-[2.5rem] border border-slate-100 shadow-sm bg-white overflow-hidden p-6">
              <div className="overflow-x-auto">
                 <table className="w-full">
                    <thead>
                       <tr className="border-b border-slate-50">
                          <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">PIC NAME / PERIOD</th>
                          <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">OUTPUT (COMP/APP)</th>
                          <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">EFFICIENCY</th>
                          <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">QUALITY</th>
                          <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">UTILIZATION</th>
                       </tr>
                    </thead>
                    <tbody>
                        {picRows.map((row: any, i: number) => (
                          <tr key={i} className={cn("hover:bg-slate-50/50 transition-colors", i < 2 && "border-b border-slate-50")}>
                             <td className="px-6 py-6">
                                <p className="text-[13px] font-black text-brand-black uppercase tracking-tight">{row.name}</p>
                             </td>
                             <td className="px-6 py-6 text-center">
                                <p className="text-[14px] font-black text-brand-black tabular">{row.output}</p>
                             </td>
                             <td className="px-6 py-6 text-center">
                                <p className="text-[12px] font-black text-emerald-600 uppercase tracking-tighter">{row.eff}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase">Avg: {row.avg}</p>
                             </td>
                             <td className="px-6 py-6 text-center">
                                <p className="text-[12px] font-black text-blue-600 uppercase tracking-tighter">{row.quality}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase">{row.qualNote}</p>
                             </td>
                             <td className="px-6 py-6 text-right">
                                <p className="text-[14px] font-black text-brand-black tabular">{row.util}</p>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </Card>
        </div>

        {/* 3. FAILURE / REJECT LOG */}
        <div className="w-full xl:w-[450px] space-y-4">
           <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-rose-500 rounded-full" />
              <h3 className="text-sm font-black uppercase tracking-widest text-brand-black italic text-rose-600">3. FAILURE / REJECT LOG</h3>
           </div>
           <Card className="rounded-[2.5rem] border border-rose-100 shadow-sm bg-rose-50/30 overflow-hidden p-6">
              <div className="flex justify-between items-center mb-6 border-b border-rose-100 pb-4">
                 <p className="text-[10px] font-black text-rose-800 uppercase tracking-widest">PRODUCT / STAGE</p>
                 <p className="text-[10px] font-black text-rose-800 uppercase tracking-widest">REASON</p>
              </div>
              <div className="space-y-6">
                  {failureRows.map((row: any, i: number) => (
                    <div key={i} className="flex justify-between items-start">
                       <div>
                          <p className="text-[13px] font-black text-brand-black tracking-tight">{row.prod}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">STAGE: {row.stage}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[13px] font-black text-rose-500 tracking-tight">{row.reason}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">PIC: {row.pic}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

function StageVisual({ progress }: { progress: string }) {
  const stages = ["QUEUE", "FORMULA", "LAB", "SHIP", "REVIEW", "DONE"];
  let currentIndex = 0;
  if (progress === 'QUEUE') currentIndex = 0;
  else if (progress === 'FORMULATING') currentIndex = 1;
  else if (progress === 'LAB_TEST') currentIndex = 2;
  else if (progress === 'READY_TO_SHIP' || progress === 'SHIPPED' || progress === 'RECEIVED') currentIndex = 3;
  else if (progress === 'CLIENT_REVIEW' || progress === 'REVISION_QUEUE') currentIndex = 4;
  else if (progress === 'APPROVED') currentIndex = 5;
  else currentIndex = 0;

  return (
    <div className="flex flex-col items-center gap-1 w-full max-w-[140px] mx-auto">
      <div className="flex gap-0.5 w-full">
        {stages.map((_, i) => (
          <div key={i} className={cn("h-1 flex-1 rounded-full transition-all", i <= currentIndex ? "bg-primary shadow-[0_0_8px_rgba(37,99,235,0.3)]" : "bg-slate-100")} />
        ))}
      </div>
      <div className="flex justify-between w-full">
        <span className="text-[6px] font-bold text-slate-400 uppercase">{stages[0]}</span>
        <span className="text-[6px] font-bold text-primary uppercase tracking-tight">{stages[currentIndex]}</span>
        <span className="text-[6px] font-bold text-slate-400 uppercase">{stages[5]}</span>
      </div>
    </div>
  );
}

