"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { KpiCard } from "@/components/dna/KpiCard";
import { SectionLabel } from "@/components/dna/SectionLabel";
import { Users, CheckCircle2, AlertTriangle, ClipboardCheck, Briefcase } from "lucide-react";

export default function MyDashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ["my-dashboard-stats"],
    queryFn: async () => {
      const res = await api.get("/my-dashboard/stats");
      return res.data;
    },
    refetchInterval: 30000,
  });

  const cards = stats?.cards || {};

  return (
    <DashboardShell title="My" titleAccent="Dashboard" subtitle="Personal performance overview, tasks, and recent activity.">
      <div className="space-y-10">
        {/* KPI ROW */}
        <div className="grid grid-cols-5 gap-8">
          <KpiCard
            label="My Leads"
            value={cards.leads?.value ?? "—"}
            targetPct={cards.leads?.target ? Math.round((cards.leads.value / cards.leads.target) * 100) : 50}
            icon={<Users />}
          />
          <KpiCard
            label="My Deals"
            value={cards.deals?.value ?? "—"}
            targetPct={cards.deals?.target ? Math.round((cards.deals.value / cards.deals.target) * 100) : 50}
            icon={<CheckCircle2 />}
          />
          <KpiCard
            label="Pending Audits"
            value={stats?.pendingAudits ?? "—"}
            targetPct={stats?.pendingAudits > 0 ? Math.max(0, 100 - stats.pendingAudits * 20) : 100}
            icon={<ClipboardCheck />}
          />
          <KpiCard
            label="Active WOs"
            value={stats?.activeWorkOrders ?? "—"}
            targetPct={50}
            icon={<Briefcase />}
          />
          <KpiCard
            label="Recent Activity"
            value={stats?.recentActivity ?? "—"}
            targetPct={50}
            icon={<AlertTriangle />}
          />
        </div>

        {/* TASK LIST */}
        <div className="bg-white border border-slate-200 rounded-[24px] p-8">
          <SectionLabel>Task List</SectionLabel>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded border-2 border-slate-300 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-sm opacity-0" />
                </span>
                <span className="text-[13px] font-semibold text-slate-700">Follow-up: Leads assigned to you</span>
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase">View Leads</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded border-2 border-slate-300 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-sm opacity-0" />
                </span>
                <span className="text-[13px] font-semibold text-slate-700">Complete pending QC audits</span>
              </div>
              <span className="text-[9px] font-black text-rose-500 uppercase">{stats?.pendingAudits || 0} Pending</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded border-2 border-slate-300 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-sm opacity-0" />
                </span>
                <span className="text-[13px] font-semibold text-slate-700">Review active work orders</span>
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase">{stats?.activeWorkOrders || 0} Active</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
