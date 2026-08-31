"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { SectionLabel } from "@/components/dna/SectionLabel";
import {
  MetricCard,
  CanonicalMetricGrid,
  SectionCard,
  DataTable,
  StatusBadge,
  mapStatus,
  type DataTableProps,
} from "@/components/canonical";
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

  const columns: DataTableProps<any>["columns"] = React.useMemo(
    () => [
      { id: "client", header: "Client", accessorKey: "clientName" },
      { id: "brand", header: "Brand", accessorKey: "brandName" },
      {
        id: "status",
        header: "Status",
        cell: ({ row }: any) => <StatusBadge variant={mapStatus(row.original.status)}>{row.original.status || "—"}</StatusBadge>,
      },
      {
        id: "value",
        header: "Value",
        cell: ({ row }: any) =>
          row.original.estimatedValue
            ? `Rp ${(Number(row.original.estimatedValue) / 1e6).toFixed(0)}M`
            : "—",
      },
    ],
    [],
  );

  return (
    <DashboardShell
      title="My"
      titleAccent="Performance"
      subtitle="Personal sales performance metrics. Only your data is shown here."
    >
      <div className="space-y-10">
        <CanonicalMetricGrid>
          <MetricCard label="My Leads" value={String(myLeadCount)} subValue={`Target ${myLeadCount >= 10 ? "✓" : `${myLeadCount}/10`}`} icon={<Users />} />
          <MetricCard label="Contact Rate" value={`${myContactRate}%`} subValue="Across my leads" icon={<Phone />} />
          <MetricCard label="My Deals" value={String(myDeals)} subValue={`Goal ${myDeals >= 3 ? "✓" : `${myDeals}/3`}`} icon={<CheckCircle2 />} />
          <MetricCard label="Deal Rate" value={`${myDealRate}%`} subValue="Won / contacted" icon={<TrendingUp />} />
        </CanonicalMetricGrid>

        <SectionCard>
          <div className="px-1 pt-1">
            <SectionLabel>My Pipeline</SectionLabel>
          </div>
          <div className="mt-4">
            <DataTable<any>
              data={(myLeads || []).slice(0, 10)}
              columns={columns}
              title="My Pipeline"
              searchPlaceholder="Search leads, brands, status..."
              pageSize={10}
              pageSizeOptions={[10, 25, 50]}
            />
          </div>
        </SectionCard>

        <div className="grid grid-cols-2 gap-6">
          <SectionCard>
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
          </SectionCard>

          <SectionCard>
            <SectionLabel>Quick Tips</SectionLabel>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 p-3 bg-[#F0FDF4] border border-[#DCFCE7] rounded-[12px] text-[10px] font-bold text-[#166534]">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                Follow up leads within 24 hours to improve contact rate
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#FEF9C3] border border-[#FEF08A] rounded-[12px] text-[10px] font-bold text-[#854D0E]">
                <Clock className="w-4 h-4 flex-shrink-0" />
                Samples stuck &gt;14 days: {stats?.cards?.leads?.value ? "Review now" : "None pending"}
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#EFF6FF] border border-[#DBEAFE] rounded-[12px] text-[10px] font-bold text-[#1E40AF]">
                <TrendingUp className="w-4 h-4 flex-shrink-0" />
                Target deal rate: 15% — aim for 1 deal per 7 qualified leads
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </DashboardShell>
  );
}