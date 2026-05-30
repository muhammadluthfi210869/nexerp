"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  FlaskConical, 
  Search, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ChevronRight,
  Timer,
  History,
  Beaker,
  Thermometer,
  CloudRain,
  ShieldCheck,
  MoreVertical,
  Activity
} from "lucide-react";
import { DnaBadge } from "@/components/dna/DnaBadge";
import { StatCard } from "@/components/dna/StatCard";
import { DataCard } from "@/components/dna/DataCard";
import { DnaButton } from "@/components/dna/DnaButton";
import { TableWrapper } from "@/components/dna/TableWrapper";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default function StabilityTestingPage() {
  const { data: stabilityLogs, isLoading } = useQuery({
    queryKey: ["stability-logs"],
    queryFn: async () => {
      const res = await api.get("/rnd/lab-test-results", { params: { type: "stability" } });
      return (res.data || []).map((r: any) => ({
        id: r.id.substring(0, 8).toUpperCase(),
        product: r.formula?.name || "Unknown",
        batch: r.formula?.sampleRequest?.sampleCode || "—",
        startDate: new Date(r.testDate).toISOString().split('T')[0],
        currentMonth: Math.floor((Date.now() - new Date(r.testDate).getTime()) / (30 * 24 * 60 * 60 * 1000)) || 1,
        status: r.stability40C === "STABLE" && r.stabilityRT === "STABLE" ? "STABLE" : "MONITORING",
        nextTest: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      }));
    }
  });

  return (
    <DashboardShell
      title="Stability"
      titleAccent="Testing"
      subtitle="Accelerated & real-time stability verification protocols"
      actions={
        <div className="flex gap-4">
           <DnaButton variant="outline" className="rounded-[14px] text-[12px]">
              <History className="mr-2 h-4 w-4" /> Stability Archives
           </DnaButton>
           <DnaButton variant="secondary" className="rounded-[14px] text-[12px]">
              <Timer className="mr-2 h-5 w-5" /> Start New Study
           </DnaButton>
        </div>
      }
    >

      {/* Environmental Chamber Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatCard
            label="Chamber A: Accelerated"
            value="40°C"
            subValue="75% RH / Status: Operating within scientific threshold"
            icon={<Thermometer className="h-4 w-4" />}
          />

         <StatCard
            label="Chamber B: Real-Time"
            value="25°C"
            subValue="60% RH / Status: Stable"
            icon={<CloudRain className="h-4 w-4" />}
         />

         <DataCard title="Active Studies" className="bg-blue-600 text-white relative overflow-hidden" titleColor="text-blue-200">
            <h3 className="text-4xl font-black text-white mt-2">12 <span className="text-lg font-light">Samples</span></h3>
            <div className="flex gap-2">
               <DnaBadge status="default" className="bg-white/10 text-white border-none">Skin: 8</DnaBadge>
               <DnaBadge status="default" className="bg-white/10 text-white border-none">Color: 4</DnaBadge>
            </div>
         </DataCard>
      </div>

      {/* Stability Logs Table */}
      <TableWrapper>
         <table>
            <thead className="bg-[#F8FAFC]">
               <tr className="hover:bg-transparent border-[var(--border-color)]">
                  <th className="py-6 pl-10 text-table-header">Study ID</th>
                  <th className="text-table-header">Product / Formulation</th>
                  <th className="text-table-header text-center">Interval</th>
                  <th className="text-table-header">Next Test Gate</th>
                  <th className="text-table-header text-center">Integrity Status</th>
                  <th className="pr-10 text-right text-table-header">Actions</th>
               </tr>
            </thead>
            <tbody>
               {stabilityLogs?.map((log: any) => (
                  <tr key={log.id} className="group hover:bg-blue-50/30 transition-all duration-300 border-b border-[var(--border-color)]">
                     <td className="py-6 pl-10">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-gray-100 text-gray-900 flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                               <Timer className="h-5 w-5 text-blue-400" />
                            </div>
                           <div className="flex flex-col">
                              <span className="font-bold text-slate-900 tracking-tight text-sm">{log.id}</span>
                              <span className="text-[11px] font-medium text-slate-400">Started: {log.startDate}</span>
                           </div>
                        </div>
                     </td>
                     <td>
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                              <Beaker className="h-4 w-4 text-slate-400" />
                           </div>
                           <div>
                              <p className="font-semibold text-slate-900 text-sm">{log.product}</p>
                              <p className="text-[11px] font-medium text-slate-400">Batch: {log.batch}</p>
                           </div>
                        </div>
                     </td>
                     <td className="text-center">
                        <DnaBadge status="default">MONTH {log.currentMonth}</DnaBadge>
                     </td>
                     <td>
                        <div className="flex items-center gap-2">
                           <Calendar className="h-3.5 w-3.5 text-slate-400" />
                           <p className="font-medium text-slate-500 text-[11px]">{log.nextTest}</p>
                        </div>
                     </td>
                     <td className="text-center">
                        <DnaBadge status={log.status === 'STABLE' ? "success" : "critical"}>
                           {log.status}
                        </DnaBadge>
                     </td>
                     <td className="pr-10 text-right">
                         <DnaButton variant="outline" className="h-9 px-4 text-[10px]">
                            Log Result <ChevronRight className="ml-2 h-3 w-3" />
                         </DnaButton>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </TableWrapper>
    </DashboardShell>
  );
}

