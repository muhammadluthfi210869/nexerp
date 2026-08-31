"use client";

import {
  Activity,
  Settings2,
  Database,
  History,
} from "lucide-react";
import { MarketingLogManager } from "@/components/marketing/marketing-log-manager";
import {
  PageShell,
  CanonicalMetricGrid,
  MetricCard,
} from "@/components/canonical";

export default function MarketingLogsPage() {
  return (
    <PageShell
      title="Campaign Audit Logs"
      subtitle="Correct, adjust, or reconcile marketing performance data. All modifications are tracked to maintain intelligence accuracy."
      actions={
        <div className="px-4 py-2 bg-white border border-[#E2E8F0] rounded-[12px] flex items-center gap-3">
          <History className="w-5 h-5 text-slate-400" />
          <div className="text-left font-semibold leading-none">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Audit Status</p>
            <p className="text-[13px] text-rose-600 font-medium">Live Review</p>
          </div>
        </div>
      }
    >
      <CanonicalMetricGrid>
        <MetricCard label="Core Database" value="Production" icon={<Database />} variant="success" />
        <MetricCard label="Sync Health" value="Delayed" icon={<Activity />} variant="danger" />
        <MetricCard label="Audit Mode" value="Real-Time" icon={<Settings2 />} variant="info" />
      </CanonicalMetricGrid>

      <div className="rounded-[12px] border border-[#E2E8F0] bg-white p-2">
        <MarketingLogManager />
      </div>
    </PageShell>
  );
}
