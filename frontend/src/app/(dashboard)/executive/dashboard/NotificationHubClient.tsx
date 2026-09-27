"use client";

import {
  ShieldAlert,
  Wallet,
  Activity,
  Zap,
  Clock,
  AlertCircle,
  ArrowRight,
  TrendingDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, Badge } from "@/components/dna";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const ProblemCard = ({ title, icon: Icon, color, issues }: { title: string, icon: any, color: string, issues: any[] }) => (
  <Card className="rounded-2xl p-5 border border-slate-100 bg-white flex flex-col h-full shadow-sm hover:shadow-md transition-all">
    <div className="flex justify-between items-center mb-5">
      <div className="flex items-center gap-2.5">
        <div className={cn(
          "p-2 rounded-xl",
          color === 'red' ? "bg-rose-50 text-rose-500" :
          color === 'amber' ? "bg-amber-50 text-amber-500" :
          color === 'indigo' ? "bg-indigo-50 text-indigo-500" :
          "bg-slate-50 text-slate-500"
        )}>
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="text-[11px] font-black uppercase tracking-widest text-brand-black italic">{title}</h3>
      </div>
      <Badge className={cn(
        "text-[8px] font-black uppercase px-2",
        issues.length > 2 ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-400"
      )}>
        {issues.length} ISSUES
      </Badge>
    </div>

    <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar">
      {issues.map((issue, i) => (
        <div key={i} className={cn(
          "p-3 rounded-2xl border transition-all flex gap-3 group cursor-pointer",
          issue.severity === 'critical' ? "bg-rose-50/50 border-rose-100/50 hover:bg-rose-50" : "bg-slate-50/50 border-slate-100/50 hover:bg-slate-50"
        )}>
          <div className="mt-0.5">
            {issue.severity === 'critical' ? (
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-slate-300" />
            )}
          </div>
          <div className="flex-1">
            <p className={cn(
              "text-[10px] font-bold leading-tight",
              issue.severity === 'critical' ? "text-rose-900" : "text-slate-600"
            )}>{issue.message}</p>
            <div className="flex justify-between items-center mt-2">
              <span className="text-[7px] font-black uppercase tracking-widest text-slate-300">{issue.time}</span>
              <ArrowRight className="w-2.5 h-2.5 text-slate-300 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </Card>
);

type Issue = { severity: "critical" | "normal"; message: string; time: string };
type Group = {
  title: string;
  icon: any;
  color: string;
  detailed?: { alerts?: string[] };
  counts: { label: string; value: number | undefined }[];
};

/** Live counts + the backend's own alert strings -> what ProblemCard renders. */
function toIssues(group: Group): Issue[] {
  const fromCounts = group.counts
    .filter((c): c is { label: string; value: number } => (c.value ?? 0) > 0)
    .map((c) => ({ severity: "critical" as const, message: `${c.value} ${c.label}`, time: "" }));
  const fromBackend = (group.detailed?.alerts ?? []).map((message) => ({
    severity: "normal" as const,
    message,
    time: "",
  }));
  return [...fromCounts, ...fromBackend];
}

export default function NotificationHubClient() {
  const { data } = useQuery({
    queryKey: ["executive-alerts"],
    queryFn: () => api.get("/executive/alerts").then((res) => res.data),
  });
  const a = data ?? {};

  const diagnosticData: Group[] = [
    {
      title: "KEUANGAN (CASH RISK)",
      icon: Wallet,
      color: "red",
      detailed: a.cashflow,
      counts: [
        { label: "Invoice overdue", value: a.cashflow?.overdueInvoices },
        { label: "Invoice nilai besar belum dibayar", value: a.cashflow?.largeUnpaid },
      ],
    },
    {
      title: "PRODUKSI (OPS DELAY)",
      icon: Activity,
      color: "amber",
      detailed: a.production,
      counts: [
        { label: "Work order lewat deadline", value: a.production?.overdue },
        { label: "Work order mendekati deadline", value: a.production?.nearDeadline },
        { label: "Bottleneck terdeteksi", value: a.production?.bottlenecks },
      ],
    },
    {
      title: "MARKETING & SALES",
      icon: Zap,
      color: "amber",
      detailed: a.sales,
      counts: [
        { label: "Lead belum difollow-up", value: a.sales?.unfollowed },
        { label: "Deal macet di pipeline", value: a.sales?.stuck },
      ],
    },
    {
      title: "REPEAT ORDER & LOST RISK",
      icon: TrendingDown,
      color: "indigo",
      detailed: { alerts: [...(a.repeatOrder?.alerts ?? []), ...(a.lostRisk?.alerts ?? [])] },
      counts: [
        { label: "Client jatuh tempo reorder", value: a.repeatOrder?.readyThisWeek },
        { label: "Client berisiko churn", value: a.lostRisk?.churnRisk },
        { label: "Deal berisiko", value: a.lostRisk?.dealAtRisk },
      ],
    },
  ];

  return (
    <div className="p-4 bg-[#fafafa] h-screen flex flex-col gap-4 overflow-hidden">
      
      {/* 1. DIAGNOSTIC HEADER */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shrink-0 shadow-xl shadow-slate-200">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-[14px] font-black text-gray-900 uppercase tracking-tighter leading-none italic">System Diagnostics Hub</h1>
            <p className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] mt-1">Cross-Departmental Intelligence Feed</p>
          </div>
        </div>
        <div className="flex gap-4">
           <div className="text-right">
              <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">SYSTEM STATUS</p>
              <div className="flex items-center gap-2 mt-0.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                 <span className="text-[10px] font-black text-rose-500 uppercase">Attention Required</span>
              </div>
           </div>
        </div>
      </div>

      {/* 1.1 SYSTEM ALERT BAR - INTEGRATED */}
      <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-3 flex items-center gap-6 shrink-0 shadow-sm">
        <div className="flex items-center gap-2 shrink-0 px-4 border-r border-rose-200">
           <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
           <span className="text-[10px] font-black text-rose-600 uppercase tracking-tighter whitespace-nowrap italic">SYSTEM ALERT</span>
        </div>
        <div className="flex items-center gap-8 overflow-x-auto whitespace-nowrap">
           {[
             { count: a.production?.overdue, val: "TELAT PRODUKSI", color: "text-rose-600" },
             { count: a.cashflow?.overdueInvoices, val: "BELUM BAYAR", color: "text-rose-600" },
             { count: a.sales?.unfollowed, val: "BELUM FOLLOW UP", color: "text-amber-600" },
           ].map((alert, i) => (
             <div key={i} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <p className="text-[9px] font-black text-brand-black uppercase"><span className={alert.color}>{alert.count ?? 0}</span> {alert.val}</p>
             </div>
           ))}
        </div>
      </div>

      {/* 2. PROBLEM MATRIX GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 overflow-hidden min-h-0">
        {diagnosticData.map((dept, i) => (
          <ProblemCard 
            key={i}
            title={dept.title}
            icon={dept.icon}
            color={dept.color}
            issues={toIssues(dept)}
          />
        ))}
      </div>

      {/* 3. FOOTER LEGEND */}
      <div className="flex justify-between items-center px-2 shrink-0 pb-1">
        <div className="flex gap-6">
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">CRITICAL INTERVENTION</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">OPERATIONAL WARNING</span>
           </div>
        </div>
        <button className="bg-white border border-slate-100 text-[8px] font-black px-4 py-2 rounded-xl uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">
          Mark All As Reviewed
        </button>
      </div>
    </div>
  );
}

