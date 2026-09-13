"use client";

// CrmKpiTiles — 7 KPI tiles for /marketing/omnicrm/kpi.
// Loads /crm/kpi/summary + /crm/round-robin/historical. Auto-refresh every 30s.

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
  replyRatePerBusdev: Array<{
    busdevId: string;
    busdevName: string;
    totalLeads: number;
    repliedLeads: number;
    replyRatePct: number;
    avgFirstResponseMinutes: number | null;
  }>;
  generatedAt: string;
}

interface RoundRobinHistorical {
  busdevs: Array<{
    name: string;
    phone: string | null;
    isActive: boolean;
    totalLeads: number;
    last30d: number;
    last7d: number;
    lastAssignedAt: string | null;
  }>;
  rrCounter: { currentIndex: number | null; updatedAt: string | null };
  balanceMetrics: {
    stdDeviation: number;
    coefficientOfVariation: number;
    isBalanced: "SEIMBANG" | "CENDERUNG_SEIMBANG" | "TIDAK_SEIMBANG";
    range: { min: number; max: number };
    mean: number;
  };
  generatedAt: string;
}

function fmtPct(n: number): string {
  return `${Math.round(n * 100)}%`;
}
function fmtMin(n: number | null): string {
  return n == null ? "—" : n < 60 ? `${n}m` : `${Math.floor(n / 60)}h ${n % 60}m`;
}
function fmtDate(s: string | null): string {
  if (!s) return "—";
  const d = new Date(s);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}
function balanceBadge(status: RoundRobinHistorical["balanceMetrics"]["isBalanced"]) {
  if (status === "SEIMBANG") return <DnaBadge status="default">SEIMBANG ✓</DnaBadge>;
  if (status === "CENDERUNG_SEIMBANG") return <DnaBadge status="default">CENDERUNG SEIMBANG</DnaBadge>;
  return <DnaBadge status="warning">TIDAK SEIMBANG</DnaBadge>;
}

