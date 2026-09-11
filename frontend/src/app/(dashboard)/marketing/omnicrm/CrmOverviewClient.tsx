"use client";

// CrmOverviewClient — Single consolidated landing view for /marketing/omnicrm.
// Replaces the 5-tab UI. Layout (top-down, audit-friendly):
//   1. 4 KPI cards (Leads Today, Buku Tamu Pending, Reply Rate, Avg First Response)
//      Each clickable → drill-down route
//   2. Filter bar (date range + BusDev + Source + Buku Tamu Status)
//   3. Live capture table (Time | ID | Name | Phone | Source | Page | BusDev | Stage | Buku Tamu | Action)
//      Each row clickable → /marketing/omnicrm/leads/:id
//
// RBAC: DIGIMAR role auto-scoped to assignedToId=self via applyRbacScope().
// Auto-refresh every 30s.
// All UI components from @/components/dna (no shadcn, no custom cards).

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  DnaStatCard,
  DnaDataTableCard,
  DnaBadge,
  DnaButton,
  DnaSearchableSelect,
  type DnaSelectOption,
} from "@/components/dna";

type BukuTamuStatus = "PENDING" | "APPROVED" | "REJECTED";
type CrmStage = "LEADS_MASUK" | "COLD" | "WARM" | "HOT" | "SAMPLE" | "JUNK_LEADS" | "CLIENT_DEAL" | "CLOSED_LOST";

interface LiveLead {
  id: string;
  trackingCode: string | null;
  displayName: string | null;
  phone: string;
  source: string;
  pageUrl: string | null;
  pageTitle: string | null;
  assignedToId: string | null;
  stage: CrmStage;
  createdAt: string;
  guestbookEvent: { id: string; approvalStatus: BukuTamuStatus } | null;
}

