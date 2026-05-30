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
  Clock, 
  ChevronRight,
  Calendar,
  BarChart3,
  Activity
} from "lucide-react";
import { StatCard, TableWrapper, DnaButton, DnaInput, DnaBadge } from "@/components/dna";
import { TableShell } from "@/components/layout/TableShell";

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
    <TableShell
      title="SHIPPING"
      titleAccent="LOGS"
      subtitle="HISTORICAL DELIVERY RECORDS & EFFICIENCY ANALYTICS"
      actions={
        <div className="flex items-center gap-3">
           <DnaButton variant="outline" size="lg" className="italic" icon={<Download />}>
               EXPORT CSV
            </DnaButton>
            <DnaButton variant="secondary" size="lg" className="italic shadow-xl shadow-slate-100" icon={<BarChart3 />}>
               ANALYTICS
            </DnaButton>
        </div>
      }
    >

      {/* 📊 II. PERFORMANCE SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <StatCard label="DELIVERIES (WEEK)" value="42" icon={<Truck />} />
         <StatCard label="AVG. LEAD TIME" value="3.5h" icon={<Clock />} />
         <StatCard label="SUCCESS RATE" value="99.2%" icon={<CheckCircle2 />} />
         <StatCard label="ON-TIME SCORE" value="95%" icon={<Activity />} />
      </div>

      {/* 🔍 III. ARCHIVE SEARCH & LOGS */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
           <div className="relative flex-1 group">
               <DnaInput 
                 icon={<Search className="h-4 w-4" />}
                 placeholder="SEARCH BY DO#, CLIENT, OR SHIPMENT ID..."
                 className="h-16 bg-white border border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest italic"
               />
           </div>
            <DnaButton variant="ghost" size="lg" className="h-16 px-10 rounded-2xl italic" icon={<Filter />}>
               REFINE ARCHIVE
            </DnaButton>
        </div>

        <TableWrapper>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-table-header text-slate-400">SHIPMENT ID / DO</th>
                  <th className="px-6 py-4 text-table-header text-slate-400">CONSIGNEE</th>
                  <th className="px-6 py-4 text-table-header text-slate-400">LOGISTICS META</th>
                  <th className="px-6 py-4 text-table-header text-slate-400">ARRIVAL</th>
                  <th className="px-6 py-4 text-table-header text-slate-400 text-center">RESULT</th>
                  <th className="px-6 py-4 text-table-header text-slate-400 text-right">MANIFEST</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shippingLogs?.map((log: any) => (
                  <tr key={log.id} className="group hover:bg-slate-50/50 transition-all cursor-default">
                    <td className="px-6 py-6">
                       <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-white text-slate-900 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm border border-slate-200">
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
<DnaBadge status={log.status === 'SUCCESS' ? "success" : "critical"}>
                           {log.status}
                        </DnaBadge>
                    </td>
                    <td className="px-6 py-6 text-right">
                        <DnaButton variant="outline" size="sm" className="italic">
                           VIEW RECEIPT <ChevronRight className="ml-2 h-3 w-3" />
                        </DnaButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TableWrapper>
      </div>
    </TableShell>
  );
}

