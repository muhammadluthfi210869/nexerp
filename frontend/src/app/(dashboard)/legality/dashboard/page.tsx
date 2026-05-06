"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  ShieldCheck, 
  Activity, 
  Zap, 
  Bookmark, 
  Search, 
  AlertCircle,
  CheckCircle2,
  Clock,
  Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export default function LegalityDashboard() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["legality-dashboard"],
    queryFn: async () => {
      const [dashboard, pipeline] = await Promise.all([
        api.get("/legality/dashboard"),
        api.get("/legality/pipeline/stats")
      ]);
      return { 
        ...dashboard.data, 
        pipeline: pipeline.data 
      };
    },
    refetchInterval: 30000,
  });

  if (isLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
       <Activity className="h-6 w-6 text-slate-400 animate-pulse" />
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syncing Compliance DNA...</p>
    </div>
  );

  return (
    <div className="p-6 space-y-6 bg-[#fafafa] min-h-screen">
      {/* HEADER SECTION - ULTRA COMPACT */}
      <div className="flex items-baseline gap-2 mb-2">
        <h1 className="text-[22px] font-black text-brand-black uppercase tracking-tighter italic">
          LEGALITY & COMPLIANCE
        </h1>
        <span className="text-slate-400 font-bold text-[11px] tracking-tight italic">
          (Regulatory Surveillance & HKI Audit)
        </span>
      </div>

      {/* I. EXECUTIVE CARDS - RECTANGULAR & COMPACT */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* A. OVERALL REGISTRATION */}
        <Card className="rounded-[1.5rem] p-5 border border-slate-100 shadow-sm bg-white flex flex-col justify-between h-[180px]">
           <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              <p className="text-[9px] font-black text-brand-black uppercase tracking-widest italic">OVERALL REGISTRATION</p>
           </div>
           
               <div className="flex justify-between items-end mb-2">
               <div>
                  <h2 className="text-[32px] font-black text-brand-black tracking-tighter tabular leading-none">{metrics?.overall?.activeTotal ?? 0}</h2>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">ACTIVE TOTAL</p>
               </div>
               <div className="text-right">
                  <span className="text-[20px] font-black text-emerald-500 tabular leading-none">{metrics?.overall?.thisMonth ?? 0}</span>
                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-0.5">THIS MONTH</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
               <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex flex-col items-start">
                  <span className="text-[12px] font-black text-brand-black">{metrics?.overall?.onProgress ?? 0}</span>
                  <span className="text-[7px] font-bold text-slate-400 uppercase">ON PROGRESS</span>
               </div>
               <div className="bg-rose-50/50 p-2 rounded-xl border border-rose-100 flex flex-col items-start">
                  <span className="text-[12px] font-black text-rose-600">{metrics?.overall?.delayed ?? 0}</span>
                  <span className="text-[7px] font-bold text-rose-400 uppercase">DELAYED</span>
               </div>
            </div>
        </Card>

        {/* B. BPOM PERFORMANCE */}
        <Card className="rounded-[1.5rem] p-5 border border-emerald-100 shadow-sm bg-[#f1fdf6]/50 flex flex-col justify-between h-[180px]">
           <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              <p className="text-[9px] font-black text-emerald-800 uppercase tracking-widest italic">BPOM PERFORMANCE</p>
           </div>
           
            <div className="flex-1 flex flex-col items-center justify-center -mt-2">
               <div className="flex items-baseline gap-1">
                  <h2 className="text-[32px] font-black text-brand-black tracking-tighter tabular leading-none">{metrics?.bpomStats?.avgTime?.replace(' Days', '') ?? '0'}</h2>
                  <span className="text-sm font-black text-slate-400">days</span>
               </div>
               <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mt-1">AVG PROCESSING TIME</p>
            </div>

           <div className="space-y-1 pt-2 border-t border-emerald-100/30">
               <div className="flex justify-between items-center">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">LAB TEST</span>
                  <span className="text-[10px] font-black text-brand-black">{metrics?.bpomStats?.labTest ?? 0}d</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">GOV EVAL</span>
                  <span className="text-[10px] font-black text-brand-black">{metrics?.bpomStats?.govEval ?? 0}d</span>
               </div>
           </div>
        </Card>

        {/* C. HKI PERFORMANCE */}
        <Card className="rounded-[1.5rem] p-5 border border-slate-100 shadow-sm bg-white flex flex-col justify-between h-[180px]">
           <div className="flex items-center gap-2">
              <Bookmark className="w-3.5 h-3.5 text-purple-500" />
              <p className="text-[9px] font-black text-brand-black uppercase tracking-widest italic">HKI PERFORMANCE</p>
           </div>
           
            <div className="flex-1 flex flex-col items-center justify-center -mt-2">
               <div className="flex items-baseline gap-1">
                  <h2 className="text-[32px] font-black text-brand-black tracking-tighter tabular leading-none">{metrics?.hkiStats?.avgTime?.replace(' Days', '') ?? '0'}</h2>
                  <span className="text-sm font-black text-slate-400">days</span>
               </div>
               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">AVG PROCESSING TIME</p>
            </div>

           <div className="space-y-1 pt-2 border-t border-slate-50">
               <div className="flex justify-between items-center">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">DOC PREP</span>
                  <span className="text-[10px] font-black text-brand-black">{metrics?.hkiStats?.docPrep ?? 0}d</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">GOV PROCESS</span>
                  <span className="text-[10px] font-black text-brand-black">{metrics?.hkiStats?.govProcess ?? 0}d</span>
               </div>
           </div>
        </Card>

        {/* D. RISK MONITOR */}
        <Card className="rounded-[1.5rem] p-5 border border-rose-100 shadow-sm bg-rose-50/20 flex flex-col justify-between h-[180px]">
           <div className="flex items-center gap-2 mb-2">
              <Zap className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <p className="text-[9px] font-black text-rose-800 uppercase tracking-widest italic">RISK MONITOR</p>
           </div>
           
           <div className="grid grid-cols-2 gap-2">
               <div className="bg-white p-2 rounded-xl border border-rose-100 shadow-sm flex flex-col">
                  <p className="text-[7px] font-black text-rose-800 uppercase tracking-widest mb-0.5">EXPIRED</p>
                  <p className="text-[18px] font-black text-rose-600 tabular leading-none">{metrics?.riskMonitor?.expired ?? 0}</p>
               </div>
               <div className="bg-white p-2 rounded-xl border border-amber-100 shadow-sm flex flex-col">
                  <p className="text-[7px] font-black text-amber-800 uppercase tracking-widest mb-0.5">&lt; 90 DAYS</p>
                  <p className="text-[18px] font-black text-amber-600 tabular leading-none">{metrics?.riskMonitor?.under90Days ?? 0}</p>
               </div>
           </div>

           <button className="w-full bg-rose-900 text-white py-2 rounded-lg font-black text-[9px] uppercase tracking-widest mt-2 hover:bg-rose-950 transition-colors">
              CRITICAL ACTION REQUIRED
           </button>
        </Card>
      </div>

      {/* II. HKI TRACKING HUB - ULTRA COMPACT TABLE */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 ml-1">
           <Search className="w-4 h-4 text-purple-500" />
           <h3 className="text-[13px] font-black uppercase tracking-tighter text-brand-black italic">1. HKI (HAK KEKAYAAN INTELEKTUAL) TRACKING HUB</h3>
        </div>

        <Card className="rounded-[1.2rem] overflow-hidden border border-slate-100 shadow-sm bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-3 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">BRAND / PRODUCT (HKI ID)</th>
                  <th className="px-6 py-3 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">TYPE / CLIENT</th>
                  <th className="px-6 py-3 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">PIC/APPLY</th>
                  <th className="px-6 py-3 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">FLOW STATE (DAYS)</th>
                  <th className="px-6 py-3 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">STATUS</th>
                  <th className="px-6 py-3 text-right text-[8px] font-black text-slate-400 uppercase tracking-widest">AUDIT RISK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {metrics?.tables?.hkiTracking?.map((row: any, i: number) => (
                  <tr key={i} className="group hover:bg-slate-50/50 transition-all cursor-default">
                    <td className="px-6 py-3.5">
                      <p className="text-[11px] font-black text-brand-black uppercase tracking-tight">{row.brand}</p>
                      <p className="text-[9px] font-bold text-slate-300 uppercase leading-none">{row.id}</p>
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="text-[10px] font-black text-brand-black uppercase">{row.type}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase leading-none">{row.client}</p>
                    </td>
                    <td className="px-6 py-3.5">
                      <p className="text-[10px] font-black text-purple-600 uppercase italic">{row.pic}</p>
                      <p className="text-[8px] font-bold text-slate-300 tabular uppercase leading-none">{row.apply}</p>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <p className="text-[10px] font-black text-brand-black uppercase leading-tight">{row.flow}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase leading-none">{row.days}</p>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                        row.status === 'DONE' ? "bg-emerald-500 text-white" :
                        row.status === 'REJECT' ? "bg-rose-500 text-white" :
                        "bg-amber-500 text-white"
                      )}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {row.risk === 'OK' ? (
                          <>
                             <span className="text-[9px] font-black text-emerald-500 uppercase">OK</span>
                             <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          </>
                        ) : (
                          <>
                             <AlertCircle className="w-3 h-3 text-amber-500" />
                             <span className="text-[9px] font-black text-amber-600 uppercase italic">DELAY AUDIT</span>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* III. BPOM PROGRESS AUDIT */}
      <div className="space-y-3 mt-8">
        <div className="flex items-center gap-2 ml-1">
           <Activity className="w-4 h-4 text-emerald-500" />
           <h3 className="text-[13px] font-black uppercase tracking-tighter text-brand-black italic">2. BPOM (NOTIFIKASI KOSMETIK) PROGRESS AUDIT</h3>
        </div>
        <Card className="rounded-[1.2rem] overflow-hidden border border-slate-100 shadow-sm bg-white">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-3 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">PRODUCT NAME (BPOM ID)</th>
                <th className="px-6 py-3 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">CATEGORY / CLIENT</th>
                <th className="px-6 py-3 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">PIC/APPLY</th>
                <th className="px-6 py-3 text-left text-[8px] font-black text-slate-400 uppercase tracking-widest">STAGE (BOTTLENECK)</th>
                <th className="px-6 py-3 text-center text-[8px] font-black text-slate-400 uppercase tracking-widest">STATUS</th>
                <th className="px-6 py-3 text-right text-[8px] font-black text-slate-400 uppercase tracking-widest">DAYS ELAPSED</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {metrics?.tables?.bpomProgress?.map((row: any, i: number) => (
                <tr key={i} className="group hover:bg-slate-50/50">
                  <td className="px-6 py-3">
                    <p className="text-[11px] font-black text-brand-black uppercase tracking-tight">{row.name}</p>
                    <p className="text-[8px] font-bold text-slate-300 uppercase">{row.id}</p>
                  </td>
                  <td className="px-6 py-3">
                    <p className="text-[10px] font-black text-brand-black uppercase">{row.cat}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">{row.client}</p>
                  </td>
                  <td className="px-6 py-3">
                    <p className="text-[10px] font-black text-emerald-600 uppercase italic">{row.pic}</p>
                    <p className="text-[8px] font-bold text-slate-300 tabular">{row.date}</p>
                  </td>
                  <td className="px-6 py-3">
                    <p className="text-[11px] font-black text-brand-black uppercase italic">{row.stage}</p>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                      row.status === 'DONE' ? "bg-emerald-500 text-white" :
                      row.status === 'IN_PROGRESS_ROSE' ? "bg-rose-500 text-white" :
                      "bg-amber-500 text-white"
                    )}>
                      {row.status.replace("_ROSE", "")}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <p className={cn("text-[11px] font-black tabular", row.days === '52d' ? "text-rose-600" : "text-brand-black")}>{row.days}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* IV. DUAL SECTION: EXPIRY + PERFORMANCE */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-8">
        {/* CRITICAL EXPIRY AUDIT */}
        <div className="md:col-span-7 space-y-3">
           <div className="flex items-center gap-2 ml-1">
              <Clock className="w-4 h-4 text-rose-500" />
              <h3 className="text-[13px] font-black uppercase tracking-tighter text-brand-black italic">3. CRITICAL EXPIRY AUDIT (PROTECTION)</h3>
           </div>
           <Card className="rounded-[1.2rem] overflow-hidden border border-rose-100 shadow-sm bg-rose-50/20">
             <table className="w-full border-collapse">
               <thead>
                 <tr className="bg-rose-100/50 border-b border-rose-100">
                   <th className="px-6 py-3 text-left text-[8px] font-black text-rose-800 uppercase tracking-widest">TYPE / REGISTRATION (BRAND)</th>
                   <th className="px-6 py-3 text-center text-[8px] font-black text-rose-800 uppercase tracking-widest">CERT NUMBER / EXPIRY</th>
                   <th className="px-6 py-3 text-right text-[8px] font-black text-rose-800 uppercase tracking-widest">DAYS LEFT</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-rose-100/50">
                {metrics?.tables?.criticalExpiry?.map((row: any, i: number) => (
                   <tr key={i} className="group hover:bg-white/50">
                     <td className="px-6 py-4">
                        <p className="text-[11px] font-black text-brand-black uppercase tracking-tight">{row.type}</p>
                        <p className="text-[8px] font-bold text-rose-400 uppercase leading-none">{row.sub}</p>
                     </td>
                     <td className="px-6 py-4 text-center">
                        <p className="text-[10px] font-black text-rose-900 tabular">{row.cert}</p>
                        <p className="text-[9px] font-black text-rose-600 tabular leading-none">{row.expiry}</p>
                     </td>
                     <td className="px-6 py-4 text-right">
                        <span className={cn("px-3 py-1 rounded-full text-[9px] font-black text-white tabular", row.color)}>
                          {row.left}
                        </span>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </Card>
        </div>

        {/* LEGAL STAFF PERFORMANCE */}
        <div className="md:col-span-5 space-y-3">
           <div className="flex items-center gap-2 ml-1">
              <Trophy className="w-4 h-4 text-blue-500" />
              <h3 className="text-[13px] font-black uppercase tracking-tighter text-brand-black italic">4. LEGAL STAFF PERFORMANCE</h3>
           </div>
           <Card className="rounded-[1.2rem] p-6 border border-slate-100 shadow-sm bg-white">
              <div className="space-y-6">
                 <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">
                    <span>STAFF NAME</span>
                    <span>DONE/TOTAL</span>
                    <span className="text-right">WIN RATE</span>
                 </div>
                  {metrics?.tables?.staffHistory?.map((staff: any) => (
                    <div key={staff.name} className="flex justify-between items-center group">
                       <div>
                          <p className="text-[12px] font-black text-brand-black uppercase tracking-tight">{staff.name}</p>
                          <p className="text-[8px] font-bold text-slate-300 uppercase leading-none">{staff.avg}</p>
                       </div>
                       <div className="text-center">
                          <p className="text-[13px] font-black text-brand-black tabular leading-none">{staff.stat}</p>
                          <p className="text-[8px] font-bold text-rose-400 uppercase tracking-widest mt-0.5">{staff.delay}</p>
                       </div>
                       <div className="text-right">
                          <span className={cn("text-[16px] font-black tabular", staff.color)}>{staff.rate}</span>
                       </div>
                    </div>
                 ))}
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}

