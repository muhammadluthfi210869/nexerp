"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { DnaPageContainer, DnaPageHeader, DnaKpiGrid, DnaDataTableCard, DnaStatCard } from "@/components/dna";
import { Factory, TrendingUp, AlertTriangle, ClipboardCheck, Clock, Gauge } from "lucide-react";

// SPEC: SCR-PROD-MINE-001 — Personal Operator Performance dashboard

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
    <DnaPageContainer>
      <DnaPageHeader
        title="My"
        subtitle="Personal production output and work order metrics. Only your assigned work is shown here."
      />
      <div className="space-y-10">
        <DnaKpiGrid
          cards={[
            { key: "my-wo", title: "My WOs", value: String(totalWO), deltaText: totalWO >= 5 ? "On track" : "Below target", isDeltaPositive: totalWO >= 5, icon: <Factory className="w-4 h-4" />, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
            { key: "active", title: "Active WOs", value: String(activeWO), deltaText: activeWO <= 3 ? "Healthy" : "Overload", isDeltaPositive: activeWO <= 3, icon: <Clock className="w-4 h-4" />, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
            { key: "completed", title: "Completed", value: String(completedWO), deltaText: completedWO > 0 ? "On track" : "Pending", isDeltaPositive: completedWO > 0, icon: <ClipboardCheck className="w-4 h-4" />, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
            { key: "quality", title: "Quality", value: String(completedWO || 0), deltaText: "Target 50%", isDeltaPositive: true, icon: <Gauge className="w-4 h-4" />, iconBg: "bg-sky-50", iconColor: "text-sky-600" },
          ]}
        />

        <DnaDataTableCard title="My Work Orders" count={(myWorkOrders || []).length}>
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider">
                <th className="px-6 py-4">WO#</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Qty</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(myWorkOrders || []).slice(0, 10).map((wo: any, i: number) => (
                <tr key={wo.id || i} className="hover:bg-slate-50/80">
                  <td className="text-[11px] font-bold text-blue-600 tabular-nums px-6 py-4">{wo.woNumber || wo.id?.slice(0, 8) || "—"}</td>
                  <td className="text-[11px] font-bold text-slate-700 px-6 py-4">{wo.product || "—"}</td>
                  <td className="px-6 py-4"><span className="text-[9px] font-bold text-slate-500 uppercase">{wo.status || "—"}</span></td>
                  <td className="text-[11px] font-bold text-slate-700 tabular-nums px-6 py-4">{wo.qty || "—"}</td>
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
        </DnaDataTableCard>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider mb-3">Activity Summary</h2>
            <div className="bg-white border border-slate-200 rounded-3xl p-8">
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-[11px] font-bold text-slate-600">Active WOs</span>
                  <span className="text-[11px] font-bold text-blue-600 tabular-nums">{activeWO}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-[11px] font-bold text-slate-600">Pending Audits</span>
                  <span className="text-[11px] font-bold text-amber-600 tabular-nums">{stats?.pendingAudits || 0}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-[11px] font-bold text-slate-600">Completed</span>
                  <span className="text-[11px] font-bold text-emerald-600 tabular-nums">{completedWO}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider mb-3">Tips</h2>
            <div className="bg-white border border-slate-200 rounded-3xl p-8">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-2xl text-[10px] font-bold text-blue-800">
                  <TrendingUp className="w-4 h-4 shrink-0" />
                  Target output: 100% of planned quantity per WO
                </div>
                <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[10px] font-bold text-amber-800">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Report breakdowns immediately to minimize downtime
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DnaPageContainer>
  );
}
