"use client";

import React from "react";
import { 
  Activity, 
  BarChart3, 
  Settings2, 
  Database,
  ShieldCheck,
  History
} from "lucide-react";
import { MarketingLogManager } from "@/components/marketing/marketing-log-manager";
import { Card } from "@/components/ui/card";

export default function MarketingLogsPage() {
  return (
    <div className="p-8 space-y-8 font-inter bg-base min-h-screen">
      {/* PREMIUM AUDIT HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <div className="relative">
              <ShieldCheck className="w-4 h-4 fill-blue-600" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Operational Integrity Hub</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            CAMPAIGN <span className="text-blue-600">AUDIT LOGS</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 italic max-w-xl">
            Correct, adjust, or reconcile marketing performance data. All modifications are tracked to maintain intelligence accuracy.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="px-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center gap-4">
             <History className="w-5 h-5 text-slate-400" />
             <div className="text-left font-black tracking-tight leading-none uppercase">
                <p className="text-[8px] text-slate-400 mb-1">Audit Status</p>
                <p className="text-sm text-slate-900">100% SECURE</p>
             </div>
          </div>
        </div>
      </div>

      {/* QUICK STATS FOR AUDITOR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="p-6 border-none shadow-xl shadow-slate-200/40 bg-white rounded-3xl flex items-center gap-5">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
               <Database className="w-6 h-6" />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Core Database</p>
               <p className="text-lg font-black text-slate-900">PRODUCTION</p>
            </div>
         </Card>
         <Card className="p-6 border-none shadow-xl shadow-slate-200/40 bg-white rounded-3xl flex items-center gap-5">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
               <Activity className="w-6 h-6" />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Sync Health</p>
               <p className="text-lg font-black text-slate-900">OPTIMAL</p>
            </div>
         </Card>
         <Card className="p-6 border-none shadow-xl shadow-slate-200/40 bg-white rounded-3xl flex items-center gap-5">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
               <Settings2 className="w-6 h-6" />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Audit Mode</p>
               <p className="text-lg font-black text-slate-900">REAL-TIME</p>
            </div>
         </Card>
      </div>

      {/* MAIN LOG MANAGER */}
      <div className="bg-white/40 rounded-[48px] p-2">
         <MarketingLogManager />
      </div>
    </div>
  );
}

