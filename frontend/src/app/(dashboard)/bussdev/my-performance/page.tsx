"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { KpiCard } from "@/components/dna/KpiCard";
import { SectionLabel } from "@/components/dna/SectionLabel";
import { Users, CheckCircle2, DollarSign, TrendingUp, Phone, Clock, AlertTriangle } from "lucide-react";

export default function BussdevMyPerformancePage() {
  const { data: stats } = useQuery({
    queryKey: ["my-dashboard-stats"],
    queryFn: async () => {
      const res = await api.get("/my-dashboard/stats");
      return res.data;
    },
    refetchInterval: 30000,
  });

  const { data: myLeads } = useQuery({
    queryKey: ["my-performance-leads"],
    queryFn: async () => (await api.get<any[]>("/bussdev/leads?mine=true")).data,
  });

  const myLeadCount = myLeads?.length || 0;
  const myContacted = myLeads?.filter((l: any) => l.status !== "NEW_LEAD").length || 0;
  const myDeals = myLeads?.filter((l: any) => l.status === "WON_DEAL").length || 0;
  const myContactRate = myLeadCount > 0 ? Math.round((myContacted / myLeadCount) * 100) : 0;
  const myDealRate = myLeadCount > 0 ? Math.round((myDeals / myLeadCount) * 100) : 0;

  return (
    <DashboardShell
      title="My"
      titleAccent="Performance"
      subtitle="Personal sales performance metrics. Only your data is shown here."
    >
      <div className="space-y-10">
        <div className="grid grid-cols-4 gap-8">
          <KpiCard label="My Leads" value={String(myLeadCount)} targetPct={myLeadCount >= 10 ? 100 : myLeadCount * 10} icon={<Users />} />
          <KpiCard label="Contact Rate" value={`${myContactRate}%`} targetPct={myContactRate} icon={<Phone />} />
          <KpiCard label="My Deals" value={String(myDeals)} targetPct={myDeals >= 3 ? 100 : myDeals * 33} icon={<CheckCircle2 />} />
          <KpiCard label="Deal Rate" value={`${myDealRate}%`} targetPct={myDealRate} icon={<TrendingUp />} />
        </div>

        <div className="bg-white border border-slate-200 rounded-[24px] p-8">
          <SectionLabel>My Pipeline</SectionLabel>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#F9FAFB] border-b">
                  <th className="text-table-header text-slate-400 px-6 py-4">Client</th>
                  <th className="text-table-header text-slate-400 px-6 py-4">Status</th>
                  <th className="text-table-header text-slate-400 px-6 py-4">Brand</th>
                  <th className="text-table-header text-slate-400 px-6 py-4">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {(myLeads || []).slice(0, 10).map((lead: any, i: number) => (
                  <tr key={lead.id || i}>
                    <td className="text-[11px] font-bold text-slate-700 px-6 py-4">{lead.clientName || "—"}</td>
                    <td className="px-6 py-4"><span className="text-[9px] font-black text-slate-500 uppercase">{lead.status || "—"}</span></td>
                    <td className="text-[11px] font-bold text-slate-600 px-6 py-4">{lead.brandName || "—"}</td>
                    <td className="text-[11px] font-bold text-slate-700 tabular px-6 py-4">{lead.estimatedValue ? `Rp ${(lead.estimatedValue / 1e6).toFixed(0)}M` : "—"}</td>
                  </tr>
                ))}
                {(!myLeads || myLeads.length === 0) && (
                  <tr>
                    <td colSpan={4} className="text-center text-[11px] font-bold text-slate-400 py-12">No leads assigned yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="bg-white border border-slate-200 rounded-[24px] p-8">
            <SectionLabel>Activity Summary</SectionLabel>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-[11px] font-bold text-slate-600">Active WOs</span>
                <span className="text-[11px] font-black text-slate-900 tabular">{stats?.activeWorkOrders || 0}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-[11px] font-bold text-slate-600">Pending Audits</span>
                <span className="text-[11px] font-black text-amber-600 tabular">{stats?.pendingAudits || 0}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[11px] font-bold text-slate-600">Recent Activity</span>
                <span className="text-[11px] font-black text-blue-600 tabular">{stats?.recentActivity || 0} events</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[24px] p-8">
            <SectionLabel>Quick Tips</SectionLabel>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 p-3 bg-[#F0FDF4] border border-[#DCFCE7] rounded-[16px] text-[10px] font-bold text-[#166534]">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                Follow up leads within 24 hours to improve contact rate
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#FEF9C3] border border-[#FEF08A] rounded-[16px] text-[10px] font-bold text-[#854D0E]">
                <Clock className="w-4 h-4 flex-shrink-0" />
                Samples stuck &gt;14 days: {stats?.cards?.leads?.value ? "Review now" : "None pending"}
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#EFF6FF] border border-[#DBEAFE] rounded-[16px] text-[10px] font-bold text-[#1E40AF]">
                <TrendingUp className="w-4 h-4 flex-shrink-0" />
                Target deal rate: 15% — aim for 1 deal per 7 qualified leads
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
