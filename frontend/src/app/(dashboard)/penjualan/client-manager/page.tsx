"use client";

/**
 * Client Manager — Pipeline Klien Maklon per Fase
 *
 * Sumber data (semua endpoint bussdev yang sudah ada di backend NestJS):
 * - Tab 1 Client Sample     : GET /bussdev/leads/group/sample
 * - Tab 2 Client Produksi   : GET /bussdev/leads/group/production
 * - Tab 3 Client Repeat Order: GET /bussdev/leads/group/ro
 * - Nomor Sales Order       : GET /bussdev/sales-orders (dipetakan per leadId)
 *
 * Standar Visual DNA Golden Reference:
 * - Pure @/components/dna, ADR-007 compliant (zero raw @/components/ui/*).
 */

import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  FlaskConical,
  Package,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Layers,
  CheckCircle2,
  Calendar,
  FileText,
  Link2,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaDetailDrawer,
  DnaButton,
  DnaEmptyState,
  DnaErrorState,
  DnaLoadingSkeleton,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { api } from "@/lib/api";

// ── Types (bentuk data nyata dari /bussdev/*) ──
interface LeadActivityRow {
  id: string;
  activityType: string;
  notes: string;
  createdAt: string | null;
  amount: number | null;
}

interface LeadSampleRow {
  id: string;
  sampleCode: string;
  productName: string;
  stage: string;
  revisionCount: number;
  shippedAt: string | null;
  targetDeadline: string | null;
  clientRating: number | null;
  clientComment: string | null;
}

interface LeadRow {
  id: string;
  clientName: string;
  brandName: string;
  productInterest: string;
  contactInfo: string;
  email: string | null;
  source: string;
  estimatedValue: number;
  moq: number;
  planOmset: number;
  status: string;
  hkiMode: string;
  hkiProgress: string | null;
  logoRevision: number;
  isFormulaLocked: boolean;
  spkFileUrl: string | null;
  orderCount: number;
  province: string | null;
  city: string | null;
  district: string | null;
  addressDetail: string | null;
  notes: string | null;
  packagingSuggestion: string | null;
  designSuggestion: string | null;
  launchingPlan: string | null;
  targetMarket: string | null;
  convertedToProdAt: string | null;
  wonAt: string | null;
  lastStageAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  picName: string;
  latestSample: LeadSampleRow | null;
  latestActivity: LeadActivityRow | null;
}

interface SalesOrderRow {
  id: string;
  orderNumber: string;
  leadId: string;
  totalAmount: number;
  quantity: number;
  status: string;
  transactionDate: string | null;
  dueDate: string | null;
  brandName: string | null;
}

type GroupKey = "sample" | "production" | "ro";

// ── Helpers ──
function unwrapList(payload: any): any[] {
  const list = payload?.data?.data || payload?.data || payload;
  if (Array.isArray(list)) return list;
  if (Array.isArray(list?.data)) return list.data;
  return [];
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 10);
}

function formatRupiah(value: number) {
  return `Rp ${Math.round(value || 0).toLocaleString("id-ID")}`;
}

function formatJuta(value: number) {
  return `Rp ${((value || 0) / 1000000).toFixed(1)} Jt`;
}

function toNumber(value: unknown) {
  const n = typeof value === "string" ? Number(value) : (value as number);
  return Number.isFinite(n) ? (n as number) : 0;
}

