import React from "react";
import Link from "next/link";
import { DnaPageContainer } from "@/components/dna";
import { DnaPageHeader } from "@/components/dna";
import { DnaStatCard } from "@/components/dna";
import { Calendar, Factory, ClipboardList } from "lucide-react";

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
    <DnaPageContainer>
      <DnaPageHeader
        title="PRODUCTION"
        subtitle="Production management hub"
      />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-6">
        <DnaStatCard
          label="Output"
          value={`${cards.achievement?.actual || 0} pcs`}
          subtext={`${cards.achievement?.completedOrders || 0} completed`}
          icon={<Factory />}
        />
        <DnaStatCard
          label="Quality Rate"
          value={`${100 - (cards.quality?.defectRate || 0)}%`}
          subtext="Pass rate"
          icon={<ClipboardList />}
        />
        <DnaStatCard
          label="WIP"
          value={(data?.workshops?.queue || 0) + (data?.workshops?.mixing || 0) + (data?.workshops?.filling || 0) + (data?.workshops?.packing || 0)}
          subtext="Work in Progress"
          icon={<Factory />}
        />
        <DnaStatCard
          label="Active Schedules"
          value={cards.achievement?.totalOrders || 0}
          subtext="In production"
          icon={<Calendar />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/production/schedule" className="p-6 bg-white border border-slate-200 rounded-2xl hover:border-slate-900 hover:shadow-lg transition-all group">
          <Calendar className="w-6 h-6 text-slate-400 group-hover:text-slate-900 mb-3" />
          <p className="text-sm font-black uppercase">Penjadwalan</p>
          <p className="text-[10px] text-slate-400 mt-1">Schedule & Gantt Chart</p>
        </Link>
        <Link href="/production/operations" className="p-6 bg-white border border-slate-200 rounded-2xl hover:border-slate-900 hover:shadow-lg transition-all group">
          <Factory className="w-6 h-6 text-slate-400 group-hover:text-slate-900 mb-3" />
          <p className="text-sm font-black uppercase">Operasional</p>
          <p className="text-[10px] text-slate-400 mt-1">Work Orders & Progress Tracking</p>
        </Link>
        <Link href="/production/batch-records" className="p-6 bg-white border border-slate-200 rounded-2xl hover:border-slate-900 hover:shadow-lg transition-all group">
          <ClipboardList className="w-6 h-6 text-slate-400 group-hover:text-slate-900 mb-3" />
          <p className="text-sm font-black uppercase">Batch Records</p>
          <p className="text-[10px] text-slate-400 mt-1">Production Log & Documentation</p>
        </Link>
      </div>
    </DnaPageContainer>
  );
}