interface BusDev { id: string; name: string; userId: string | null; isActive: boolean; totalLeads: number; }
interface KpiSummary {
  leadsToday: number;
  leadsThisWeek: number;
  replyRate: number;
  avgFirstResponseMinutes: number | null;
  bukuTamuPending: number;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function fmtPct(n: number): string {
  return `${Math.round(n * 100)}%`;
}
function fmtMin(n: number | null): string {
  return n == null ? "—" : n < 60 ? `${n}m` : `${Math.floor(n / 60)}h ${n % 60}m`;
}
function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function CrmOverviewClient() {
  const [from, setFrom] = useState<string>(todayIso());
  const [to, setTo] = useState<string>(todayIso());
  const [busdevId, setBusdevId] = useState<string>("");
  const [source, setSource] = useState<string>("");
  const [bukuTamuStatus, setBukuTamuStatus] = useState<BukuTamuStatus | "">("");
  const [search, setSearch] = useState<string>("");

  const [leads, setLeads] = useState<LiveLead[]>([]);
  const [busdevs, setBusdevs] = useState<BusDev[]>([]);
  const [kpi, setKpi] = useState<KpiSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = async () => {
    setError(null);
    try {
      const params: Record<string, string> = { from, to, limit: "200" };
      if (busdevId) params.assignedToId = busdevId;
      if (source) params.source = source;
      if (bukuTamuStatus) params.bukuTamuStatus = bukuTamuStatus;

      const [leadsRes, busdevsRes, kpiRes] = await Promise.all([
        api.get<LiveLead[]>("/crm/leads/live", { params }),
        api.get<BusDev[]>("/crm/busdevs", { params: { isActive: "true" } }),
        api.get<KpiSummary>("/crm/kpi/summary"),
      ]);
      setLeads(leadsRes.data);
      setBusdevs(busdevsRes.data);
      setKpi(kpiRes.data);
    } catch (e: any) {
      setError(e?.message ?? "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, [from, to, busdevId, source, bukuTamuStatus]);
  useEffect(() => {
    const t = setInterval(loadAll, 30_000);
    return () => clearInterval(t);
  }, [from, to, busdevId, source, bukuTamuStatus]);

  // Client-side search filter (server already filtered by from/to/busdev/source/bukuTamuStatus)
  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((l) =>
      [l.displayName, l.phone, l.trackingCode, l.pageTitle, l.pageUrl]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [leads, search]);

  const busdevOptions: DnaSelectOption[] = useMemo(
    () => [
      { value: "", label: "Semua BusDev" },
      ...busdevs.map((b) => ({ value: b.id, label: b.name })),
    ],
    [busdevs],
  );

  const sourceOptions: DnaSelectOption[] = [
    { value: "", label: "Semua source" },
    { value: "GOOGLE", label: "Google Ads" },
    { value: "INSTAGRAM", label: "Instagram" },
    { value: "TIKTOK", label: "TikTok" },
    { value: "LINKTREE", label: "Linktree" },
    { value: "WEBSITE", label: "Website" },
    { value: "DIRECT", label: "Direct" },
    { value: "REFERRAL", label: "Referral" },
  ];

  const statusOptions: DnaSelectOption[] = [
    { value: "", label: "Semua status" },
    { value: "PENDING", label: "Pending (perlu approve)" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
  ];

  return (
    <div data-testid="omnicrm-overview" className="flex flex-col gap-4">
      {/* KPI CARDS */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Link href="/marketing/omnicrm/kpi" className="block transition-transform hover:scale-[1.01]" data-testid="kpi-card-leads-today">
          <DnaStatCard
            label="Leads Today"
            value={kpi ? String(kpi.leadsToday) : "…"}
            subValue={kpi ? `${kpi.leadsThisWeek} minggu ini` : undefined}
          />
        </Link>
        <Link href="/marketing/omnicrm/guestbook" className="block transition-transform hover:scale-[1.01]" data-testid="kpi-card-buku-tamu">
          <DnaStatCard
            label="Buku Tamu Pending"
            value={kpi ? String(kpi.bukuTamuPending) : "…"}
            subValue={kpi && kpi.bukuTamuPending > 0 ? "Perlu approve" : "Aman"}
          />
        </Link>
        <div data-testid="kpi-card-reply-rate">
          <DnaStatCard
            label="Reply Rate (week)"
            value={kpi ? fmtPct(kpi.replyRate) : "…"}
            subValue={kpi ? (kpi.replyRate < 0.1 ? "⚠ rendah" : "On target") : undefined}
          />
        </div>
        <Link href="/marketing/omnicrm/kpi" className="block transition-transform hover:scale-[1.01]" data-testid="kpi-card-first-response">
          <DnaStatCard
            label="Avg First Response"
            value={kpi ? fmtMin(kpi.avgFirstResponseMinutes) : "…"}
            subValue={kpi && kpi.avgFirstResponseMinutes !== null ? "7d window" : undefined}
          />
        </Link>
      </section>

      {/* FILTER BAR */}
      <section className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200/90 bg-white p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Dari</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            data-testid="overview-filter-from"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Sampai</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            data-testid="overview-filter-to"
          />
        </div>
        <div className="flex min-w-[200px] flex-col gap-1">
          <label className="text-xs text-muted-foreground">BusDev</label>
          <DnaSearchableSelect
            options={busdevOptions}
            value={busdevId}
            onChange={(v) => setBusdevId(String(v))}
            placeholder="Semua BusDev"
            data-testid="overview-filter-busdev"
          />
        </div>
        <div className="flex min-w-[160px] flex-col gap-1">
          <label className="text-xs text-muted-foreground">Source</label>
          <DnaSearchableSelect
            options={sourceOptions}
            value={source}
            onChange={(v) => setSource(String(v))}
            placeholder="Semua source"
            data-testid="overview-filter-source"
          />
        </div>
        <div className="flex min-w-[200px] flex-col gap-1">
          <label className="text-xs text-muted-foreground">Buku Tamu</label>
          <DnaSearchableSelect
            options={statusOptions}
            value={bukuTamuStatus}
            onChange={(v) => setBukuTamuStatus(v as BukuTamuStatus | "")}
            placeholder="Semua status"
            data-testid="overview-filter-status"
          />
        </div>
        <div className="ml-auto">
          <DnaButton variant="outline" onClick={loadAll} data-testid="overview-refresh">
            ⟳ Refresh
          </DnaButton>
        </div>
      </section>

      {/* LIVE CAPTURE TABLE */}
      <DnaDataTableCard
        title="Live Capture"
        description={`${filteredLeads.length} leads · ${from} → ${to}`}
        count={filteredLeads.length}
        searchPlaceholder="Cari nama / nomor / tracking code / page…"
        searchValue={search}
        onSearchChange={setSearch}
        actions={
          <Link href="/marketing/omnicrm/kpi">
            <DnaButton variant="ghost">Lihat KPI lengkap →</DnaButton>
          </Link>
        }
      >
        {loading && <p className="p-6 text-sm text-muted-foreground">Memuat…</p>}
        {error && <p className="p-6 text-sm text-red-600" data-testid="overview-error">{error}</p>}
        {!loading && !error && filteredLeads.length === 0 && (
          <p className="p-6 text-sm text-muted-foreground" data-testid="overview-empty">
            Tidak ada leads dalam rentang waktu / filter ini.
          </p>
        )}
        {!loading && !error && filteredLeads.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Waktu</th>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">Nomor</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Thankyou Page</th>
                  <th className="px-4 py-3">BusDev</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Buku Tamu</th>
                  <th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="border-t border-slate-100 hover:bg-slate-50" data-testid={`overview-row-${lead.id}`}>
                    <td className="px-4 py-2 text-xs tabular-nums">{fmtTime(lead.createdAt)}</td>
                    <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{lead.trackingCode ?? lead.id.slice(0, 8)}</td>
                    <td className="px-4 py-2 font-medium">{lead.displayName ?? <span className="italic text-muted-foreground">(belum ada nama)</span>}</td>
                    <td className="px-4 py-2 tabular-nums">{lead.phone}</td>
                    <td className="px-4 py-2 text-xs">
                      <DnaBadge status={lead.source === "GOOGLE" || lead.source === "DIRECT" ? "default" : "warning"}>
                        {lead.source}
                      </DnaBadge>
                    </td>
                    <td className="px-4 py-2 max-w-[200px] truncate text-xs text-muted-foreground" title={lead.pageUrl ?? ""}>
                      {lead.pageTitle ?? lead.pageUrl ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      {lead.assignedToId ? (busdevs.find((b) => b.userId === lead.assignedToId)?.name ?? lead.assignedToId.slice(0, 6)) : <span className="italic text-muted-foreground">unassigned</span>}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      <DnaBadge status={lead.stage === "CLIENT_DEAL" ? "default" : lead.stage === "JUNK_LEADS" || lead.stage === "CLOSED_LOST" ? "warning" : "default"}>
                        {lead.stage.replace(/_/g, " ")}
                      </DnaBadge>
                    </td>
                    <td className="px-4 py-2 text-xs">
                      {lead.guestbookEvent ? (
                        <DnaBadge status={lead.guestbookEvent.approvalStatus === "APPROVED" ? "default" : lead.guestbookEvent.approvalStatus === "REJECTED" ? "warning" : "warning"}>
                          {lead.guestbookEvent.approvalStatus}
                        </DnaBadge>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      <Link href={`/marketing/omnicrm/leads/${lead.id}`} className="text-primary hover:underline">
                        Detail →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DnaDataTableCard>
    </div>
  );
}