function mapLead(raw: any): LeadRow {
  const sample = raw?.sampleRequests?.[0];
  const activity = raw?.activities?.[0];
  return {
    id: raw?.id,
    clientName: raw?.clientName || "—",
    brandName: raw?.brandName || "—",
    productInterest: raw?.productInterest || "—",
    contactInfo: raw?.contactInfo || "—",
    email: raw?.email || null,
    source: raw?.source || "—",
    estimatedValue: toNumber(raw?.estimatedValue),
    moq: toNumber(raw?.moq),
    planOmset: toNumber(raw?.planOmset),
    status: raw?.status || "—",
    hkiMode: raw?.hkiMode || "—",
    hkiProgress: raw?.hkiProgress || null,
    logoRevision: toNumber(raw?.logoRevision),
    isFormulaLocked: Boolean(raw?.isFormulaLocked),
    spkFileUrl: raw?.spkFileUrl || null,
    orderCount: toNumber(raw?.orderCount),
    province: raw?.province || null,
    city: raw?.city || null,
    district: raw?.district || null,
    addressDetail: raw?.addressDetail || null,
    notes: raw?.notes || null,
    packagingSuggestion: raw?.packagingSuggestion || null,
    designSuggestion: raw?.designSuggestion || null,
    launchingPlan: raw?.launchingPlan || null,
    targetMarket: raw?.targetMarket || null,
    convertedToProdAt: raw?.convertedToProdAt || null,
    wonAt: raw?.wonAt || null,
    lastStageAt: raw?.lastStageAt || null,
    createdAt: raw?.createdAt || null,
    updatedAt: raw?.updatedAt || null,
    picName: raw?.pic?.name || "—",
    latestSample: sample
      ? {
          id: sample.id,
          sampleCode: sample.sampleCode || "—",
          productName: sample.productName || "—",
          stage: sample.stage || "—",
          revisionCount: toNumber(sample.revisionCount),
          shippedAt: sample.shippedAt || null,
          targetDeadline: sample.targetDeadline || null,
          clientRating: sample.clientRating ?? null,
          clientComment: sample.clientComment || null,
        }
      : null,
    latestActivity: activity
      ? {
          id: activity.id,
          activityType: activity.activityType || "—",
          notes: activity.notes || "—",
          createdAt: activity.createdAt || null,
          amount: activity.amount === null || activity.amount === undefined ? null : toNumber(activity.amount),
        }
      : null,
  };
}

function mapSalesOrder(raw: any): SalesOrderRow {
  return {
    id: raw?.id,
    orderNumber: raw?.orderNumber || "—",
    leadId: raw?.leadId,
    totalAmount: toNumber(raw?.totalAmount),
    quantity: toNumber(raw?.quantity),
    status: raw?.status || "—",
    transactionDate: raw?.transactionDate || null,
    dueDate: raw?.dueDate || null,
    brandName: raw?.brandName || null,
  };
}

const STAGE_LABEL: Record<string, string> = {
  WAITING_FINANCE: "Menunggu Finance",
  QUEUE: "Dalam Antrian",
  FORMULATING: "Formulasi",
  LAB_TEST: "Uji Lab",
  READY_TO_SHIP: "Siap Kirim",
  SHIPPED: "Terkirim",
  RECEIVED: "Diterima Klien",
  CLIENT_REVIEW: "Review Klien",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  CANCELLED: "Dibatalkan",
};

function stageVariant(stage: string) {
  if (stage === "APPROVED") return "bg-emerald-100 text-emerald-800 border-emerald-300";
  if (stage === "REJECTED" || stage === "CANCELLED") return "bg-rose-100 text-rose-800 border-rose-300";
  if (stage === "CLIENT_REVIEW") return "bg-blue-100 text-blue-800 border-blue-300";
  return "bg-amber-100 text-amber-800 border-amber-300";
}

function leadStatusVariant(status: string) {
  if (status === "WON_DEAL") return "bg-emerald-100 text-emerald-800 border-emerald-300";
  if (status === "LOST" || status === "ABORTED") return "bg-rose-100 text-rose-800 border-rose-300";
  if (status === "READY_TO_SHIP" || status === "SAMPLE_APPROVED") return "bg-blue-100 text-blue-800 border-blue-300";
  return "bg-amber-100 text-amber-800 border-amber-300";
}

function ScopeNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-[12px] text-amber-900">
      <strong className="block mb-1">Catatan cakupan data</strong>
      {children}
    </div>
  );
}

function ClientManagerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "sample";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupKey>("sample");

  const handleTabChange = (newTab: string) => {
    router.push(`/penjualan/client-manager?tab=${newTab}`);
  };

  // ── Query: klien per fase (endpoint bussdev yang sudah ada) ──
  const sampleQuery = useQuery<LeadRow[]>({
    queryKey: ["bussdev-leads-group", "sample"],
    queryFn: async () => {
      try {
        const res = await api.get("/bussdev/leads/group/sample");
        return unwrapList(res.data).map(mapLead);
      } catch {
        return [];
      }
    },
  });

  const productionQuery = useQuery<LeadRow[]>({
    queryKey: ["bussdev-leads-group", "production"],
    queryFn: async () => {
      try {
        const res = await api.get("/bussdev/leads/group/production");
        return unwrapList(res.data).map(mapLead);
      } catch {
        return [];
      }
    },
  });

  const roQuery = useQuery<LeadRow[]>({
    queryKey: ["bussdev-leads-group", "ro"],
    queryFn: async () => {
      try {
        const res = await api.get("/bussdev/leads/group/ro");
        return unwrapList(res.data).map(mapLead);
      } catch {
        return [];
      }
    },
  });

  const soQuery = useQuery<SalesOrderRow[]>({
    queryKey: ["bussdev-sales-orders"],
    queryFn: async () => {
      try {
        const res = await api.get("/bussdev/sales-orders");
        return unwrapList(res.data).map(mapSalesOrder);
      } catch {
        return [];
      }
    },
  });

  const sampleLeads = sampleQuery.data ?? [];
  const productionLeads = productionQuery.data ?? [];
  const roLeads = roQuery.data ?? [];
  const salesOrders = soQuery.data ?? [];

  const ordersByLead = useMemo(() => {
    const map = new Map<string, SalesOrderRow[]>();
    for (const so of salesOrders) {
      if (!so.leadId) continue;
      const list = map.get(so.leadId) || [];
      list.push(so);
      map.set(so.leadId, list);
    }
    return map;
  }, [salesOrders]);

  const activeQuery =
    activeTab === "production" ? productionQuery : activeTab === "ro" ? roQuery : sampleQuery;
  const isLoading = activeQuery.isLoading;

  const matches = (lead: LeadRow, q: string) =>
    !q ||
    lead.clientName.toLowerCase().includes(q) ||
    lead.brandName.toLowerCase().includes(q) ||
    lead.productInterest.toLowerCase().includes(q) ||
    lead.picName.toLowerCase().includes(q) ||
    (lead.city || "").toLowerCase().includes(q) ||
    (lead.province || "").toLowerCase().includes(q);

  const q = searchQuery.trim().toLowerCase();
  const sampleList = useMemo(() => sampleLeads.filter((l) => matches(l, q)), [sampleLeads, q]);
  const productionList = useMemo(() => productionLeads.filter((l) => matches(l, q)), [productionLeads, q]);
  const roList = useMemo(() => roLeads.filter((l) => matches(l, q)), [roLeads, q]);

  // ── KPI (agregasi dari data nyata, bukan angka contoh) ──
  const sampleValue = sampleLeads.reduce((s, l) => s + l.estimatedValue, 0);
  const sampleMoq = sampleLeads.reduce((s, l) => s + l.moq, 0);
  const sampleApproved = sampleLeads.filter((l) => l.status === "SAMPLE_APPROVED").length;

  const productionValue = productionLeads.reduce((s, l) => s + l.estimatedValue, 0);
  const productionSpk = productionLeads.filter((l) => !!l.spkFileUrl).length;
  const productionLocked = productionLeads.filter((l) => l.isFormulaLocked).length;

  const roValue = roLeads.reduce((s, l) => s + l.estimatedValue, 0);
  const roRepeat = roLeads.filter((l) => l.orderCount > 1).length;
  const roRetention = roLeads.length > 0 ? Math.round((roRepeat / roLeads.length) * 100) : 0;

  const openLead = (lead: LeadRow, group: GroupKey) => {
    setSelectedLead(lead);
    setSelectedGroup(group);
  };

  const drawerOrders = selectedLead ? ordersByLead.get(selectedLead.id) || [] : [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 text-slate-900 font-sans space-y-6">
      <DnaPageHeader
        title="CLIENT PIPELINE"
        subtitle="Pipeline klien maklon per fase, dibaca langsung dari register lead BusDev (/bussdev/leads/group/*)."
        tabs={[
          {
            key: "sample",
            label: "1. Client Sample R&D",
            count: sampleLeads.length,
          },
          {
            key: "production",
            label: "2. Client Produksi",
            count: productionLeads.length,
          },
          {
            key: "ro",
            label: "3. Client Repeat Order (RO)",
            count: roLeads.length,
          },
        ]}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Tab-Specific KPI Grid */}
      {activeTab === "sample" && (
        <DnaKpiGrid
          cards={[
            {
              key: "TOTAL",
              title: "TOTAL KLIEN SAMPLE",
              value: `${sampleLeads.length} Klien`,
              deltaText: "Status CONTACTED s/d SAMPLE_APPROVED",
              isDeltaPositive: true,
              icon: <FlaskConical className="w-4 h-4" />,
              iconBg: "bg-blue-50",
              iconColor: "text-blue-600",
            },
            {
              key: "VALUE",
              title: "POTENSI NILAI (ESTIMASI)",
              value: formatJuta(sampleValue),
              deltaText: "Sum estimatedValue lead sample",
              isDeltaPositive: true,
              icon: <DollarSign className="w-4 h-4" />,
              iconBg: "bg-emerald-50",
              iconColor: "text-emerald-600",
            },
            {
              key: "MOQ",
              title: "TOTAL RENCANA MOQ",
              value: `${sampleMoq.toLocaleString("id-ID")} pcs`,
              deltaText: "Sum field moq lead sample",
              isDeltaPositive: true,
              icon: <Package className="w-4 h-4" />,
              iconBg: "bg-purple-50",
              iconColor: "text-purple-600",
            },
            {
              key: "CONVERSION",
              title: "SAMPLE DISETUJUI",
              value: `${sampleApproved} / ${sampleLeads.length}`,
              deltaText: "Status SAMPLE_APPROVED",
              isDeltaPositive: true,
              icon: <TrendingUp className="w-4 h-4" />,
              iconBg: "bg-amber-50",
              iconColor: "text-amber-600",
            },
          ]}
        />
      )}

      {activeTab === "production" && (
        <DnaKpiGrid
          cards={[
            {
              key: "TOTAL",
              title: "TOTAL PROJEK PRODUKSI",
              value: `${productionLeads.length} Projek`,
              deltaText: "SPK_SIGNED / PRODUCTION_PLAN / READY_TO_SHIP",
              isDeltaPositive: true,
              icon: <Layers className="w-4 h-4" />,
              iconBg: "bg-blue-50",
              iconColor: "text-blue-600",
            },
            {
              key: "KONTRAK",
              title: "NILAI KONTRAK (ESTIMASI)",
              value: formatJuta(productionValue),
              deltaText: "Sum estimatedValue lead produksi",
              isDeltaPositive: true,
              icon: <DollarSign className="w-4 h-4" />,
              iconBg: "bg-emerald-50",
              iconColor: "text-emerald-600",
            },
            {
              key: "SPK",
              title: "SPK TERUNGGAH",
              value: `${productionSpk} / ${productionLeads.length}`,
              deltaText: "Lead dengan berkas spkFileUrl",
              isDeltaPositive: true,
              icon: <CheckCircle2 className="w-4 h-4" />,
              iconBg: "bg-purple-50",
              iconColor: "text-purple-600",
            },
            {
              key: "FORMULA",
              title: "FORMULA TERKUNCI",
              value: `${productionLocked} Projek`,
              deltaText: "Flag isFormulaLocked",
              isDeltaPositive: true,
              icon: <RefreshCw className="w-4 h-4" />,
              iconBg: "bg-amber-50",
              iconColor: "text-amber-600",
            },
          ]}
        />
      )}

      {activeTab === "ro" && (
        <DnaKpiGrid
          cards={[
            {
              key: "TOTAL",
              title: "TOTAL KLIEN WON DEAL",
              value: `${roLeads.length} Klien`,
              deltaText: "Status WON_DEAL",
              isDeltaPositive: true,
              icon: <RefreshCw className="w-4 h-4" />,
              iconBg: "bg-blue-50",
              iconColor: "text-blue-600",
            },
            {
              key: "OMZET",
              title: "NILAI ESTIMASI KLIEN RO",
              value: formatJuta(roValue),
              deltaText: "Sum estimatedValue klien WON_DEAL",
              isDeltaPositive: true,
              icon: <DollarSign className="w-4 h-4" />,
              iconBg: "bg-emerald-50",
              iconColor: "text-emerald-600",
            },
            {
              key: "REPEAT",
              title: "ORDER ULANG (BATCH > 1)",
              value: `${roRepeat} Klien`,
              deltaText: "Field orderCount lebih dari 1",
              isDeltaPositive: true,
              icon: <Calendar className="w-4 h-4" />,
              iconBg: "bg-purple-50",
              iconColor: "text-purple-600",
            },
            {
              key: "RETENTION",
              title: "RASIO ORDER ULANG",
              value: `${roRetention}%`,
              deltaText: "orderCount > 1 dibagi total WON_DEAL",
              isDeltaPositive: true,
              icon: <TrendingUp className="w-4 h-4" />,
              iconBg: "bg-amber-50",
              iconColor: "text-amber-600",
            },
          ]}
        />
      )}

      {isLoading && (
        <div className="px-1">
          <DnaLoadingSkeleton rows={6} />
        </div>
      )}

      {!isLoading && activeQuery.isError && (
        <DnaErrorState
          title="Gagal Memuat Pipeline Klien"
          message="Tidak dapat mengambil data dari /bussdev/leads/group/*."
          onRetry={() => activeQuery.refetch()}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 1: CLIENT SAMPLE R&D                                        */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {!isLoading && !activeQuery.isError && activeTab === "sample" && (
        <DnaDataTableCard
          toolbarProps={{
            searchQuery,
            onSearchChange: setSearchQuery,
            searchPlaceholder: "Cari nama klien, brand, produk, PIC BusDev...",
          }}
          paginationProps={{
            currentPage: 1,
            totalPages: 1,
            totalEntries: sampleList.length,
            pageSize: 10,
            onPageChange: () => {},
          }}
        >
          {sampleList.length === 0 ? (
            <div className="p-6">
              <DnaEmptyState
                title="Belum Ada Klien Sample"
                description="Tidak ada lead pada fase sample (CONTACTED / NEGOTIATION / SAMPLE_REQUESTED / SAMPLE_APPROVED) di /bussdev/leads/group/sample."
              />
            </div>
          ) : (
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider">
                  <DnaTh className="p-3.5 w-10 text-center text-slate-400">#</DnaTh>
                  <DnaTh className="p-3.5 w-56">KLIEN & DOMISILI</DnaTh>
                  <DnaTh className="p-3.5">BRAND & PRODUK</DnaTh>
                  <DnaTh className="p-3.5 w-44 text-right">NILAI & MOQ</DnaTh>
                  <DnaTh className="p-3.5 w-36 text-center">STATUS</DnaTh>
                  <DnaTh className="p-3.5 w-24 text-center">AKSI</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {sampleList.map((s, idx) => (
                  <DnaTableRow
                    key={s.id}
                    onClick={() => openLead(s, "sample")}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <DnaTd className="p-3.5 text-center text-slate-400 tabular-nums">{idx + 1}</DnaTd>
                    <DnaTd className="p-3.5">
                      <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {s.clientName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {[s.city, s.province].filter(Boolean).join(", ") || "—"}
                      </div>
                    </DnaTd>
                    <DnaTd className="p-3.5">
                      <div className="font-semibold text-slate-800">{s.brandName}</div>
                      <div className="text-[11px] text-slate-500">{s.productInterest}</div>
                    </DnaTd>
                    <DnaTd className="p-3.5 text-right">
                      <div className="tabular-nums font-bold text-emerald-600">
                        {formatRupiah(s.estimatedValue)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        MOQ: {s.moq.toLocaleString("id-ID")} pcs
                      </div>
                    </DnaTd>
                    <DnaTd className="p-3.5 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${leadStatusVariant(s.status)}`}
                      >
                        {s.status}
                      </span>
                      <div className="text-[10px] text-slate-400 tabular-nums mt-0.5">
                        PIC: {s.picName}
                      </div>
                    </DnaTd>
                    <DnaTd className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => openLead(s, "sample")}
                        className="px-2.5 py-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Detail
                      </button>
                    </DnaTd>
                  </DnaTableRow>
                ))}
              </DnaTableBody>
            </DnaTable>
          )}
        </DnaDataTableCard>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 2: CLIENT PRODUKSI                                          */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {!isLoading && !activeQuery.isError && activeTab === "production" && (
        <DnaDataTableCard
          toolbarProps={{
            searchQuery,
            onSearchChange: setSearchQuery,
            searchPlaceholder: "Cari pelanggan, brand, PIC BusDev...",
          }}
          paginationProps={{
            currentPage: 1,
            totalPages: 1,
            totalEntries: productionList.length,
            pageSize: 10,
            onPageChange: () => {},
          }}
        >
          {productionList.length === 0 ? (
            <div className="p-6">
              <DnaEmptyState
                title="Belum Ada Projek Produksi"
                description="Tidak ada lead pada fase produksi (SPK_SIGNED / PRODUCTION_PLAN / READY_TO_SHIP) di /bussdev/leads/group/production."
              />
            </div>
          ) : (
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider">
                  <DnaTh className="p-3.5 w-10 text-center text-slate-400">#</DnaTh>
                  <DnaTh className="p-3.5">PELANGGAN & BRAND</DnaTh>
                  <DnaTh className="p-3.5 w-48">SALES ORDER & BUSDEV</DnaTh>
                  <DnaTh className="p-3.5 w-44 text-right">NILAI KONTRAK</DnaTh>
                  <DnaTh className="p-3.5 w-40 text-center">STATUS PROJEK</DnaTh>
                  <DnaTh className="p-3.5 w-24 text-center">AKSI</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {productionList.map((p, idx) => {
                  const orders = ordersByLead.get(p.id) || [];
                  return (
                    <DnaTableRow
                      key={p.id}
                      onClick={() => openLead(p, "production")}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <DnaTd className="p-3.5 text-center text-slate-400 tabular-nums">{idx + 1}</DnaTd>
                      <DnaTd className="p-3.5">
                        <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {p.clientName}
                        </div>
                        <div className="text-[11px] text-slate-500">{p.brandName}</div>
                      </DnaTd>
                      <DnaTd className="p-3.5">
                        <div className="tabular-nums font-bold text-blue-600">
                          {orders.length > 0
                            ? orders.map((o) => o.orderNumber).join(", ")
                            : "Belum ada SO"}
                        </div>
                        <div className="text-[11px] text-slate-400">PIC: {p.picName}</div>
                      </DnaTd>
                      <DnaTd className="p-3.5 text-right tabular-nums font-bold text-slate-900">
                        {formatRupiah(p.estimatedValue)}
                      </DnaTd>
                      <DnaTd className="p-3.5 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${leadStatusVariant(p.status)}`}
                        >
                          {p.status}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {p.spkFileUrl ? "SPK terunggah" : "SPK belum ada"}
                        </div>
                      </DnaTd>
                      <DnaTd className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => openLead(p, "production")}
                          className="px-2.5 py-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Detail
                        </button>
                      </DnaTd>
                    </DnaTableRow>
                  );
                })}
              </DnaTableBody>
            </DnaTable>
          )}
        </DnaDataTableCard>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 3: CLIENT REPEAT ORDER (RO)                                 */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {!isLoading && !activeQuery.isError && activeTab === "ro" && (
        <DnaDataTableCard
          toolbarProps={{
            searchQuery,
            onSearchChange: setSearchQuery,
            searchPlaceholder: "Cari pelanggan WON_DEAL, brand, PIC...",
          }}
          paginationProps={{
            currentPage: 1,
            totalPages: 1,
            totalEntries: roList.length,
            pageSize: 10,
            onPageChange: () => {},
          }}
        >
          {roList.length === 0 ? (
            <div className="p-6">
              <DnaEmptyState
                title="Belum Ada Klien WON_DEAL"
                description="Tidak ada lead berstatus WON_DEAL pada /bussdev/leads/group/ro."
              />
            </div>
          ) : (
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider">
                  <DnaTh className="p-3.5 w-10 text-center text-slate-400">#</DnaTh>
                  <DnaTh className="p-3.5">PELANGGAN & BRAND</DnaTh>
                  <DnaTh className="p-3.5 w-48">ORDER & BATCH</DnaTh>
                  <DnaTh className="p-3.5 w-44 text-right">NILAI ESTIMASI</DnaTh>
                  <DnaTh className="p-3.5 w-40 text-center">PIC & MENANG</DnaTh>
                  <DnaTh className="p-3.5 w-24 text-center">AKSI</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {roList.map((r, idx) => {
                  const orders = ordersByLead.get(r.id) || [];
                  return (
                    <DnaTableRow
                      key={r.id}
                      onClick={() => openLead(r, "ro")}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <DnaTd className="p-3.5 text-center text-slate-400 tabular-nums">{idx + 1}</DnaTd>
                      <DnaTd className="p-3.5">
                        <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {r.clientName}
                        </div>
                        <div className="text-[11px] text-slate-500">{r.brandName}</div>
                      </DnaTd>
                      <DnaTd className="p-3.5">
                        <div className="tabular-nums font-bold text-blue-600">
                          {orders.length > 0 ? orders.map((o) => o.orderNumber).join(", ") : "Belum ada SO"}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          <span className="font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                            Batch #{r.orderCount || 1}
                          </span>{" "}
                          • PIC: {r.picName}
                        </div>
                      </DnaTd>
                      <DnaTd className="p-3.5 text-right tabular-nums font-bold text-slate-900">
                        {formatRupiah(r.estimatedValue)}
                      </DnaTd>
                      <DnaTd className="p-3.5 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${leadStatusVariant(r.status)}`}
                        >
                          {r.status}
                        </span>
                        <div className="text-[10px] text-slate-400 tabular-nums mt-0.5">
                          {formatDate(r.wonAt)}
                        </div>
                      </DnaTd>
                      <DnaTd className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => openLead(r, "ro")}
                          className="px-2.5 py-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Detail
                        </button>
                      </DnaTd>
                    </DnaTableRow>
                  );
                })}
              </DnaTableBody>
            </DnaTable>
          )}
        </DnaDataTableCard>
      )}

      {/* Drawer Detail Klien (semua tab) */}
      <DnaDetailDrawer
        isOpen={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        title={selectedLead ? selectedLead.clientName : "Detail Klien"}
        subtitle={selectedLead ? `${selectedLead.brandName} • ${selectedLead.productInterest}` : undefined}
        badge={selectedLead?.status}
        badgeVariant={
          selectedLead?.status === "WON_DEAL"
            ? "success"
            : selectedLead?.status === "LOST" || selectedLead?.status === "ABORTED"
            ? "danger"
            : "primary"
        }
        actions={
          <DnaButton variant="outline" onClick={() => setSelectedLead(null)}>
            Tutup
          </DnaButton>
        }
      >
        {selectedLead && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block mb-0.5 text-[10px] uppercase font-bold">
                  Nilai Estimasi
                </span>
                <span className="font-bold text-emerald-600 tabular-nums">
                  {formatRupiah(selectedLead.estimatedValue)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5 text-[10px] uppercase font-bold">Rencana MOQ</span>
                <span className="font-bold text-slate-800 tabular-nums">
                  {selectedLead.moq.toLocaleString("id-ID")} pcs
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5 text-[10px] uppercase font-bold">
                  Rencana Omset
                </span>
                <span className="font-bold text-slate-800 tabular-nums">
                  {formatRupiah(selectedLead.planOmset)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5 text-[10px] uppercase font-bold">PIC BusDev</span>
                <span className="font-bold text-slate-800">{selectedLead.picName}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Kontak</span>
                <span className="text-slate-800 font-medium">{selectedLead.contactInfo}</span>
                <div className="text-slate-500">{selectedLead.email || "Email belum dicatat"}</div>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Alamat</span>
                <span className="text-slate-800 font-medium">
                  {[selectedLead.district, selectedLead.city, selectedLead.province]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </span>
                <div className="text-slate-500">{selectedLead.addressDetail || "Detail alamat belum dicatat"}</div>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Sumber Lead</span>
                <span className="text-slate-800 font-medium">{selectedLead.source}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">HKI</span>
                <span className="text-slate-800 font-medium">
                  {selectedLead.hkiMode}
                  {selectedLead.hkiProgress ? ` • ${selectedLead.hkiProgress}` : ""}
                </span>
                <div className="text-slate-500">Revisi logo: {selectedLead.logoRevision}</div>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Dibuat / Diperbarui</span>
                <span className="text-slate-800 font-medium tabular-nums">
                  {formatDate(selectedLead.createdAt)} → {formatDate(selectedLead.updatedAt)}
                </span>
                <div className="text-slate-500">Tahap terakhir: {formatDate(selectedLead.lastStageAt)}</div>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Order</span>
                <span className="text-slate-800 font-medium tabular-nums">
                  {selectedLead.orderCount} order tercatat
                </span>
                <div className="text-slate-500">
                  Formula terkunci: {selectedLead.isFormulaLocked ? "Ya" : "Tidak"} • Jadi produksi:{" "}
                  {formatDate(selectedLead.convertedToProdAt)}
                </div>
              </div>
            </div>

            {selectedLead.spkFileUrl && (
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Berkas SPK</span>
                <a
                  href={selectedLead.spkFileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-blue-600 font-semibold hover:underline break-all"
                >
                  <Link2 className="w-3.5 h-3.5 shrink-0" />
                  {selectedLead.spkFileUrl}
                </a>
              </div>
            )}

            {drawerOrders.length > 0 && (
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Sales Order
                </h4>
                <div className="space-y-2">
                  {drawerOrders.map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100"
                    >
                      <div>
                        <span className="font-bold text-slate-700 tabular-nums">{o.orderNumber}</span>
                        <div className="text-slate-500">
                          {o.quantity.toLocaleString("id-ID")} pcs •{" "}
                          {formatDate(o.transactionDate)} → {formatDate(o.dueDate)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900 tabular-nums">
                          {formatRupiah(o.totalAmount)}
                        </div>
                        <div className="text-slate-500">{o.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedLead.latestSample && (
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Permintaan Sample Terakhir
                </h4>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-slate-700 tabular-nums">
                      {selectedLead.latestSample.sampleCode}
                    </span>
                    <div className="text-slate-500">{selectedLead.latestSample.productName}</div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${stageVariant(
                      selectedLead.latestSample.stage
                    )}`}
                  >
                    {STAGE_LABEL[selectedLead.latestSample.stage] || selectedLead.latestSample.stage}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-500">
                  <span>Revisi: {selectedLead.latestSample.revisionCount}</span>
                  <span>Kirim: {formatDate(selectedLead.latestSample.shippedAt)}</span>
                  <span>Target: {formatDate(selectedLead.latestSample.targetDeadline)}</span>
                  <span>
                    Rating klien:{" "}
                    {selectedLead.latestSample.clientRating !== null
                      ? `${selectedLead.latestSample.clientRating}/5`
                      : "—"}
                  </span>
                </div>
                {selectedLead.latestSample.clientComment && (
                  <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {selectedLead.latestSample.clientComment}
                  </p>
                )}
              </div>
            )}

            {selectedLead.latestActivity && (
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Aktivitas Terakhir
                </h4>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">{selectedLead.latestActivity.activityType}</span>
                  <span className="text-slate-400 tabular-nums">
                    {formatDate(selectedLead.latestActivity.createdAt)}
                  </span>
                </div>
                <p className="text-slate-600">{selectedLead.latestActivity.notes}</p>
                {selectedLead.latestActivity.amount !== null && (
                  <p className="text-emerald-600 font-semibold tabular-nums">
                    Nilai: {formatRupiah(selectedLead.latestActivity.amount)}
                  </p>
                )}
              </div>
            )}

            {selectedLead.notes && (
              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/80 space-y-1.5">
                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                  Catatan Lead
                </span>
                <p className="text-amber-950 leading-relaxed font-medium whitespace-pre-wrap">
                  {selectedLead.notes}
                </p>
              </div>
            )}

            <ScopeNote>
              Kolom yang sebelumnya tampil sebagai contoh — riwayat Sample 1 / Revisi 1 / Revisi 2 (NPF &
              tanggal kirim), budget closing, tanggal target DP, profil karakter klien, rekomendasi Head BD,
              serta checklist 16 milestone alur produksi (Desain Logo, HKI, BPOM Merk/NA, MOU, Desain Kemasan,
              Approval Desain, Bahan Baku, Pelunasan, Mixing, Bahan Kemas, Filling, Label, Box, Packing,
              Delivery) — tidak memiliki penyimpanan di backend, sehingga tidak ditampilkan di sini.
              Beberapa di antaranya hanya punya padanan sebagian: HKI → <code className="font-mono">hkiMode</code>/
              <code className="font-mono">hkiProgress</code>, pelunasan → status invoice pada Sales Order, dan
              tahap produksi → <code className="font-mono">/production/*</code>.
              {selectedGroup === "ro" && " Data RO dibaca dari lead berstatus WON_DEAL (bukan tabel batch terpisah)."}
            </ScopeNote>
          </div>
        )}
      </DnaDetailDrawer>
    </div>
  );
}

export default function ClientManagerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Memuat Client Pipeline...</div>}>
      <ClientManagerContent />
    </Suspense>
  );
}