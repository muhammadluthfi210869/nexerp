"use client";

import React from "react";
import {
  Archive,
  Package,
  Warehouse,
  Truck,
  Users,
  Tags,
  ArrowRight,
  ShieldCheck,
  Database,
} from "lucide-react";
import Link from "next/link";
import { DashboardCard } from "@/components/dna/DashboardCard";
import { DnaButton } from "@/components/dna/DnaButton";
import { DashboardShell } from "@/components/layout/DashboardShell";

const MASTER_SEGMENTS = [
  {
    title: "Categories",
    description: "System-wide taxonomy for goods, suppliers, and commercial leads.",
    href: "/master/categories",
    icon: Tags,
    stats: "3 Segments",
  },
  {
    title: "Goods Registry",
    description: "Centralized catalog for Raw Materials, Packaging, and Finished Goods.",
    href: "/master/goods",
    icon: Package,
    stats: "CoA Integrated",
  },
  {
    title: "Warehouse Hub",
    description: "Manage storage centers and bin-level location logic tracking.",
    href: "/master/warehouses",
    icon: Warehouse,
    stats: "Geospatial",
  },
  {
    title: "Vendor Network",
    description: "Standardize supplier profiles, payment terms, and procurement links.",
    href: "/master/suppliers",
    icon: Truck,
    stats: "Supply Ready",
  },
  {
    title: "Client Database",
    description: "Commercial master data for brand owners and B2B partnerships.",
    href: "/master/customers",
    icon: Users,
    stats: "CRM Sync",
  },
  {
    title: "Personnel Registry",
    description: "Manage staff profiles, departmental assignments, and PIC links.",
    href: "/master/personnel",
    icon: Users,
    stats: "HRIS Integrated",
  },
];

export default function MasterOverviewPage() {
  return (
    <DashboardShell
      title="System"
      titleAccent="Constitution"
      subtitle="Master data management hub — Centralizing the fundamental registry for cross-divisional workflow synchronization"
      actions={
        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shadow-md">
          <Archive className="h-6 w-6 text-white" />
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {MASTER_SEGMENTS.map((segment, i) => (
          <Link key={i} href={segment.href} className="flex group">
            <DashboardCard className="flex flex-col w-full h-full">
              <div className="flex justify-between items-start mb-8">
                <div className="p-4 rounded-xl bg-slate-100 text-slate-600 group-hover:bg-slate-800 group-hover:text-white transition-all">
                  <segment.icon className="h-8 w-8 stroke-[2px]" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-100 px-3 py-1.5 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all">
                  {segment.stats}
                </span>
              </div>

              <div className="flex-1 space-y-3 mb-8">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                  {segment.title}
                </h3>
                <p className="text-[11px] font-bold text-slate-400 leading-relaxed">
                  {segment.description}
                </p>
              </div>

              <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-wider group-hover:text-blue-600 transition-all">
                Open Segment
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </DashboardCard>
          </Link>
        ))}

        <DashboardCard className="flex flex-col items-center justify-center text-center !border-dashed !border-2 !border-slate-200 !bg-slate-50/50 hover:!border-blue-600/50">
          <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center text-slate-400 mb-6 border border-slate-200 group-hover:rotate-12 transition-transform">
            <Database className="h-7 w-7 text-blue-600" />
          </div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-2">Integrity Scan</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-6">
            Run a system-wide diagnostic on master data relations.
          </p>
          <DnaButton variant="outline" icon={<ShieldCheck />}>
            Initialize Audit
          </DnaButton>
        </DashboardCard>
      </div>

      <DashboardCard className="flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Event-Driven Accounting</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
              All registry items are logically coupled to CoA for automated journaling synchronization.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="h-1.5 w-40 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 w-full animate-pulse" />
          </div>
          <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg uppercase tracking-wider">
            Sync Locked
          </span>
        </div>
      </DashboardCard>
    </DashboardShell>
  );
}