export function CrmKpiTiles() {
  const [kpi, setKpi] = useState<KpiSummary | null>(null);
  const [historical, setHistorical] = useState<RoundRobinHistorical | null>(null);
  const [historicalError, setHistoricalError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      api.get<KpiSummary>("/crm/kpi/summary")
        .then((res) => { if (!cancelled) setKpi(res.data); })
        .catch((e) => { if (!cancelled) setError(e?.message ?? "Gagal memuat KPI"); });
      api.get<RoundRobinHistorical>("/crm/round-robin/historical")
        .then((res) => { if (!cancelled) { setHistorical(res.data); setHistoricalError(null); } })
        .catch((e) => { if (!cancelled) setHistoricalError(e?.message ?? "Dreamlab DB belum dikonfigurasi"); });
    };
    load();
    const t = setInterval(load, 30_000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  if (error) return <div data-testid="omnicrm-kpi-error" className="text-red-600">{error}</div>;
  if (!kpi) return <div data-testid="omnicrm-kpi-loading">Memuat KPI…</div>;

  const hasErpRrData = kpi.roundRobinDistribution.length > 0;

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

      {/* Part B — ERP-side Round Robin Distribution (recent, post-Round 2 BUG #8 fix) */}
      <section className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">Round Robin Distribution <span className="text-xs font-normal text-muted-foreground">(OmniCRM-side · hari ini & minggu ini)</span></h3>
        {!hasErpRrData ? (
          <p className="text-xs text-muted-foreground">Belum ada leads yang ter-assign.</p>
        ) : (
          <table className="w-full text-xs" data-testid="kpi-round-robin-table">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="pb-2">BusDev</th>
                <th className="pb-2 text-right">Hari Ini</th>
                <th className="pb-2 text-right">7 Hari Terakhir</th>
              </tr>
            </thead>
            <tbody>
              {kpi.roundRobinDistribution.map((row) => (
                <tr key={row.agentId ?? "unassigned"} className="border-t border-border" data-testid={`kpi-round-robin-row-${row.agentId ?? "unassigned"}`}>
                  <td className="py-2">{row.agentName ?? <em className="text-muted-foreground">(unassigned)</em>}</td>
                  <td className="py-2 text-right"><strong>{row.todayCount}</strong></td>
                  <td className="py-2 text-right">{row.weekCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">Per-BusDev Reply Rate</h3>
        {kpi.replyRatePerBusdev.length === 0 ? (
          <p className="text-xs text-muted-foreground">Belum ada leads yang ter-assign.</p>
        ) : (
          <table className="w-full text-xs" data-testid="kpi-per-busdev-table">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="pb-2">BusDev</th>
                <th className="pb-2 text-right">Total Leads</th>
                <th className="pb-2 text-right">Replied</th>
                <th className="pb-2 text-right">Reply Rate</th>
                <th className="pb-2 text-right">Avg First Response</th>
              </tr>
            </thead>
            <tbody>
              {kpi.replyRatePerBusdev.map((row) => (
                <tr key={row.busdevId} className="border-t border-border" data-testid={`kpi-per-busdev-row-${row.busdevId}`}>
                  <td className="py-2">{row.busdevName}</td>
                  <td className="py-2 text-right">{row.totalLeads}</td>
                  <td className="py-2 text-right"><strong>{row.repliedLeads}</strong></td>
                  <td className="py-2 text-right">
                    <DnaBadge status={row.replyRatePct < 0.1 ? "warning" : "default"}>
                      {fmtPct(row.replyRatePct)}
                    </DnaBadge>
                  </td>
                  <td className="py-2 text-right">{fmtMin(row.avgFirstResponseMinutes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Part C — Dreamlab DB historical Round Robin (months of data, separate DB) */}
      <section className="rounded-lg border border-border bg-card p-4" data-testid="kpi-round-robin-historical-section">
        <h3 className="mb-3 text-sm font-semibold">Round Robin Distribution — Dreamlab <span className="text-xs font-normal text-muted-foreground">(historis · semua waktu)</span></h3>
        {historicalError && !historical ? (
          <p className="text-xs text-muted-foreground" data-testid="kpi-round-robin-historical-error">
            Data dreamlab belum tersedia ({historicalError}). Set <code>DREAMLAB_DATABASE_URL</code> di backend env untuk mengaktifkan.
          </p>
        ) : !historical ? (
          <p className="text-xs text-muted-foreground">Memuat data dreamlab…</p>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded border border-border bg-background p-3" data-testid="rr-hist-total">
                <div className="text-xs text-muted-foreground">Total Leads Dialihkan</div>
                <div className="text-2xl font-semibold">{historical.busdevs.reduce((s, b) => s + b.totalLeads, 0).toLocaleString("id-ID")}</div>
              </div>
              <div className="rounded border border-border bg-background p-3" data-testid="rr-hist-active">
                <div className="text-xs text-muted-foreground">Busdevs Aktif</div>
                <div className="text-2xl font-semibold">{historical.busdevs.filter((b) => b.isActive).length}<span className="text-sm text-muted-foreground"> / {historical.busdevs.length}</span></div>
              </div>
              <div className="rounded border border-border bg-background p-3" data-testid="rr-hist-balance">
                <div className="text-xs text-muted-foreground">Std Dev / Balance</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">{historical.balanceMetrics.stdDeviation.toFixed(1)}</span>
                  {balanceBadge(historical.balanceMetrics.isBalanced)}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  CV {fmtPct(historical.balanceMetrics.coefficientOfVariation)} · range {historical.balanceMetrics.range.min}–{historical.balanceMetrics.range.max}
                </div>
              </div>
            </div>

            {historical.busdevs.length === 0 ? (
              <p className="text-xs text-muted-foreground">Belum ada busdevs di database dreamlab.</p>
            ) : (
              <table className="w-full text-xs" data-testid="kpi-round-robin-historical-table">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="pb-2">BusDev</th>
                    <th className="pb-2">No. WA</th>
                    <th className="pb-2 text-right">Total</th>
                    <th className="pb-2 text-right">30d</th>
                    <th className="pb-2 text-right">7d</th>
                    <th className="pb-2 text-right">Assigned Terakhir</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {historical.busdevs.map((b) => (
                    <tr key={b.name} className="border-t border-border" data-testid={`kpi-rr-hist-row-${b.name}`}>
                      <td className="py-2"><strong>{b.name}</strong></td>
                      <td className="py-2 text-muted-foreground">{b.phone ?? "—"}</td>
                      <td className="py-2 text-right"><strong>{b.totalLeads.toLocaleString("id-ID")}</strong></td>
                      <td className="py-2 text-right">{b.last30d}</td>
                      <td className="py-2 text-right">{b.last7d}</td>
                      <td className="py-2 text-right">{fmtDate(b.lastAssignedAt)}</td>
                      <td className="py-2">{b.isActive ? <DnaBadge status="default">aktif</DnaBadge> : <DnaBadge status="warning">non-aktif</DnaBadge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Sumber: PostgreSQL <code>dreamlab</code> DB · tabel <code>busdevs</code> + <code>leads</code> + <code>rr_counter</code> · snapshot {fmtDate(historical.generatedAt)}.
            </p>
          </>
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

