"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Wallet, 
  ShieldCheck, 
  FileText, 
  Download,
  AlertCircle,
  CheckCircle2,
  Lock
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function PayrollWorkbench() {
  const [status, setStatus] = useState("DRAFT");

  const handleAuthorize = () => {
    setStatus("AUTHORIZED");
    toast.success("Payroll Authorized", {
      description: "Data dispatched to Finance Module successfully.",
      style: { background: '#0F172A', color: '#fff', border: '1px solid #1E293B' }
    });
  };

  return (
    <div className="space-y-8">
        {/* 💳 IV. PAYROLL EXECUTIVE SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <Card className="bento-card p-8 bento-card-hover border-l-4 border-l-slate-900 flex flex-col justify-between h-56 bg-white">
              <div className="flex justify-between items-start">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DRAFT PERIOD</p>
                 <span className="text-[10px] font-black text-slate-600 bg-slate-100 px-2 py-1 rounded-md">MAY 2024</span>
              </div>
              <div>
                 <p className="text-3xl font-black text-brand-black tabular">Rp 482.5M</p>
                 <p className="text-[9px] font-black text-slate-400 uppercase mt-1 tracking-tighter">TOTAL GROSS DISBURSEMENT</p>
              </div>
           </Card>

           <Card className="bento-card p-8 bento-card-hover border-l-4 border-l-emerald-500 flex flex-col justify-between h-56 bg-white">
              <div className="flex justify-between items-start">
                 <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">INCENTIVE POOL</p>
                 <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">+15.2%</span>
              </div>
              <div>
                 <p className="text-3xl font-black text-emerald-600 tabular">Rp 64.2M</p>
                 <p className="text-[9px] font-black text-emerald-600/60 uppercase mt-1 tracking-tighter">PERFORMANCE HARVESTING BONUS</p>
              </div>
           </Card>

           <Card className={cn(
             "bento-card p-8 bento-card-hover border-l-4 flex flex-col justify-between h-56 transition-all",
             status === 'DRAFT' ? "border-l-indigo-500 bg-indigo-50/30" : "border-l-brand-black bg-brand-black text-white"
           )}>
              <div className="flex justify-between items-start">
                 <p className={cn("text-[10px] font-black uppercase tracking-widest", status === 'DRAFT' ? "text-indigo-600" : "text-white/50")}>APPROVAL STATUS</p>
                 {status === 'DRAFT' ? (
                    <span className="text-[9px] font-black text-indigo-600 bg-indigo-100 px-2 py-1 rounded-md animate-pulse">PENDING REVIEW</span>
                 ) : (
                    <span className="text-[9px] font-black text-brand-black bg-white px-2 py-1 rounded-md">AUTHORIZED</span>
                 )}
              </div>
              <div>
                 {status === 'DRAFT' ? (
                    <Button onClick={handleAuthorize} className="w-full bg-indigo-600 text-white hover:bg-indigo-700 font-black uppercase text-[10px] h-12 rounded-xl">
                       <ShieldCheck className="w-4 h-4 mr-2" /> AUTHORIZE PAYROLL
                    </Button>
                 ) : (
                    <div className="flex items-center gap-3">
                       <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                       <span className="text-lg font-black uppercase tracking-tighter italic">APPROVED BY AUDIT</span>
                    </div>
                 )}
              </div>
           </Card>
        </div>

        {/* 📝 V. PAYROLL ITEMIZATION TABLE */}
        <div className="space-y-4">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <div className="w-1 h-4 bg-brand-black rounded-full" />
                 <h3 className="text-sm font-black uppercase tracking-widest text-brand-black italic">📝 V. PAYROLL ITEMIZATION (ENCRYPTED AUDIT)</h3>
              </div>
              <div className="flex gap-2">
                 <Button variant="outline" className="h-8 border-slate-200 text-slate-400 font-black uppercase text-[9px] tracking-widest hover:border-brand-black hover:text-brand-black rounded-lg">
                    <Download className="w-3.5 h-3.5 mr-1.5" /> CSV
                 </Button>
                 <Button variant="outline" className="h-8 border-slate-200 text-slate-400 font-black uppercase text-[9px] tracking-widest hover:border-brand-black hover:text-brand-black rounded-lg">
                    <FileText className="w-3.5 h-3.5 mr-1.5" /> SLIPS
                 </Button>
              </div>
           </div>

           <Card className="bento-card overflow-hidden">
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase">PERSONNEL</th>
                          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase text-right">BASE SALARY</th>
                          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase text-right">KPI INCENTIVE</th>
                          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase text-right">NET DISBURSEMENT</th>
                          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase text-center">PRIVACY</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {[
                          { name: "IRMA", base: "Rp 15.0M", kpi: "Rp 2.4M", net: "Rp 17.4M" },
                          { name: "AMIRA", base: "Rp 18.0M", kpi: "Rp 3.1M", net: "Rp 21.1M" },
                          { name: "AGUS", base: "Rp 8.5M", kpi: "Rp 1.2M", net: "Rp 9.7M" },
                       ].map((row, idx) => (
                          <tr key={idx} className="group hover:bg-slate-50/50 transition-all">
                             <td className="px-6 py-4">
                                <p className="text-[11px] font-black text-brand-black uppercase italic tracking-tight">{row.name}</p>
                             </td>
                             <td className="px-6 py-4 text-right">
                                <span className="text-[11px] font-black text-slate-300 tabular tracking-[0.2em]">••••••••</span>
                             </td>
                             <td className="px-6 py-4 text-right">
                                <span className="text-[11px] font-black text-emerald-600 tabular">{row.kpi}</span>
                             </td>
                             <td className="px-6 py-4 text-right">
                                <span className="text-[11px] font-black text-brand-black tabular">{row.net}</span>
                             </td>
                             <td className="px-6 py-4 text-center">
                                <div className="flex justify-center">
                                   <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 group-hover:border-slate-200 transition-all">
                                      <Lock className="w-3 h-3 text-slate-300" />
                                   </div>
                                </div>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </Card>
        </div>
      </div>
    );
}

