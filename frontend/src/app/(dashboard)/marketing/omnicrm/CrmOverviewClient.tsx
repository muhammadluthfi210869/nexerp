"use client";

// CrmOverviewClient — Single consolidated landing view for /marketing/omnicrm.
// Replaces the 5-tab UI. Layout (top-down, audit-friendly):
//   1. 4 KPI cards (Leads Today, Buku Tamu Pending, Reply Rate, Avg First Response)
//      Each clickable → drill-down route
//   2. Filter bar (Bulan+Tahun dropdowns + BusDev + Source + Buku Tamu Status)
//      Auto-fires on change; no Apply button. 30s auto-refresh.
//   3. Live capture table (Time | ID | Name | Phone | Source | Page | BusDev | Stage | Buku Tamu | Action)
//      Each row clickable → /marketing/omnicrm/leads/:id
//
// RBAC: DIGIMAR role auto-scoped to assignedToId=self via applyRbacScope().
// All UI components from @/components/dna (no shadcn, no custom cards).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  DnaStatCard,
  DnaDataTableCard,
  DnaBadge,
  DnaButton,
  DnaSearchableSelect,
  DnaSelect,
  DnaCard,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaTdNumber,
  DnaTdCode,
  dnaToastApi,
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

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const YEARS = [2025, 2026, 2027];

