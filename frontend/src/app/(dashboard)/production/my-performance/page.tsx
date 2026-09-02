"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { KpiCard } from "@/components/dna/KpiCard";
import { SectionLabel } from "@/components/dna/SectionLabel";
import { Factory, TrendingUp, AlertTriangle, ClipboardCheck, Clock, Gauge } from "lucide-react";

export default function ProductionMyPerformancePage() {
  const { data: stats } = useQuery({
    queryKey: ["my-dashboard-stats"],
    queryFn: async () => {
      const res = await api.get("/my-dashboard/stats");
      return res.data;
    },
    refetchInterval: 30000,
  });

  const { data: myWorkOrders } = useQuery({
    queryKey: ["my-performance-work-orders"],
    queryFn: async () => (await api.get<any[]>("/production/work-orders?mine=true")).data,
  });

  const activeWO = myWorkOrders?.filter((wo: any) => wo.status !== "DONE" && wo.status !== "CLOSED").length || 0;
  const completedWO = myWorkOrders?.filter((wo: any) => wo.status === "DONE").length || 0;
  const totalWO = myWorkOrders?.length || 0;

  return (
    <DashboardShell
      title="My"
      titleAccent="Performance"
      subtitle="Personal production output and work order metrics. Only your assigned work is shown here."
    >
      <div className="space-y-10">
        <div className="grid grid-cols-4 gap-8">
          <KpiCard label="My WOs" value={String(totalWO)} targetPct={totalWO >= 5 ? 100 : totalWO * 20} icon={<Factory />} />
          <KpiCard label="Active WOs" value={String(activeWO)} targetPct={activeWO <= 3 ? 100 : Math.max(0, 100 - activeWO * 10)} icon={<Clock />} />
          <KpiCard label="Completed" value={String(completedWO)} targetPct={completedWO > 0 ? 100 : 0} icon={<ClipboardCheck />} />
          <KpiCard label="Quality" value={String(completedWO || 0)} targetPct={50} icon={<Gauge />} />
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-8">
          <SectionLabel>My Work Orders</SectionLabel>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#F9FAFB] border-b">
                  <th className="text-table-header text-slate-400 px-6 py-4">WO#</th>
                  <th className="text-table-header text-slate-400 px-6 py-4">Product</th>
                  <th className="text-table-header text-slate-400 px-6 py-4">Status</th>
                  <th className="text-table-header text-slate-400 px-6 py-4">Qty</th>
                  <th className="text-table-header text-slate-400 px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {(myWorkOrders || []).slice(0, 10).map((wo: any, i: number) => (
                  <tr key={wo.id || i}>
                    <td className="text-[11px] font-black text-blue-600 tabular px-6 py-4">{wo.woNumber || wo.id?.slice(0, 8) || "—"}</td>
                    <td className="text-[11px] font-bold text-slate-700 px-6 py-4">{wo.product || "—"}</td>
                    <td className="px-6 py-4"><span className="text-[9px] font-black text-slate-500 uppercase">{wo.status || "—"}</span></td>
                    <td className="text-[11px] font-bold text-slate-700 tabular px-6 py-4">{wo.qty || "—"}</td>
                    <td className="text-[10px] font-bold text-slate-400 px-6 py-4">{wo.createdAt ? new Date(wo.createdAt).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
                {(!myWorkOrders || myWorkOrders.length === 0) && (
                  <tr>
                    <td colSpan={5} className="text-center text-[11px] font-bold text-slate-400 py-12">No work orders assigned yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="bg-white border border-slate-200 rounded-3xl p-8">
            <SectionLabel>Activity Summary</SectionLabel>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-[11px] font-bold text-slate-600">Active WOs</span>
                <span className="text-[11px] font-black text-blue-600 tabular">{activeWO}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-[11px] font-bold text-slate-600">Pending Audits</span>
                <span className="text-[11px] font-black text-amber-600 tabular">{stats?.pendingAudits || 0}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[11px] font-bold text-slate-600">Completed</span>
                <span className="text-[11px] font-black text-emerald-600 tabular">{completedWO}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-8">
            <SectionLabel>Tips</SectionLabel>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 p-3 bg-[#EFF6FF] border border-[#DBEAFE] rounded-[16px] text-[10px] font-bold text-[#1E40AF]">
                <TrendingUp className="w-4 h-4 flex-shrink-0" />
                Target output: 100% of planned quantity per WO
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#FEF9C3] border border-[#FEF08A] rounded-[16px] text-[10px] font-bold text-[#854D0E]">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                Report breakdowns immediately to minimize downtime
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
