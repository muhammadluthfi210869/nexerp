"use client";

// CrmKpiTiles — 7 KPI tiles for /marketing/omnicrm/kpi.
// Loads /crm/kpi/summary. Auto-refresh every 30s.

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { DnaBadge } from "@/components/dna";

interface KpiSummary {
  leadsToday: number;
  leadsThisWeek: number;
  leadsByStage: Record<string, number>;
  avgFirstResponseMinutes: number | null;
  replyRate: number;
  bukuTamuPending: number;
  bukuTamuApproved7d: number;
  roundRobinDistribution: Array<{
    agentId: string | null;
    agentName: string | null;
    todayCount: number;
    weekCount: number;
  }>;
  generatedAt: string;
}

function fmtPct(n: number): string {
  return `${Math.round(n * 100)}%`;
}
function fmtMin(n: number | null): string {
  return n == null ? "—" : n < 60 ? `${n}m` : `${Math.floor(n / 60)}h ${n % 60}m`;
}

export function CrmKpiTiles() {
  const [kpi, setKpi] = useState<KpiSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      api.get<KpiSummary>("/crm/kpi/summary")
        .then((res) => { if (!cancelled) setKpi(res.data); })
        .catch((e) => { if (!cancelled) setError(e?.message ?? "Gagal memuat KPI"); });
    };
    load();
    const t = setInterval(load, 30_000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  if (error) return <div data-testid="omnicrm-kpi-error" className="text-red-600">{error}</div>;
  if (!kpi) return <div data-testid="omnicrm-kpi-loading">Memuat KPI…</div>;

  return (
    <div data-testid="omnicrm-kpi" className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        <Tile label="Leads Today" value={String(kpi.leadsToday)} testId="kpi-leads-today" />
        <Tile label="Leads This Week" value={String(kpi.leadsThisWeek)} testId="kpi-leads-week" />
        <Tile label="Reply Rate" value={fmtPct(kpi.replyRate)} testId="kpi-reply-rate" status={kpi.replyRate < 0.1 ? "warning" : "default"} />
        <Tile label="Avg First Response" value={fmtMin(kpi.avgFirstResponseMinutes)} testId="kpi-first-response" />
        <Tile label="Buku Tamu Pending" value={String(kpi.bukuTamuPending)} testId="kpi-buku-tamu-pending" status={kpi.bukuTamuPending > 0 ? "warning" : "default"} />
        <Tile label="Buku Tamu Approved (7d)" value={String(kpi.bukuTamuApproved7d)} testId="kpi-buku-tamu-approved" />
        <Tile label="Generated At" value={new Date(kpi.generatedAt).toLocaleTimeString()} testId="kpi-generated-at" />
      </div>

      <section className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">Leads by Stage</h3>
        <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
          {Object.entries(kpi.leadsByStage).map(([stage, count]) => (
            <div key={stage} className="flex items-center justify-between rounded border border-border bg-background px-3 py-2">
              <span className="text-muted-foreground">{stage}</span>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">Round Robin Distribution</h3>
        {kpi.roundRobinDistribution.length === 0 ? (
          <p className="text-xs text-muted-foreground">Belum ada assignment hari ini.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="pb-2">BusDev</th>
                <th className="pb-2 text-right">Today</th>
                <th className="pb-2 text-right">This Week</th>
              </tr>
            </thead>
            <tbody>
              {kpi.roundRobinDistribution.map((row) => (
                <tr key={row.agentId ?? "unassigned"} className="border-t border-border">
                  <td className="py-2">{row.agentName ?? "(unassigned)"}</td>
                  <td className="py-2 text-right"><strong>{row.todayCount}</strong></td>
                  <td className="py-2 text-right">{row.weekCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function Tile({ label, value, testId, status }: { label: string; value: string; testId: string; status?: "default" | "warning" | "critical" }) {
  return (
    <div data-testid={testId} className="flex flex-col gap-1 rounded-lg border border-border bg-card p-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold">{value}</span>
        {status && status !== "default" && <DnaBadge status={status}>{status}</DnaBadge>}
      </div>
    </div>
  );
}
