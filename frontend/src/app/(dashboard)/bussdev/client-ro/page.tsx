"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import { Loader2, RefreshCw, Search, ChevronRight, Star } from "lucide-react";
import { DashboardCards } from "@/components/bussdev/DashboardCards";
import { Button } from "@/components/ui/button";
import { BussdevActionDialog } from "@/components/bussdev/BussdevActionDialog";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const FU_CONFIG = {
  NOT_FOLLOWED_UP: { label: "Belum FU", color: "bg-slate-100 text-slate-500" },
  FU_1: { label: "FU 1", color: "bg-amber-100 text-amber-700" },
  FU_2: { label: "FU 2", color: "bg-orange-100 text-orange-700" },
  FU_3: { label: "FU 3", color: "bg-rose-100 text-rose-700" },
};

export default function ClientROPage() {
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: analytics } = useQuery({
    queryKey: ["bussdev-analytics", "ro"],
    queryFn: async () => {
      try { return (await api.get("/bussdev/analytics/ro")).data; }
      catch { return null; }
    },
  });

  const { data: leads, isLoading } = useQuery({
    queryKey: ["bussdev-leads-group", "ro"],
    queryFn: async () => (await api.get<any[]>("/bussdev/leads/group/ro")).data,
  });

  const filtered = leads?.filter(l =>
    l.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.brandName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return (
    <div className="flex justify-center items-center min-h-screen">
      <Loader2 className="animate-spin h-10 w-10 text-emerald-600" />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* 🏛️ I. LOYALTY COMMAND HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">VIP RETENTION ACTIVE</span>
           </div>
           <h1 className="text-4xl font-black text-brand-black tracking-tighter uppercase italic">CLIENT <span className="text-slate-300">REPEAT ORDER</span></h1>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">LOYALTY STREAM ANALYSIS & RETENTION PIPELINE</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="text-right hidden md:block">
              <p className="text-[10px] font-black text-brand-black uppercase">RETENTION RATE</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">MAXIMIZED VALUE</p>
           </div>
           <div className="flex items-center gap-2 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
              <RefreshCw className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] font-black text-brand-black uppercase tabular">LIVE ANALYTICS</span>
           </div>
        </div>
      </div>

      <DashboardCards variant="ro" data={analytics} />

      {/* 📑 II. LOYALTY STREAM ANALYSIS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-brand-black rounded-full" />
              <h3 className="text-sm font-black uppercase tracking-widest text-brand-black italic">📑 II. LOYALTY STREAM ANALYSIS</h3>
           </div>
           <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="SEARCH VIP PARTNER / BRAND..."
                className="pl-11 h-11 bg-white border border-slate-100 rounded-xl font-black text-[10px] text-brand-black placeholder:text-slate-300 focus:ring-0 focus:border-brand-black transition-all uppercase tracking-widest"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
           </div>
        </div>

        <Card className="bento-card overflow-hidden bg-white">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                       <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">BRAND & CLIENT</th>
                       <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">INTEREST</th>
                       <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">ORDERS</th>
                       <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">PLAN OMSET</th>
                       <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">EST. VALUE</th>
                       <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">FU STATUS</th>
                       <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">ACTIONS</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {filtered && filtered.length > 0 ? (
                       filtered.map((lead: any, idx: number) => {
                          const fuStatus = lead.followUpStatus || "NOT_FOLLOWED_UP";
                          const fuCfg = FU_CONFIG[fuStatus as keyof typeof FU_CONFIG] || FU_CONFIG.NOT_FOLLOWED_UP;

                          return (
                             <tr key={lead.id} className="group hover:bg-slate-50/50 transition-all cursor-default">
                                <td className="px-6 py-4">
                                   <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center group-hover:bg-brand-black transition-all group-hover:scale-105">
                                         <Star className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                                      </div>
                                      <div>
                                         <p className="text-[11px] font-black text-brand-black uppercase italic group-hover:text-primary transition-colors">{lead.brandName || lead.clientName}</p>
                                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">VIP PARTNER ID: {lead.id.slice(0, 8)}</p>
                                      </div>
                                   </div>
                                </td>
                                <td className="px-6 py-4">
                                   <p className="text-[10px] font-black text-blue-600 uppercase italic tracking-tight">{lead.productInterest || "—"}</p>
                                </td>
                                <td className="px-4 py-4 text-center">
                                   <span className="text-xl font-black text-emerald-700 tabular italic">{lead.orderCount || 2}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                   <p className="text-[10px] font-black text-brand-black tabular group-hover:scale-105 transition-transform origin-right">{formatCurrency(Number(lead.planOmset || 0))}</p>
                                </td>
                                <td className="px-6 py-4 text-right">
                                   <p className="text-[10px] font-black text-emerald-600 tabular group-hover:scale-105 transition-transform origin-right">{formatCurrency(Number(lead.estimatedValue || 0))}</p>
                                </td>
                                <td className="px-6 py-4 text-center">
                                   <span className={cn("text-[9px] font-black uppercase px-3 py-1 rounded-md border tabular", fuCfg.color.replace("bg-", "bg-opacity-20 border-"))}>
                                      {fuCfg.label}
                                   </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                   <Button
                                      className="h-9 px-6 bg-brand-black text-white hover:bg-slate-800 font-black uppercase text-[9px] rounded-xl shadow-lg shadow-slate-200 transition-all active:scale-95 group/btn"
                                      onClick={() => { setSelectedLead(lead); setIsActionModalOpen(true); }}
                                   >
                                      FU ANALYSIS <ChevronRight className="w-3 h-3 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                                   </Button>
                                </td>
                             </tr>
                          );
                       })
                    ) : (
                       <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-[10px] font-bold text-slate-300 uppercase italic">
                             Loyalty Metrics Pending Sync
                          </td>
                       </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </Card>
      </div>

      <BussdevActionDialog
        isOpen={isActionModalOpen}
        onOpenChange={setIsActionModalOpen}
        lead={selectedLead}
      />
    </div>
  );
}