function monthBounds(bulan: number, tahun: number): { from: string; to: string } {
  const start = new Date(tahun, bulan - 1, 1);
  const end = new Date(tahun, bulan, 0); // day 0 of next month = last day of bulan
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { from: fmt(start), to: fmt(end) };
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
  const router = useRouter();
  const now = useMemo(() => new Date(), []);
  const [bulan, setBulan] = useState<number>(now.getMonth() + 1);
  const [tahun, setTahun] = useState<number>(now.getFullYear());
  const [busdevId, setBusdevId] = useState<string>("");
  const [source, setSource] = useState<string>("");
  const [bukuTamuStatus, setBukuTamuStatus] = useState<BukuTamuStatus | "">("");
  const [search, setSearch] = useState<string>("");

  const [leads, setLeads] = useState<LiveLead[]>([]);
  const [busdevs, setBusdevs] = useState<BusDev[]>([]);
  const [kpi, setKpi] = useState<KpiSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Derive from/to from bulan+tahun (local date range).
  const { from, to } = useMemo(() => monthBounds(bulan, tahun), [bulan, tahun]);

  // Latest values reachable from auto-refresh without re-creating interval.
  const filterRef = useRef({ from, to, busdevId, source, bukuTamuStatus });
  filterRef.current = { from, to, busdevId, source, bukuTamuStatus };

  const loadAll = useCallback(async () => {
    setError(null);
    const { from: f, to: t, busdevId: b, source: s, bukuTamuStatus: bts } = filterRef.current;
    try {
      const params: Record<string, string> = { from: f, to: t, limit: "200" };
      if (b) params.assignedToId = b;
      if (s) params.source = s;
      if (bts) params.bukuTamuStatus = bts;

      // Parallel but isolated: each Promise has its own .catch so one failure
      // doesn't blank the whole UI. Busdevs are static-ish, fetch once.
      const [leadsRes, busdevsRes, kpiRes] = await Promise.all([
        api.get<LiveLead[]>("/crm/leads/live", { params }).catch((e) => {
          if (e?.response?.status === 401 || e?.response?.status === 403) {
            dnaToastApi.error({ title: "Sesi berakhir", description: "Silakan login ulang." });
            return { data: [] as LiveLead[] };
          }
          throw e;
        }),
        api.get<BusDev[]>("/crm/busdevs", { params: { isActive: "true" } }).catch((e) => {
          if (e?.response?.status === 401 || e?.response?.status === 403) {
            dnaToastApi.error({ title: "Sesi berakhir", description: "Silakan login ulang." });
            return { data: [] as BusDev[] };
          }
          throw e;
        }),
        api.get<KpiSummary>("/crm/kpi/summary").catch((e) => {
          if (e?.response?.status === 401 || e?.response?.status === 403) {
            dnaToastApi.error({ title: "Sesi berakhir", description: "Silakan login ulang." });
            return { data: null };
          }
          throw e;
        }),
      ]);
      setLeads(leadsRes.data);
      setBusdevs(busdevsRes.data);
      if (kpiRes.data) setKpi(kpiRes.data);
    } catch (e: any) {
      setError(e?.message ?? "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Single effect: immediate load on filter change + 30s auto-refresh.
  useEffect(() => {
    loadAll();
    const id = setInterval(loadAll, 30_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulan, tahun, busdevId, source, bukuTamuStatus]);

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

  // Filter dropdown to only busdevs with valid userId. Backend's
  // CrmLead.assignedToId is always a User.id (round-robin uses bussdevStaff.userId),
  // so busdevs without a userId would silently return empty when selected.
  const busdevOptions: DnaSelectOption[] = useMemo(
    () => [
      { value: "", label: "Semua BusDev" },
      ...busdevs.filter((b) => b.userId).map((b) => ({ value: b.userId as string, label: b.name })),
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
      {/* KPI CARDS — DnaStatCard.onClick replaces Link wrappers (B3) */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <DnaStatCard
          label="Leads Today"
          value={kpi ? String(kpi.leadsToday) : "…"}
          subValue={kpi ? `${kpi.leadsThisWeek} minggu ini` : undefined}
          onClick={() => router.push("/marketing/omnicrm/kpi")}
          data-testid="kpi-card-leads-today"
        />
        <DnaStatCard
          label="Buku Tamu Pending"
          value={kpi ? String(kpi.bukuTamuPending) : "…"}
          subValue={kpi && kpi.bukuTamuPending > 0 ? "Perlu approve" : "Aman"}
          onClick={() => router.push("/marketing/omnicrm/guestbook")}
          data-testid="kpi-card-buku-tamu"
        />
        <div data-testid="kpi-card-reply-rate">
          <DnaStatCard
            label="Reply Rate (week)"
            value={kpi ? fmtPct(kpi.replyRate) : "…"}
            subValue={kpi ? (kpi.replyRate < 0.1 ? "⚠ rendah" : "On target") : undefined}
          />
        </div>
        <DnaStatCard
          label="Avg First Response"
          value={kpi ? fmtMin(kpi.avgFirstResponseMinutes) : "…"}
          subValue={kpi && kpi.avgFirstResponseMinutes !== null ? "7d window" : undefined}
          onClick={() => router.push("/marketing/omnicrm/kpi")}
          data-testid="kpi-card-first-response"
        />
      </section>

      {/* FILTER BAR — Bulan+Tahun dropdowns replace date range (per user request) */}
      <DnaCard variant="default" padding="md" data-testid="overview-filter-bar">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-[140px] flex-col gap-1">
            <label className="text-xs text-muted-foreground">Bulan</label>
            <DnaSelect
              value={String(bulan)}
              onChange={(v) => setBulan(Number(v))}
              options={MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))}
              data-testid="overview-filter-bulan"
            />
          </div>
          <div className="flex min-w-[110px] flex-col gap-1">
            <label className="text-xs text-muted-foreground">Tahun</label>
            <DnaSelect
              value={String(tahun)}
              onChange={(v) => setTahun(Number(v))}
              options={YEARS.map((y) => ({ value: String(y), label: String(y) }))}
              data-testid="overview-filter-tahun"
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
        </div>
      </DnaCard>

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
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow>
                  <DnaTh>Waktu</DnaTh>
                  <DnaTh>ID</DnaTh>
                  <DnaTh>Nama</DnaTh>
                  <DnaTh>Nomor</DnaTh>
                  <DnaTh>Source</DnaTh>
                  <DnaTh>Thankyou Page</DnaTh>
                  <DnaTh>BusDev</DnaTh>
                  <DnaTh>Stage</DnaTh>
                  <DnaTh>Buku Tamu</DnaTh>
                  <DnaTh align="right">Aksi</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {filteredLeads.map((lead) => (
                  <DnaTableRow key={lead.id} data-testid={`overview-row-${lead.id}`}>
                    <DnaTd className="text-xs tabular-nums">{fmtTime(lead.createdAt)}</DnaTd>
                    <DnaTdCode>{lead.trackingCode ?? lead.id.slice(0, 8)}</DnaTdCode>
                    <DnaTd className="font-medium">{lead.displayName ?? <span className="italic text-muted-foreground">(belum ada nama)</span>}</DnaTd>
                    <DnaTdNumber>{lead.phone}</DnaTdNumber>
                    <DnaTd>
                      <DnaBadge status={lead.source === "GOOGLE" || lead.source === "DIRECT" ? "default" : "warning"}>
                        {lead.source}
                      </DnaBadge>
                    </DnaTd>
                    <DnaTd className="max-w-[200px] truncate text-xs text-muted-foreground" title={lead.pageUrl ?? ""}>
                      {lead.pageTitle ?? lead.pageUrl ?? "—"}
                    </DnaTd>
                    <DnaTd className="text-xs">
                      {lead.assignedToId ? (busdevs.find((b) => b.userId === lead.assignedToId)?.name ?? lead.assignedToId.slice(0, 6)) : <span className="italic text-muted-foreground">unassigned</span>}
                    </DnaTd>
                    <DnaTd>
                      <DnaBadge status={lead.stage === "CLIENT_DEAL" ? "default" : lead.stage === "JUNK_LEADS" || lead.stage === "CLOSED_LOST" ? "warning" : "default"}>
                        {lead.stage.replace(/_/g, " ")}
                      </DnaBadge>
                    </DnaTd>
                    <DnaTd>
                      {lead.guestbookEvent ? (
                        <DnaBadge status={lead.guestbookEvent.approvalStatus === "APPROVED" ? "default" : lead.guestbookEvent.approvalStatus === "REJECTED" ? "warning" : "warning"}>
                          {lead.guestbookEvent.approvalStatus}
                        </DnaBadge>
                      ) : <span className="text-muted-foreground">—</span>}
                    </DnaTd>
                    <DnaTd align="right">
                      <Link href={`/marketing/omnicrm/leads/${lead.id}`} className="text-primary hover:underline">
                        Detail →
                      </Link>
                    </DnaTd>
                  </DnaTableRow>
                ))}
              </DnaTableBody>
            </DnaTable>
          </div>
        )}
      </DnaDataTableCard>
    </div>
  );
}
