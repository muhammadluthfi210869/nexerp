"use client";

import React from "react";
import { 
  Settings, 
  Activity, 
  ShieldCheck, 
  Clock, 
  TrendingUp, 
  Zap,
  AlertTriangle,
  Target,
  Timer,
  Cpu,
  Trophy
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ProductionDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["prodDashboard"],
    queryFn: async () => (await api.get("/production/dashboard")).data,
  });

  if (isLoading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Clock className="w-12 h-12 text-amber-500 animate-spin" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-tight italic">Loading Production Command Center...</p>
        </div>
      </div>
    );
  }

  const cards = data?.cards;
  const workshops = data?.workshops;
  const workshopsDetail = data?.workshops_detail;
  const precisionTracking = data?.precisionTracking || [];
  const anomalies = data?.anomalies || [];

  return (
    <div className="p-6 bg-[#fafafa] min-h-screen space-y-6">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-black text-brand-black tracking-tighter uppercase italic leading-none flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary animate-spin-slow" />
            PRODUCTION <span className="text-primary">COMMAND CENTER</span>
          </h1>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">
            Institutional Audit • v3.0 • Real-Time Forge Orchestration
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl border-slate-200 text-brand-black font-black text-[10px] h-10 uppercase px-6 shadow-sm">
            EXPORT AUDIT
          </Button>
          <Button className="rounded-xl bg-primary hover:bg-orange-600 text-white font-black text-[10px] h-10 uppercase px-6 shadow-lg shadow-primary/20">
            SYNC ENGINE
          </Button>
        </div>
      </div>

      {/* I. EXECUTIVE CARDS - 5 COLUMN RECTANGULAR */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        
        {/* A. OUTPUT & ACHIEVEMENT */}
        <Card className="rounded-[1.5rem] p-4 border border-slate-100 shadow-sm bg-white flex flex-col justify-between h-[210px]">
           <div className="flex items-center gap-1.5">
              <Trophy className="w-3 h-3 text-blue-500" />
              <p className="text-[8.5px] font-black text-brand-black uppercase tracking-tighter italic leading-none">A. OUTPUT & ACHIEVEMENT</p>
           </div>
           
           <div className="text-center mt-2">
              <h2 className="text-[32px] font-black text-brand-black tracking-tighter tabular leading-none">{cards?.achievement?.rate ?? 0}%</h2>
              <p className="text-[7px] font-black text-blue-600 uppercase tracking-widest mt-1 leading-none">ACHIEVEMENT RATE</p>
           </div>

           <div className="space-y-1.5 mt-auto">
              <div className="flex justify-between items-center text-[9px] font-black tabular">
                 <span className="text-slate-400 font-bold text-[7px] uppercase">PLANNED</span>
                 <span className="text-brand-black">{(cards?.achievement?.planned ?? 0).toLocaleString()} Units</span>
              </div>
              <div className="flex justify-between items-center text-[9px] font-black tabular">
                 <span className="text-slate-400 font-bold text-[7px] uppercase">ACTUAL</span>
                 <span className="text-emerald-500">{(cards?.achievement?.actual ?? 0).toLocaleString()} Units</span>
              </div>
              <div className="mt-1 bg-slate-50 p-1.5 rounded-lg border border-slate-100 flex justify-between items-center">
                 <span className="text-[7px] font-black text-slate-400 uppercase">COMPLETED ORDERS</span>
                 <span className="text-[9px] font-black text-brand-black tabular">{cards?.achievement?.completedOrders ?? 0} / {cards?.achievement?.totalOrders ?? 0}</span>
              </div>
           </div>
        </Card>

        {/* B. TIMELINESS AUDIT */}
        <Card className="rounded-[1.5rem] p-4 border border-slate-100 shadow-sm bg-white flex flex-col justify-between h-[210px]">
           <div className="flex items-center gap-1.5">
              <Timer className="w-3 h-3 text-amber-500" />
              <p className="text-[8.5px] font-black text-brand-black uppercase tracking-tighter italic leading-none">B. TIMELINESS AUDIT</p>
           </div>
           
           <div className="mt-2">
              <div className="flex justify-between items-end mb-1">
                 <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">ON-TIME RATE</p>
                 <span className="text-[14px] font-black text-amber-500 tabular leading-none">{cards?.timeliness?.rate ?? 0}%</span>
              </div>
              <div className="h-1 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                 <div className="h-full bg-amber-500" style={{ width: `${cards?.timeliness?.rate ?? 0}%` }} />
              </div>
           </div>

           <div className="grid grid-cols-2 gap-2 mt-auto">
              <div className="bg-rose-50 p-2 rounded-xl border border-rose-100 flex flex-col">
                 <span className="text-[6px] font-black text-rose-500 uppercase leading-none">DELAYED</span>
                 <span className="text-[12px] font-black text-rose-600 tabular mt-1">{cards?.timeliness?.delayed ?? 0}</span>
              </div>
              <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100 flex flex-col">
                 <span className="text-[6px] font-black text-emerald-500 uppercase leading-none">AVG CYCLE</span>
                 <span className="text-[12px] font-black text-emerald-600 tabular mt-1">{cards?.timeliness?.avgCycle ?? '0'}</span>
              </div>
           </div>
        </Card>

        {/* C. RESOURCE EFFICIENCY */}
        <Card className="rounded-[1.5rem] p-4 border border-slate-100 shadow-sm bg-white flex flex-col justify-between h-[210px]">
           <div className="flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-indigo-500" />
              <p className="text-[8.5px] font-black text-brand-black uppercase tracking-tighter italic leading-none">C. RESOURCE EFFICIENCY</p>
           </div>
           
           <div className="space-y-2.5 mt-2">
              <div className="flex justify-between items-center text-[10px] font-black tabular">
                 <span className="text-slate-400 font-bold text-[7px] uppercase">MACHINE UTIL.</span>
                 <span className="text-indigo-500">{cards?.efficiency?.utilization ?? 0}%</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black tabular">
                 <span className="text-slate-400 font-bold text-[7px] uppercase">LABOR PROD.</span>
                 <span className="text-emerald-500">{cards?.efficiency?.labor ?? 0}%</span>
              </div>
           </div>

           <div className="mt-auto bg-amber-50/50 p-2.5 rounded-2xl border border-amber-100/50">
              <p className="text-[6.5px] font-black text-amber-600 uppercase tracking-widest leading-none mb-1">DOWNTIME (MTD)</p>
              <h4 className="text-[18px] font-black text-brand-black tabular leading-none">{cards?.efficiency?.downtime ?? '0h'}</h4>
           </div>
        </Card>

        {/* D. QUALITY CONTROL */}
        <Card className="rounded-[1.5rem] p-4 border border-slate-100 shadow-sm bg-white flex flex-col justify-between h-[210px]">
           <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <p className="text-[8.5px] font-black text-brand-black uppercase tracking-tighter italic leading-none">D. QUALITY CONTROL</p>
           </div>
           
           <div className="flex justify-between items-start mt-2">
              <div>
                 <p className="text-[7px] font-black text-slate-400 uppercase leading-none">GOOD UNITS</p>
                 <h2 className="text-[22px] font-black text-emerald-500 tracking-tighter tabular leading-none mt-1">{(cards?.quality?.goodUnits ?? 0).toLocaleString()}</h2>
              </div>
              <div className="text-right">
                 <p className="text-[7px] font-black text-slate-400 uppercase leading-none">DEFECT RATE</p>
                 <span className="text-[16px] font-black text-rose-500 tabular leading-none mt-1">{cards?.quality?.defectRate ?? 0}%</span>
              </div>
           </div>

           <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden mt-2 border border-slate-100">
              <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, 100 - (cards?.quality?.defectRate ?? 0))}%` }} />
           </div>

           <div className="mt-auto pt-2 border-t border-slate-50 flex justify-between items-center">
              <span className="text-[7px] font-black text-slate-400 uppercase">REWORK COUNT</span>
              <span className="text-[10px] font-black text-brand-black tabular">{(cards?.quality?.reworkCount ?? 0).toLocaleString()} Pcs</span>
           </div>
        </Card>

        {/* E. CRITICAL ALERTS */}
        <Card className="rounded-[1.5rem] p-4 border border-rose-100 shadow-sm bg-rose-50/20 flex flex-col justify-between h-[210px]">
           <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 text-rose-500 fill-rose-500" />
              <p className="text-[8.5px] font-black text-rose-800 uppercase tracking-tighter italic leading-none">E. CRITICAL ALERTS</p>
           </div>
           
           <div className="space-y-1.5 mt-2">
              <div className="bg-white p-2 rounded-xl border border-rose-100 flex justify-between items-center">
                 <span className="text-[7px] font-black text-rose-500 uppercase">BREAKDOWNS</span>
                 <span className="text-[11px] font-black tabular">{cards?.alerts?.breakdown ?? 0}</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-rose-100 flex justify-between items-center">
                 <span className="text-[7px] font-black text-amber-600 uppercase">SHORTAGES</span>
                 <span className="text-[11px] font-black tabular">{cards?.alerts?.shortages ?? 0}</span>
              </div>
           </div>

           <button className="w-full bg-rose-900 text-white py-2 rounded-lg font-black text-[7.5px] uppercase tracking-tighter leading-tight h-9 mt-auto">
              URGENT ALERT<br/>{(cards?.alerts?.urgent ?? 0)} ANOMALIES DETECTED
           </button>
        </Card>
      </div>

      {/* II. PENYIAPAN BAHAN (WAREHOUSE) */}
      <div className="space-y-3 mt-6">
        <div className="flex justify-between items-center px-1">
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
              <h3 className="text-[13px] font-black uppercase tracking-tighter text-brand-black italic">II. PENYIAPAN BAHAN (FROM WAREHOUSE)</h3>
           </div>
           <Button variant="ghost" className="text-[9px] font-black text-blue-600 uppercase h-6 border border-blue-200 rounded-full px-4">
              MONITORING GUDANG
           </Button>
        </div>

        <Card className="rounded-[1.2rem] overflow-hidden border border-slate-100 shadow-sm bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-3 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">WORK ORDER / PRODUK</th>
                  <th className="px-8 py-3 text-center text-[8px] font-black text-slate-400 uppercase tracking-widest">STATUS PICKING</th>
                  <th className="px-8 py-3 text-center text-[8px] font-black text-slate-400 uppercase tracking-widest">KELENGKAPAN</th>
                  <th className="px-8 py-3 text-right text-[8px] font-black text-slate-400 uppercase tracking-widest">ESTIMASI KIRIM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {precisionTracking.slice(0, 5).map((row: any, i: number) => (
                  <tr key={i} className="group hover:bg-slate-50/50 transition-all cursor-default">
                    <td className="px-8 py-4">
                      <p className="text-[11px] font-black text-brand-black uppercase tracking-tight">{row.batchId || 'N/A'}</p>
                      <p className="text-[8px] font-bold text-slate-300 uppercase leading-none mt-1">{row.productName || 'Unknown'}</p>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <p className={cn("text-[9px] font-black uppercase tracking-tighter", row.status === 'DEFECT_DETECTED' ? 'text-rose-500' : 'text-emerald-500')}>
                        {row.anomaly === 'DEFECT_DETECTED' ? 'ISSUE' : 'NOMINAL'}
                      </p>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-4 max-w-[200px] mx-auto">
                         <div className="flex-1 h-1 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                            <div 
                              className={cn("h-full transition-all duration-1000", row.anomaly === 'DEFECT_DETECTED' ? "bg-rose-500" : "bg-emerald-500")}
                              style={{ width: `${row.anomaly === 'DEFECT_DETECTED' ? 50 : 100}%` }} 
                            />
                         </div>
                         <span className="text-[10px] font-black text-brand-black tabular w-8 text-right">{row.anomaly === 'DEFECT_DETECTED' ? '50%' : '100%'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <p className={cn("text-[11px] font-black uppercase tracking-tight", row.deadline <= 2 ? 'text-rose-500' : 'text-brand-black')}>
                        {row.deadline > 0 ? `${row.deadline} days left` : 'OVERDUE'}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* III. ALUR MIKRO INTERNAL (DIAGNOSA LANTAI PABRIK) */}
      <div className="space-y-3 mt-6">
        <div className="flex items-center gap-2 ml-1">
           <h3 className="text-[13px] font-black uppercase tracking-tighter text-brand-black italic">III. ALUR MIKRO INTERNAL (DIAGNOSA LANTAI PABRIK)</h3>
        </div>

         <Card className="rounded-[2rem] p-8 border border-slate-100 shadow-sm bg-white overflow-hidden">
            <div className="flex items-center justify-between gap-2">
               {/* STAGE 1: QUEUE */}
               <div className="flex-1 text-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">ANTREAN WO</p>
                  <h4 className="text-[24px] font-black text-brand-black tracking-tighter mt-1 leading-none">{workshops?.queue ?? 0}</h4>
                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-1">BATCHES</p>
               </div>

               {/* ARROW 1 */}
               <div className="flex flex-col items-center gap-1 min-w-[60px]">
                  <span className="text-[7px] font-black text-rose-500 uppercase tracking-tighter italic">IDLE: {workshopsDetail?.[0]?.idleTime || '—'}</span>
                  <TrendingUp className="w-4 h-4 text-rose-400 rotate-90 scale-y-[-1]" />
               </div>

               {/* STAGE 2: MIXING */}
               <div className="flex-1 text-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">MIXING</p>
                  <h4 className="text-[24px] font-black text-brand-black tracking-tighter mt-1 leading-none">{workshops?.mixing ?? 0}</h4>
                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-1">BATCHES</p>
               </div>

               {/* ARROW 2 */}
               <div className="flex flex-col items-center gap-1 min-w-[60px]">
                  <span className="text-[7px] font-black text-slate-300 uppercase tracking-tighter italic">WAIT: {workshopsDetail?.[1]?.waitTime || '—'}</span>
                  <TrendingUp className="w-4 h-4 text-slate-200 rotate-90 scale-y-[-1]" />
               </div>

               {/* STAGE 3: FILLING */}
               <div className="flex-1 text-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">FILLING</p>
                  <h4 className="text-[24px] font-black text-brand-black tracking-tighter mt-1 leading-none">{workshops?.filling ?? 0}</h4>
                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-1">BATCHES</p>
               </div>

               {/* ARROW 3 */}
               <div className="flex flex-col items-center gap-1 min-w-[60px]">
                  <span className="text-[7px] font-black text-rose-500 uppercase tracking-tighter italic">IDLE: {workshopsDetail?.[2]?.idleTime || '—'}</span>
                  <TrendingUp className="w-4 h-4 text-rose-400 rotate-90 scale-y-[-1]" />
               </div>

               {/* STAGE 4: PACKING */}
               <div className="flex-1 text-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">PACKING</p>
                  <h4 className="text-[24px] font-black text-brand-black tracking-tighter mt-1 leading-none">{workshops?.packing ?? 0}</h4>
                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-1">BATCHES</p>
               </div>

               {/* ARROW 4 */}
               <div className="flex flex-col items-center gap-1 min-w-[60px]">
                  <span className="text-[7px] font-black text-slate-300 uppercase tracking-tighter italic">WAIT: {workshopsDetail?.[3]?.waitTime || '—'}</span>
                  <TrendingUp className="w-4 h-4 text-slate-200 rotate-90 scale-y-[-1]" />
               </div>

               {/* STAGE 5: FINISHED GOODS */}
               <div className="flex-1 text-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">FINISHED GOODS</p>
                  <h4 className="text-[24px] font-black text-brand-black tracking-tighter mt-1 leading-none">{(cards?.achievement?.actual ?? 0).toLocaleString()}</h4>
                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-1">PCS</p>
               </div>
            </div>
         </Card>
      </div>
      {/* IV. TABEL AUDIT HASIL PRODUKSI (PRECISION PCS TRACKING) */}
      <div className="space-y-3 mt-6">
        <div className="flex justify-between items-center px-1">
           <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-black uppercase tracking-tighter text-brand-black italic">IV. TABEL AUDIT HASIL PRODUKSI (PRECISION PCS TRACKING)</h3>
           </div>
           <Button variant="ghost" className="text-[9px] font-black text-indigo-600 uppercase h-6 border border-indigo-200 rounded-full px-4 bg-indigo-50/50">
              CHAIN OF CUSTODY
           </Button>
        </div>

        <Card className="rounded-[1.2rem] overflow-hidden border border-slate-100 shadow-sm bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">DEADLINE (H-MINUS)</th>
                  <th className="px-6 py-4 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">PRODUCT ID / NAME</th>
                  <th className="px-6 py-4 text-center text-[8px] font-black text-slate-400 uppercase tracking-widest">CHAIN OF CUSTODY (UNIT FLOW)</th>
                  <th className="px-6 py-4 text-center text-[8px] font-black text-slate-400 uppercase tracking-widest">ANOMALY STATUS</th>
                  <th className="px-6 py-4 text-right text-[8px] font-black text-slate-400 uppercase tracking-widest">STATUS & REASON</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {precisionTracking.map((row: any, i: number) => {
                  const daysLeft = row.deadline;
                  const isDefect = row.anomaly === 'DEFECT_DETECTED';
                  const phaseLabel = (row.status || '').replace('PHASE_', '');
                  const flowParts = (row.unitFlow || '0 >> 0').split('>>');
                  return (
                  <tr key={i} className="group hover:bg-slate-50/50 transition-all cursor-default">
                    <td className="px-6 py-5">
                      <p className="text-[11px] font-black text-brand-black uppercase tabular leading-none">{daysLeft > 0 ? `H-${daysLeft}` : 'OVERDUE'}</p>
                      <p className={cn("text-[8px] font-black uppercase mt-1 leading-none italic", daysLeft > 0 ? 'text-rose-500' : 'text-rose-700')}>
                        {daysLeft > 0 ? `Sisa ${daysLeft} Hari` : '—'}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-[11px] font-black text-brand-black uppercase tracking-tight leading-none">{row.productName || 'Unknown Product'}</p>
                      <p className="text-[8px] font-bold text-slate-300 uppercase leading-none mt-1 tracking-tighter">{row.batchId || '—'}</p>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex items-center justify-center gap-1">
                          <div className="flex flex-col items-center gap-1 w-[45px]">
                             <div className="w-7 h-7 rounded-full flex items-center justify-center border text-[10px] font-black shadow-sm bg-blue-50 border-blue-200 text-blue-500">
                                <ShieldCheck className="w-3.5 h-3.5" />
                             </div>
                             <span className="text-[6px] font-black text-slate-400 uppercase tracking-tighter">INPUT</span>
                             <span className="text-[7px] font-black text-indigo-500 tabular leading-none">{flowParts[0]?.trim() || '0'}</span>
                          </div>
                          <div className="h-[1px] w-8 -mt-5 bg-indigo-600" />
                          <div className="flex flex-col items-center gap-1 w-[45px]">
                             <div className="w-7 h-7 rounded-full flex items-center justify-center border text-[10px] font-black shadow-sm bg-blue-50 border-blue-200 text-blue-500">
                                <ShieldCheck className="w-3.5 h-3.5" />
                             </div>
                             <span className="text-[6px] font-black text-slate-400 uppercase tracking-tighter">OUTPUT</span>
                             <span className="text-[7px] font-black text-indigo-500 tabular leading-none">{flowParts[1]?.trim() || '0'}</span>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <span className={cn(
                         "px-4 py-1.5 rounded-full text-[8.5px] font-black uppercase tracking-tight shadow-sm border whitespace-nowrap",
                         isDefect ? "bg-rose-500 text-white border-rose-600" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                       )}>
                         {isDefect ? 'DEFECT DETECTED' : 'NOMINAL'}
                       </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                       <p className="text-[10px] font-black text-brand-black uppercase tracking-tight">
                          <span className={cn(phaseLabel === 'FINISHED_GOODS' ? 'text-emerald-500' : 'text-indigo-600')}>
                            {phaseLabel || row.status || 'UNKNOWN'}
                          </span>
                       </p>
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mt-1 italic leading-tight max-w-[180px] ml-auto">
                          {row.notes || '—'}
                       </p>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      {/* V. DAFTAR GRANULAR (AUDIT BATCH PRODUKSI) */}
      <div className="space-y-3 mt-6">
        <div className="flex items-center gap-2 ml-1">
           <h3 className="text-[13px] font-black uppercase tracking-tighter text-brand-black italic">V. DAFTAR GRANULAR (AUDIT BATCH PRODUKSI)</h3>
        </div>

        <Card className="rounded-[1.2rem] overflow-hidden border border-slate-100 shadow-sm bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-4 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">NO. WORK ORDER</th>
                  <th className="px-8 py-4 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">NAMA KLIEN & PRODUK</th>
                  <th className="px-8 py-4 text-center text-[8px] font-black text-slate-400 uppercase tracking-widest">TAHAPAN SAAT INI</th>
                  <th className="px-8 py-4 text-right text-[8px] font-black text-slate-400 uppercase tracking-widest">ESTIMASI SELESAI</th>
                  <th className="px-8 py-4 text-right text-[8px] font-black text-slate-400 uppercase tracking-widest pr-10">QTY DEFECT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {precisionTracking.map((row: any, i: number) => {
                  const phaseLabel = (row.status || '').replace('PHASE_', '');
                  const defectQty = row.anomaly === 'DEFECT_DETECTED' ? parseInt((row.unitFlow || '0>>0').split('>>')[0]) - parseInt((row.unitFlow || '0>>0').split('>>')[1]) : 0;
                  return (
                  <tr key={i} className="group hover:bg-slate-50/50 transition-all cursor-default">
                    <td className="px-8 py-4">
                       <p className="text-[9px] font-black text-slate-300 uppercase tracking-tighter tabular">{row.batchId || '—'}</p>
                    </td>
                    <td className="px-8 py-4">
                       <p className="text-[11px] font-black text-brand-black uppercase tracking-tight">
                          {row.productName || 'Unknown Product'}
                       </p>
                    </td>
                    <td className="px-8 py-4 text-center">
                       <span className={cn(
                         "px-5 py-1 rounded-full text-[8px] font-black uppercase tracking-tight border whitespace-nowrap",
                         phaseLabel === 'FINISHED_GOODS' ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                         row.anomaly === 'DEFECT_DETECTED' ? "bg-rose-500 text-white border-rose-600 shadow-sm shadow-rose-100" :
                         "bg-slate-50 text-slate-400 border-slate-100"
                       )}>
                         {phaseLabel || row.status || 'PENDING'}
                       </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                       <p className="text-[11px] font-black text-brand-black uppercase tracking-tight tabular">{row.deadline > 0 ? `H-${row.deadline}` : 'OVERDUE'}</p>
                    </td>
                    <td className="px-8 py-4 text-right pr-10">
                       <span className={cn(
                         "text-[11px] font-black tabular",
                         defectQty <= 0 ? "text-emerald-500" : "text-rose-500"
                       )}>
                         {defectQty} Pcs
                       </span>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

