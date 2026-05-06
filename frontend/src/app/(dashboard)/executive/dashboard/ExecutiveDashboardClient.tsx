"use client";

import React from "react";
import { 
  TrendingUp, 
  Wallet, 
  Activity, 
  ShieldAlert,
  BarChart3,
  RotateCcw,
  ThumbsDown,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export default function ExecutiveDashboardClient() {
  return (
    <div className="p-4 bg-[#fafafa] h-screen flex flex-col gap-4 overflow-hidden">
      
      {/* 2. BENTO GRID - ULTRA COMPACT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 overflow-hidden min-h-0">
        
        {/* CARD 1: REVENUE */}
        <Card className="rounded-[2rem] p-5 border border-slate-100 bg-white flex flex-col h-full overflow-hidden">
           <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-black italic">REVENUE & TARGET</h3>
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
           </div>
           
           <div className="space-y-0.5">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">MTD OMSET</p>
              <h2 className="text-[22px] font-black tracking-tighter tabular leading-none whitespace-nowrap">Rp 3.240.000.000</h2>
              <p className="text-[9px] font-black text-emerald-500 uppercase">+12.5% <span className="text-slate-300 ml-1">VS LM</span></p>
           </div>

           <div className="grid grid-cols-2 gap-4 my-4 border-y border-slate-50 py-3">
              <div>
                 <p className="text-[7px] font-black text-slate-300 uppercase">TARGET</p>
                 <p className="text-[14px] font-black tabular whitespace-nowrap">Rp 4.5 M</p>
              </div>
              <div>
                 <p className="text-[7px] font-black text-slate-300 uppercase">PENCAPAIAN</p>
                 <p className="text-[14px] font-black text-emerald-500 tabular">72.4%</p>
              </div>
           </div>

           <div className="mb-4">
              <div className="flex justify-between text-[8px] font-black uppercase mb-1.5">
                 <p>PROYEKSI AKHIR</p>
                 <p>Rp 4.15 M</p>
              </div>
              <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500 w-[72%]" />
              </div>
           </div>
        </Card>

        {/* CARD 2: SALES PIPELINE */}
        <Card className="rounded-[2rem] p-5 border border-slate-100 bg-white flex flex-col h-full overflow-hidden">
           <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-black italic">SALES PIPELINE</h3>
              </div>
              <BarChart3 className="w-4 h-4 text-blue-500" />
           </div>

           <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                 <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">LEADS</p>
                 <p className="text-[20px] font-black tabular leading-none">142</p>
              </div>
              <div className="bg-indigo-50/30 p-3 rounded-2xl border border-indigo-100/30">
                 <p className="text-[7px] font-black text-indigo-400 uppercase mb-0.5">VALUATION</p>
                 <p className="text-[16px] font-black tabular leading-none">Rp 8.4 M</p>
              </div>
           </div>

           <div className="space-y-3 mb-4">
              {[
                { label: 'Leads In', val: 142, w: '100%', c: 'bg-slate-200' },
                { label: 'Sample', val: 45, w: '45%', c: 'bg-indigo-400' },
                { label: 'Negotiation', val: 18, w: '25%', c: 'bg-purple-500' },
                { label: 'SPK', val: 12, w: '15%', c: 'bg-blue-600' },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-3">
                   <p className="text-[8px] font-black text-slate-400 uppercase w-16 shrink-0">{row.label}</p>
                   <div className="flex-1 h-2 bg-slate-50 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", row.c)} style={{ width: row.w }} />
                   </div>
                   <p className="text-[9px] font-black text-slate-300 tabular w-6 text-right">{row.val}</p>
                </div>
              ))}
           </div>
        </Card>

        {/* CARD 3: PRODUCTION STATUS */}
        <Card className="rounded-[2rem] p-5 border border-slate-100 bg-white flex flex-col h-full overflow-hidden">
           <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-black italic">PRODUCTION STATUS</h3>
              </div>
              <Activity className="w-4 h-4 text-amber-500" />
           </div>

           <div className="flex justify-between items-start mb-4">
              <div>
                 <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">ACTIVE ORDER</p>
                 <p className="text-[28px] font-black tabular leading-none">48</p>
              </div>
              <div className="text-right">
                 <p className="text-[7px] font-black text-rose-500 uppercase mb-0.5">OVERDUE</p>
                 <p className="text-[28px] font-black text-rose-600 tabular leading-none">5</p>
              </div>
           </div>

           <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { l: 'PROD', v: 32, c: 'text-amber-500' },
                { l: 'QC', v: 12, c: 'text-emerald-500' },
                { l: 'READY', v: 4, c: 'text-blue-500' },
              ].map((box, i) => (
                <div key={i} className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 flex flex-col items-center">
                   <p className="text-[6px] font-black text-slate-300 uppercase mb-0.5">{box.l}</p>
                   <p className={cn("text-[16px] font-black tabular", box.c)}>{box.v}</p>
                </div>
              ))}
           </div>

           <div className="flex justify-between items-center py-2.5 border-t border-dashed border-slate-100 mb-4">
              <p className="text-[8px] font-black text-slate-400 uppercase italic">Avg Prod. Time</p>
              <p className="text-[11px] font-black tabular text-brand-black">14.2 Hari</p>
           </div>
        </Card>

        {/* CARD 4: CASHFLOW */}
        <Card className="rounded-[2rem] p-5 border border-slate-100 bg-white flex flex-col h-full overflow-hidden">
           <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-black italic">CASHFLOW & PAYMENT</h3>
              </div>
              <Wallet className="w-4 h-4 text-indigo-500" />
           </div>

           <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
                 <p className="text-[7px] font-black text-indigo-400 uppercase mb-0.5">CASH IN (MTD)</p>
                 <p className="text-[18px] font-black tabular text-indigo-600 leading-none">Rp 1.18 M</p>
              </div>
              <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100/50">
                 <p className="text-[7px] font-black text-rose-400 uppercase mb-0.5">PIUTANG (AR)</p>
                 <p className="text-[18px] font-black tabular text-rose-600 leading-none">Rp 2.45 M</p>
              </div>
           </div>

           <div className="space-y-3 mb-4">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">AGING RECEIVABLE</p>
              <div className="h-2.5 bg-slate-50 rounded-full flex overflow-hidden">
                 <div className="h-full bg-emerald-500 w-[50%]" />
                 <div className="h-full bg-amber-500 w-[30%] border-l border-white" />
                 <div className="h-full bg-rose-500 w-[20%] border-l border-white" />
              </div>
              <div className="flex justify-between text-[7px] font-black px-0.5">
                 <p className="text-emerald-500 uppercase">0-30H</p>
                 <p className="text-amber-500 uppercase">31-60H</p>
                 <p className="text-rose-500 uppercase">60+H</p>
              </div>
           </div>
        </Card>

        {/* CARD 5: LOST & PROBLEMS */}
        <Card className="rounded-[2rem] p-5 border border-slate-100 bg-white flex flex-col h-full overflow-hidden">
           <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-black italic">LOST & PROBLEMS</h3>
              </div>
              <ThumbsDown className="w-4 h-4 text-rose-500" />
           </div>

           <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                 <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">LOST DEAL (VAL)</p>
                 <p className="text-[20px] font-black tabular text-rose-600 leading-none">Rp 1.12 M</p>
              </div>
              <div>
                 <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">CHURN RATE</p>
                 <p className="text-[20px] font-black tabular leading-none">4.2%</p>
              </div>
           </div>

           <div className="space-y-4 mb-4">
              <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">FAILURE AUDIT</p>
              {[
                { l: 'Price', v: 65, c: 'bg-rose-500' },
                { l: 'Sample', v: 40, c: 'bg-rose-400' },
                { l: 'Prod SLA', v: 25, c: 'bg-rose-300' },
              ].map((row, i) => (
                <div key={i} className="space-y-1">
                   <div className="flex justify-between text-[8px] font-bold uppercase">
                      <p className="text-brand-black">{row.l}</p>
                      <p className="text-slate-400">{row.v} Case</p>
                   </div>
                   <div className="h-1 bg-slate-50 rounded-full overflow-hidden">
                      <div className={cn("h-full", row.c)} style={{ width: `${(row.v / 65) * 100}%` }} />
                   </div>
                </div>
              ))}
           </div>
        </Card>

        {/* CARD 6: REPEAT ORDER */}
        <Card className="rounded-[2rem] p-5 border border-slate-100 bg-white flex flex-col h-full overflow-hidden">
           <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-black italic">REPEAT ORDER ENGINE</h3>
              </div>
              <RotateCcw className="w-4 h-4 text-emerald-500" />
           </div>

           <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                 <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">REPEAT RATE</p>
                 <p className="text-[24px] font-black text-emerald-600 tabular leading-none">68.5%</p>
              </div>
              <div>
                 <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">RO REVENUE</p>
                 <p className="text-[18px] font-black tabular leading-none">Rp 2.1 M</p>
              </div>
           </div>

           <div className="bg-emerald-50/50 p-4 rounded-3xl border border-emerald-100/50 space-y-1 mb-4">
              <p className="text-[7px] font-black text-emerald-600 uppercase flex items-center gap-1.5">
                 <div className="w-1 h-1 rounded-full bg-emerald-500" /> READY TO REPEAT
              </p>
              <h4 className="text-[20px] font-black tabular text-brand-black leading-none">18 <span className="text-[9px] font-bold text-slate-400">Client</span></h4>
              <p className="text-[9px] font-bold text-emerald-600">+5 vs Target</p>
           </div>
        </Card>

      </div>
    </div>
  );
}

