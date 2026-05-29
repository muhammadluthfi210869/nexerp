import React from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/dna";
import { Calendar, Factory, AlertTriangle, Activity, ShieldAlert, BarChart3, Package } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

async function fetchFromApi(path: string) {
  try {
    const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function ProductionDashboardPage() {
  const data = await fetchFromApi("/production/dashboard");

  const cards = data?.cards || {};

  return (
    <DashboardShell
      title="PRODUCTION"
      titleAccent="DASHBOARD"
      subtitle="Real-time production monitoring & intelligence hub"
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          label="Output"
          value={`${cards.output?.total || 0} pcs`}
          subValue={`${cards.output?.completed || 0} completed`}
          icon={<Activity />}
        />
        <StatCard
          label="Quality Rate"
          value={`${cards.quality?.rate || 0}%`}
          subValue="Pass rate against standard"
          icon={<ShieldAlert />}
        />
        <StatCard
          label="OEE"
          value={`${data?.oee?.average || 0}%`}
          subValue="Overall Equipment Effectiveness"
          icon={<BarChart3 />}
        />
        <StatCard
          label="WIP"
          value={data?.wip || 0}
          subValue="Work in Progress"
          icon={<Package />}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/production/schedule" className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-slate-900 hover:shadow-lg transition-all group">
          <Calendar className="w-5 h-5 text-slate-400 group-hover:text-slate-900 mb-3" />
          <p className="text-xs font-black uppercase">Penjadwalan</p>
          <p className="text-[9px] font-bold text-slate-400 mt-1">Schedule & Gantt</p>
        </Link>
        <Link href="/production/floor" className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-slate-900 hover:shadow-lg transition-all group">
          <Factory className="w-5 h-5 text-slate-400 group-hover:text-slate-900 mb-3" />
          <p className="text-xs font-black uppercase">Operasional</p>
          <p className="text-[9px] font-bold text-slate-400 mt-1">Production Floor</p>
        </Link>
        <Link href="/production/batch-records" className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-slate-900 hover:shadow-lg transition-all group">
          <Activity className="w-5 h-5 text-slate-400 group-hover:text-slate-900 mb-3" />
          <p className="text-xs font-black uppercase">Pipeline</p>
          <p className="text-[9px] font-bold text-slate-400 mt-1">Batch Records</p>
        </Link>
        <Link href="/production/leakage" className="p-5 bg-white border border-slate-200 rounded-2xl hover:border-slate-900 hover:shadow-lg transition-all group">
          <AlertTriangle className="w-5 h-5 text-slate-400 group-hover:text-slate-900 mb-3" />
          <p className="text-xs font-black uppercase">Leakage</p>
          <p className="text-[9px] font-bold text-slate-400 mt-1">Loss Analysis</p>
        </Link>
      </div>
    </DashboardShell>
  );
}
