"use client";

import React from "react";
import {
  Activity,
  BarChart3,
  Settings2,
  Database,
  ShieldCheck,
  History,
} from "lucide-react";
import { MarketingLogManager } from "@/components/marketing/marketing-log-manager";
import { StatCard } from "@/components/dna/StatCard";
import { TableShell } from "@/components/layout/TableShell";

export default function MarketingLogsPage() {
  return (
    <TableShell
      title="CAMPAIGN"
      titleAccent="AUDIT LOGS"
      subtitle="Correct, adjust, or reconcile marketing performance data. All modifications are tracked to maintain intelligence accuracy."
      actions={
        <div className="px-6 py-4 bg-white border border-[var(--border-color)] rounded-2xl shadow-sm flex items-center gap-4">
          <History className="w-5 h-5 text-slate-400" />
          <div className="text-left font-black tracking-tight leading-none uppercase">
            <p className="text-[8px] text-slate-400 mb-1">Audit Status</p>
            <p className="text-sm text-[#DC2626]">LIVE REVIEW</p>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--card-gap)]">
        <StatCard label="Core Database" value="Production" icon={<Database />} />
        <StatCard label="Sync Health" value="Delayed" icon={<Activity />} className="border-[rgba(220,38,38,0.28)] shadow-[0_0_0_1px_rgba(220,38,38,0.08),0_18px_40px_-16px_rgba(220,38,38,0.34)] [&_h3]:text-[#DC2626]" />
        <StatCard label="Audit Mode" value="Real-Time" icon={<Settings2 />} />
      </div>

      <div className="bg-white/40 rounded-2xl p-2">
        <MarketingLogManager />
      </div>
    </TableShell>
  );
}
