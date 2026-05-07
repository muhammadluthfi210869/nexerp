"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  History, 
  Search, 
  Download, 
  Filter, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronRight,
  FileText,
  MapPin,
  Calendar,
  BarChart3,
  Package,
  Boxes,
  Activity
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function ShippingLogsPage() {
  const { data: shippingLogs, isLoading } = useQuery({
    queryKey: ["shipping-logs"],
    queryFn: async () => {
      return [
        { id: "SHP-9901", do: "DO-24001", client: "PT KOSMETIK JAYA", date: "2024-04-20", duration: "4h 20m", fuel: "12.5L", status: "SUCCESS" },
        { id: "SHP-9902", do: "DO-23995", client: "BEAUTY STORE CENTRAL", date: "2024-04-19", duration: "2h 45m", fuel: "8.2L", status: "SUCCESS" },
        { id: "SHP-9903", do: "DO-23990", client: "RETAILINDO UTAMA", date: "2024-04-18", duration: "---", fuel: "---", status: "FAILED" },
      ];
    }
  });

  return (
    <div className="space-y-8">
      {/* 🚀 I. SHIPPING ARCHIVE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-slate-400 rounded-full" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">LOGISTICS PERFORMANCE ARCHIVE</span>
           </div>
           <h1 className="text-4xl font-black text-brand-black tracking-tighter uppercase italic">SHIPPING <span className="text-slate-300">LOGS</span></h1>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">HISTORICAL DELIVERY RECORDS & EFFICIENCY ANALYTICS</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="h-14 px-6 border border-slate-100 bg-white text-brand-black rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-sm italic hover:bg-slate-50 transition-all">
              <Download className="mr-2 h-4 w-4 text-brand-black" /> EXPORT CSV
           </Button>
           <Button className="h-14 px-8 bg-brand-black text-white hover:bg-slate-800 rounded-2xl shadow-xl shadow-slate-100 font-black uppercase tracking-tighter text-sm border-none italic">
              <BarChart3 className="mr-2 h-5 w-5" /> ANALYTICS
           </Button>
        </div>
      </div>

      {/* 📊 II. PERFORMANCE SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <SummaryCard label="DELIVERIES (WEEK)" value="42" color="text-brand-black" icon={Truck} />
         <SummaryCard label="AVG. LEAD TIME" value="3.5h" color="text-blue-600" icon={Clock} />
         <SummaryCard label="SUCCESS RATE" value="99.2%" color="text-emerald-600" icon={CheckCircle2} />
         <SummaryCard label="ON-TIME SCORE" value="95%" color="text-indigo-600" icon={Activity} />
      </div>

      {/* 🔍 III. ARCHIVE SEARCH & LOGS */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
           <div className="relative flex-1 group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-hover:text-brand-black transition-colors" />
              <Input 
                placeholder="SEARCH BY DO#, CLIENT, OR SHIPMENT ID..."
                className="h-16 pl-14 bg-white border border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest italic"
              />
           </div>
           <Button className="h-16 px-10 bg-slate-100 text-brand-black hover:bg-brand-black hover:text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all italic border-none">
              <Filter className="mr-2 h-4 w-4" /> REFINE ARCHIVE
           </Button>
        </div>

        <Card className="bento-card overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">SHIPMENT ID / DO</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">CONSIGNEE</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">LOGISTICS META</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">ARRIVAL</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">RESULT</th>
                  <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">MANIFEST</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shippingLogs?.map((log: any) => (
                  <tr key={log.id} className="group hover:bg-slate-50/50 transition-all cursor-default">
                    <td className="px-6 py-6">
                       <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                             <History className="h-4 w-4 text-slate-400" />
                          </div>
                          <div>
                             <p className="text-[11px] font-black text-brand-black uppercase italic group-hover:text-primary transition-colors">{log.id}</p>
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{log.do}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-6">
                       <p className="text-[11px] font-black text-brand-black uppercase italic">{log.client}</p>
                    </td>
                    <td className="px-6 py-6">
                       <div className="flex items-center gap-6">
                          <div>
                             <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">LEAD TIME</p>
                             <p className="text-[10px] font-black text-brand-black tabular uppercase">{log.duration}</p>
                          </div>
                          <div>
                             <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">FUEL</p>
                             <p className="text-[10px] font-black text-brand-black tabular uppercase">{log.fuel}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-6">
                       <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-slate-300" />
                          <p className="text-[10px] font-black text-slate-500 uppercase tabular">{log.date}</p>
                       </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                       <span className={cn(
                         "px-3 py-1 rounded-lg text-[9px] font-black uppercase tabular border shadow-sm",
                         log.status === 'SUCCESS' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"
                       )}>
                          {log.status}
                       </span>
                    </td>
                    <td className="px-6 py-6 text-right">
                       <Button className="h-9 px-6 font-black uppercase text-[9px] rounded-xl bg-white text-slate-900 border border-slate-100 hover:bg-slate-50 transition-all italic shadow-sm">
                          VIEW RECEIPT <ChevronRight className="ml-2 h-3 w-3" />
                       </Button>
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

function SummaryCard({ label, value, color, icon: Icon }: { label: string; value: string; color: string; icon: any }) {
  return (
     <Card className="bento-card p-8 bg-white flex items-center gap-6 group hover:translate-y-[-5px] transition-all">
        <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
           <Icon className="h-7 w-7 text-slate-300 group-hover:text-brand-black transition-colors" />
        </div>
        <div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
           <p className={cn("text-3xl font-black italic tracking-tighter tabular", color)}>{value}</p>
        </div>
     </Card>
  );
}

