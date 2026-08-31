import React from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/dna";
import { Calendar, Factory, ClipboardList } from "lucide-react";
import { getMockData } from "@/lib/mock-data";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

// PROTOTYPE MODE — same hardened gate as `lib/api.ts`:
// prototype mode is REFUSED in production builds even if the env var
// is set. See `frontend/src/lib/api.ts` for the canonical rule.
const NEX_PROTOTYPE_ALLOW = process.env.NEXT_PUBLIC_PROTOTYPE_ALLOW === "true";
const IS_PRODUCTION_BUILD = process.env.NODE_ENV === "production";
const IS_PROTOTYPE_MODE =
 NEX_PROTOTYPE_ALLOW &&
 !IS_PRODUCTION_BUILD &&
 process.env.NEXT_PUBLIC_PROTOTYPE_MODE === "true";

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
 // PROTOTYPE MODE: kalau fetch ke backend gagal, pakai data contoh.
 // Production build (NODE_ENV=production) NEVER falls back to mock data.
 const live = await fetchFromApi("/production/dashboard");
 const data = IS_PROTOTYPE_MODE ? (live ?? getMockData("/production/dashboard")) : live;

 const cards = data?.cards || {};

 return (
 <DashboardShell
 title="PRODUCTION"
 titleAccent="DASHBOARD"
 subtitle="Production management hub"
 >
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <StatCard
 label="Output"
 value={`${cards.achievement?.actual || 0} pcs`}
 subValue={`${cards.achievement?.completedOrders || 0} completed`}
 icon={<Factory />}
 />
 <StatCard
 label="Quality Rate"
 value={`${100 - (cards.quality?.defectRate || 0)}%`}
 subValue="Pass rate"
 icon={<ClipboardList />}
 />
 <StatCard
 label="WIP"
 value={(data?.workshops?.queue || 0) + (data?.workshops?.mixing || 0) + (data?.workshops?.filling || 0) + (data?.workshops?.packing || 0)}
 subValue="Work in Progress"
 icon={<Factory />}
 />
 <StatCard
 label="Active Schedules"
 value={cards.achievement?.totalOrders || 0}
 subValue="In production"
 icon={<Calendar />}
 />
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <Link href="/production/schedule" className="p-6 bg-white border border-slate-200 rounded-2xl hover:border-[#E2E8F0] hover: transition-all group">
 <Calendar className="w-6 h-6 text-slate-400 group-hover:text-slate-900 mb-3" />
 <p className="text-sm font-black uppercase">Penjadwalan</p>
 <p className="text-[10px] text-slate-400 mt-1">Schedule & Gantt Chart</p>
 </Link>
 <Link href="/production/operations" className="p-6 bg-white border border-slate-200 rounded-2xl hover:border-[#E2E8F0] hover: transition-all group">
 <Factory className="w-6 h-6 text-slate-400 group-hover:text-slate-900 mb-3" />
 <p className="text-sm font-black uppercase">Operasional</p>
 <p className="text-[10px] text-slate-400 mt-1">Work Orders & Progress Tracking</p>
 </Link>
 <Link href="/production/batch-records" className="p-6 bg-white border border-slate-200 rounded-2xl hover:border-[#E2E8F0] hover: transition-all group">
 <ClipboardList className="w-6 h-6 text-slate-400 group-hover:text-slate-900 mb-3" />
 <p className="text-sm font-black uppercase">Batch Records</p>
 <p className="text-[10px] text-slate-400 mt-1">Production Log & Documentation</p>
 </Link>
 </div>
 </DashboardShell>
 );
}
