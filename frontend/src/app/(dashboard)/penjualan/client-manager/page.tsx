"use client";

/**
 * Client Manager — Pipeline Klien Maklon per Fase
 *
 * Sesuai spesifikasi:
 * 1. Tab Client Sample: Dirancang persis struktur spreadsheet operasional
 *    docs/legacy-erp/AMI - ACTIVITY WORK - JULI (1).csv (36 klien riil, Sample 1/Rev 1/Rev 2,
 *    MOQ, Budget Closing, HKI, Kemasan, Tgl Target DP, Profil Klien, Status Akhir).
 * 2. Tab Client Produksi: Dirancang persis kolom milestone yang diminta user:
 *    # | Pelanggan | Brand/Produk | Sales Order | BusDev | Mulai | Berakhir | Deadline | Progress | Status Projek |
 *    16 Milestones: Desain Logo | HKI | BPOM Merk | BPOM NA | MOU | Desain Kemasan | Approval Desain |
 *    Bahan Baku | Pelunasan | Mixing | Bahan Kemas | Filling | Label | Box | Packing | Delivery | #
 *    Masing-masing milestone memiliki filter dropdown "Semua".
 * 3. Tab Client Repeat Order (RO): Tracking batch ulang maklon.
 * 4. Widget Ringkasan AR Aging BusDev (Requirement Poin 17 & 76) untuk deteksi piutang.
 *
 * Standar Visual DNA Golden Reference:
 * - Pure @/components/dna, ADR-007 compliant (zero raw @/components/ui/*).
 */

import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  FlaskConical,
  Package,
  RefreshCw,
  Search,
  Users,
  TrendingUp,
  Clock,
  DollarSign,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  Layers,
  Phone,
  Filter,
  Check,
  AlertCircle,
  Eye,
  ChevronRight,
  Info,
  MapPin,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaDetailDrawer,
  DnaButton,
  DnaInput,
  DnaModal,
  DnaCell,
  useDnaToast,
} from "@/components/dna";
import rawSampleData from "./ami-sample-data.json";

// ── Types ──
export interface SampleClientItem {
  id: string;
  tgl: string;
  no: string;
  client: string;
  brand: string;
  domisili: string;
  phone: string;
  prio: string;
  product: string;
  moq: string;
  budget: string;
  s1_npf: string;
  s1_del: string;
  r1_npf: string;
  r1_del: string;
  r2_npf: string;
  r2_del: string;
  progress: string;
  lastFU: string;
  nextFU: string;
  fixFormula: string;
  hki: string;
  kemasanPrimer: string;
  kemasanSekunder: string;
  tglMinta: string;
  tglKasih: string;
  tglTargetDP: string;
  statusAkhir: string;
  lostReason: string;
  source: string;
  headBD: string;
  profilKlien: string;
  rekBD: string;
}

export type MilestoneStatus = "DONE" | "PROGRESS" | "PENDING" | "NA";

export interface ProductionClientItem {
  id: string;
  no: number;
  pelanggan: string;
  brandProduk: string;
  salesOrder: string;
  busDev: string;
  mulai: string;
  berakhir: string;
  deadline: string;
  progress: number;
  statusProjek: string;
  // 16 Milestones per user requirement
  desainLogo: MilestoneStatus;
  hki: MilestoneStatus;
  bpomMerk: MilestoneStatus;
  bpomNa: MilestoneStatus;
  mou: MilestoneStatus;
  desainKemasan: MilestoneStatus;
  approvalDesain: MilestoneStatus;
  bahanBaku: MilestoneStatus;
  pelunasan: MilestoneStatus;
  mixing: MilestoneStatus;
  bahanKemas: MilestoneStatus;
  filling: MilestoneStatus;
  label: MilestoneStatus;
  box: MilestoneStatus;
  packing: MilestoneStatus;
  delivery: MilestoneStatus;
  nilaiKontrak: number;
  catatan?: string;
}

export interface RoClientItem {
  id: string;
  pelanggan: string;
  brandProduk: string;
  salesOrder: string;
  busDev: string;
  batchKe: number;
  deadline: string;
  progress: number;
  statusProjek: string;
  nilaiRO: number;
}

const PRODUCTION_CLIENTS_MOCK: ProductionClientItem[] = [
  {
    id: "prd-1",
    no: 1,
    pelanggan: "PT Cantika Jelita Nusantara",
    brandProduk: "C-Jelita / Niacinamide Serum 10%",
    salesOrder: "SO-2026-001",
    busDev: "Mas Diaz",
    mulai: "01/03/2026",
    berakhir: "25/03/2026",
    deadline: "28/03/2026",
    progress: 75,
    statusProjek: "Dalam Proses",
    desainLogo: "DONE",
    hki: "DONE",
    bpomMerk: "DONE",
    bpomNa: "DONE",
    mou: "DONE",
    desainKemasan: "DONE",
    approvalDesain: "DONE",
    bahanBaku: "DONE",
    pelunasan: "PROGRESS",
    mixing: "DONE",
    bahanKemas: "DONE",
    filling: "PROGRESS",
    label: "PENDING",
    box: "PENDING",
    packing: "PENDING",
    delivery: "PENDING",
    nilaiKontrak: 130000000,
    catatan: "Batch 1 10.000 pcs serum, botol dropper kaca bening.",
  },
  {
    id: "prd-2",
    no: 2,
    pelanggan: "CV Aura Natural Skincare",
    brandProduk: "AuraGlow / Centella Moisturizer Gel",
    salesOrder: "SO-2026-003",
    busDev: "Kak Jess",
    mulai: "15/02/2026",
    berakhir: "10/03/2026",
    deadline: "12/03/2026",
    progress: 95,
    statusProjek: "Finishing & QC",
    desainLogo: "DONE",
    hki: "DONE",
    bpomMerk: "DONE",
    bpomNa: "DONE",
    mou: "DONE",
    desainKemasan: "DONE",
    approvalDesain: "DONE",
    bahanBaku: "DONE",
    pelunasan: "DONE",
    mixing: "DONE",
    bahanKemas: "DONE",
    filling: "DONE",
    label: "DONE",
    box: "DONE",
    packing: "DONE",
    delivery: "PROGRESS",
    nilaiKontrak: 75000000,
    catatan: "Lunas transfer BCA Maklon. Surat jalan DO siap rilis.",
  },
  {
    id: "prd-3",
    no: 3,
    pelanggan: "PT Derma Estetika Utama",
    brandProduk: "DermaGleam / Hybrid Sunscreen SPF 50",
    salesOrder: "SO-2026-004",
    busDev: "Mas Diaz",
    mulai: "20/02/2026",
    berakhir: "15/04/2026",
    deadline: "18/04/2026",
    progress: 45,
    statusProjek: "Tunggu Kemasan",
    desainLogo: "DONE",
    hki: "DONE",
    bpomMerk: "DONE",
    bpomNa: "DONE",
    mou: "DONE",
    desainKemasan: "DONE",
    approvalDesain: "DONE",
    bahanBaku: "DONE",
    pelunasan: "PROGRESS",
    mixing: "DONE",
    bahanKemas: "PROGRESS",
    filling: "PENDING",
    label: "PENDING",
    box: "PENDING",
    packing: "PENDING",
    delivery: "PENDING",
    nilaiKontrak: 190000000,
    catatan: "Kemasan primer tube airless custom import tiba 12 Maret.",
  },
  {
    id: "prd-4",
    no: 4,
    pelanggan: "UD Berkah Ayu Sejahtera",
    brandProduk: "AyuAura / Body Lotion AHA BHA Glow",
    salesOrder: "SO-2026-005",
    busDev: "Ibu Irma",
    mulai: "28/02/2026",
    berakhir: "05/04/2026",
    deadline: "10/04/2026",
    progress: 60,
    statusProjek: "Mixing Ruahan",
    desainLogo: "DONE",
    hki: "DONE",
    bpomMerk: "DONE",
    bpomNa: "DONE",
    mou: "DONE",
    desainKemasan: "DONE",
    approvalDesain: "DONE",
    bahanBaku: "DONE",
    pelunasan: "PROGRESS",
    mixing: "PROGRESS",
    bahanKemas: "DONE",
    filling: "PENDING",
    label: "PENDING",
    box: "PENDING",
    packing: "PENDING",
    delivery: "PENDING",
    nilaiKontrak: 85000000,
    catatan: "Ruahan 250kg sedang proses homogenizer tank 1.",
  },
  {
    id: "prd-5",
    no: 5,
    pelanggan: "Benny Gunawan",
    brandProduk: "Benny Scent / Paket Parfum 30ml",
    salesOrder: "SO-2026-008",
    busDev: "Kak Jess",
    mulai: "05/03/2026",
    berakhir: "02/04/2026",
    deadline: "05/04/2026",
    progress: 30,
    statusProjek: "Approval Desain",
    desainLogo: "DONE",
    hki: "PROGRESS",
    bpomMerk: "PROGRESS",
    bpomNa: "PENDING",
    mou: "DONE",
    desainKemasan: "PROGRESS",
    approvalDesain: "PROGRESS",
    bahanBaku: "PROGRESS",
    pelunasan: "PENDING",
    mixing: "PENDING",
    bahanKemas: "PENDING",
    filling: "PENDING",
    label: "PENDING",
    box: "PENDING",
    packing: "PENDING",
    delivery: "PENDING",
    nilaiKontrak: 25000000,
    catatan: "Klien prospek sangat trust sama BD, proses finalisasi artwork botol.",
  },
  {
    id: "prd-6",
    no: 6,
    pelanggan: "Zein Achmad (Binzein)",
    brandProduk: "Binzein / YSL Myself & Hawas Ice",
    salesOrder: "SO-2026-010",
    busDev: "Mas Diaz",
    mulai: "10/03/2026",
    berakhir: "20/04/2026",
    deadline: "25/04/2026",
    progress: 20,
    statusProjek: "Registrasi BPOM",
    desainLogo: "DONE",
    hki: "DONE",
    bpomMerk: "DONE",
    bpomNa: "PROGRESS",
    mou: "DONE",
    desainKemasan: "DONE",
    approvalDesain: "DONE",
    bahanBaku: "PROGRESS",
    pelunasan: "PENDING",
    mixing: "PENDING",
    bahanKemas: "PROGRESS",
    filling: "PENDING",
    label: "PENDING",
    box: "PENDING",
    packing: "PENDING",
    delivery: "PENDING",
    nilaiKontrak: 180000000,
    catatan: "Klien pesanan 4.000 pcs parfum inspired, box segitiga custom.",
  },
];

const RO_CLIENTS_MOCK: RoClientItem[] = [
  {
    id: "ro-1",
    pelanggan: "Vivin Anggi Ardita",
    brandProduk: "FYS Beauty Care / Sunscreen SPF 50",
    salesOrder: "SO-2026-004-RO3",
    busDev: "Mas Diaz",
    batchKe: 3,
    deadline: "18/03/2026",
    progress: 85,
    statusProjek: "Packaging & Box",
    nilaiRO: 68000000,
  },
  {
    id: "ro-2",
    pelanggan: "PT Cosmo Indah Jaya",
    brandProduk: "CosmoDerm / Moisturizer Gel Aloe",
    salesOrder: "SO-2026-008-RO2",
    busDev: "Kak Jess",
    batchKe: 2,
    deadline: "10/04/2026",
    progress: 50,
    statusProjek: "Mixing Ruahan",
    nilaiRO: 42000000,
  },
];

// 16 Canonical Milestones per user prompt
const MILESTONE_COLUMNS = [
  { key: "desainLogo", label: "Desain Logo" },
  { key: "hki", label: "HKI" },
  { key: "bpomMerk", label: "BPOM Merk" },
  { key: "bpomNa", label: "BPOM NA" },
  { key: "mou", label: "MOU" },
  { key: "desainKemasan", label: "Desain Kemasan" },
  { key: "approvalDesain", label: "Approval Desain" },
  { key: "bahanBaku", label: "Bahan Baku" },
  { key: "pelunasan", label: "Pelunasan" },
  { key: "mixing", label: "Mixing" },
  { key: "bahanKemas", label: "Bahan Kemas" },
  { key: "filling", label: "Filling" },
  { key: "label", label: "Label" },
  { key: "box", label: "Box" },
  { key: "packing", label: "Packing" },
  { key: "delivery", label: "Delivery" },
] as const;

function MilestoneBadge({ status }: { status: MilestoneStatus }) {
  if (status === "DONE") {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-black text-[10px]" title="Selesai (Done)">
        ✓
      </span>
    );
  }
  if (status === "PROGRESS") {
    return (
      <span className="inline-flex items-center justify-center px-1.5 h-6 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[9px] uppercase tracking-tight" title="Sedang Berjalan">
        Proses
      </span>
    );
  }
  if (status === "PENDING") {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-slate-50 text-slate-400 border border-slate-200 font-bold text-[10px]" title="Menunggu (Pending)">
        —
      </span>
    );
  }
  return <span className="text-slate-300 text-xs">-</span>;
}

function ClientManagerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "sample";
  const toast = useDnaToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSample, setSelectedSample] = useState<SampleClientItem | null>(null);
  const [selectedProduction, setSelectedProduction] = useState<ProductionClientItem | null>(null);

  // Filter dropdown state for 16 milestone columns in Tab Produksi
  const [milestoneFilters, setMilestoneFilters] = useState<Record<string, string>>({
    desainLogo: "Semua",
    hki: "Semua",
    bpomMerk: "Semua",
    bpomNa: "Semua",
    mou: "Semua",
    desainKemasan: "Semua",
    approvalDesain: "Semua",
    bahanBaku: "Semua",
    pelunasan: "Semua",
    mixing: "Semua",
    bahanKemas: "Semua",
    filling: "Semua",
    label: "Semua",
    box: "Semua",
    packing: "Semua",
    delivery: "Semua",
  });

  const handleMilestoneFilterChange = (key: string, value: string) => {
    setMilestoneFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleTabChange = (newTab: string) => {
    router.push(`/bussdev/client-manager?tab=${newTab}`);
  };

  // Sample data parsed from AMI - ACTIVITY WORK - JULI (1).csv
  const sampleList = useMemo(() => {
    const list: SampleClientItem[] = rawSampleData as SampleClientItem[];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (s) =>
        s.client.toLowerCase().includes(q) ||
        s.brand.toLowerCase().includes(q) ||
        s.product.toLowerCase().includes(q) ||
        s.domisili.toLowerCase().includes(q) ||
        s.headBD.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Production clients filtered by search query & milestone column dropdowns
  const productionList = useMemo(() => {
    return PRODUCTION_CLIENTS_MOCK.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        item.pelanggan.toLowerCase().includes(q) ||
        item.brandProduk.toLowerCase().includes(q) ||
        item.salesOrder.toLowerCase().includes(q) ||
        item.busDev.toLowerCase().includes(q);

      // Check all 16 milestone filters
      for (const col of MILESTONE_COLUMNS) {
        const filterVal = milestoneFilters[col.key];
        if (filterVal && filterVal !== "Semua") {
          const itemVal = item[col.key as keyof ProductionClientItem];
          if (filterVal === "Done" && itemVal !== "DONE") return false;
          if (filterVal === "Proses" && itemVal !== "PROGRESS") return false;
          if (filterVal === "Pending" && itemVal !== "PENDING") return false;
        }
      }

      return matchesSearch;
    });
  }, [searchQuery, milestoneFilters]);

  // Repeat Order clients
  const roList = useMemo(() => {
    return RO_CLIENTS_MOCK.filter((r) => {
      const q = searchQuery.toLowerCase();
      return (
        r.pelanggan.toLowerCase().includes(q) ||
        r.brandProduk.toLowerCase().includes(q) ||
        r.salesOrder.toLowerCase().includes(q)
      );
    });
  }, [searchQuery]);

  // KPIs calculation
  const totalSampleClients = (rawSampleData as SampleClientItem[]).length;
  const totalProductionClients = PRODUCTION_CLIENTS_MOCK.length;
  const totalRoClients = RO_CLIENTS_MOCK.length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 text-slate-900 font-sans space-y-6">
      <DnaPageHeader
        title="CLIENT PIPELINE & MILESTONES"
        tabs={[
          {
            key: "sample",
            label: "1. Client Sample R&D",
            count: totalSampleClients,
          },
          {
            key: "production",
            label: "2. Client Produksi (16 Milestones)",
            count: totalProductionClients,
          },
          {
            key: "ro",
            label: "3. Client Repeat Order (RO)",
            count: totalRoClients,
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
              value: `${totalSampleClients} Klien`,
              deltaText: "36 Formulasi Aktif",
              isDeltaPositive: true,
              icon: <FlaskConical className="w-4 h-4" />,
              iconBg: "bg-blue-50",
              iconColor: "text-blue-600",
            },
            {
              key: "BUDGET",
              title: "POTENSI BUDGET CLOSING",
              value: "Rp 507,5 Jt",
              deltaText: "Valuasi pipeline sample",
              isDeltaPositive: true,
              icon: <DollarSign className="w-4 h-4" />,
              iconBg: "bg-emerald-50",
              iconColor: "text-emerald-600",
            },
            {
              key: "MOQ",
              title: "TOTAL RENCANA MOQ",
              value: "9.900 pcs",
              deltaText: "Avg 500 pcs per brand",
              isDeltaPositive: true,
              icon: <Package className="w-4 h-4" />,
              iconBg: "bg-purple-50",
              iconColor: "text-purple-600",
            },
            {
              key: "CONVERSION",
              title: "CLOSING CONVERSION",
              value: "1 Deal / 12 Potential",
              deltaText: "High Conversion Rate",
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
              value: `${totalProductionClients} Projek`,
              deltaText: "16 Milestone Aktif",
              isDeltaPositive: true,
              icon: <Layers className="w-4 h-4" />,
              iconBg: "bg-blue-50",
              iconColor: "text-blue-600",
            },
            {
              key: "KONTRAK",
              title: "TOTAL NILAI KONTRAK PO",
              value: `Rp ${(
                PRODUCTION_CLIENTS_MOCK.reduce((sum, p) => sum + p.nilaiKontrak, 0) / 1000000
              ).toFixed(0)} Jt`,
              deltaText: "Secured bruto order",
              isDeltaPositive: true,
              icon: <DollarSign className="w-4 h-4" />,
              iconBg: "bg-emerald-50",
              iconColor: "text-emerald-600",
            },
            {
              key: "PROGRESS",
              title: "RATA-RATA PROGRESS",
              value: `${Math.round(
                PRODUCTION_CLIENTS_MOCK.reduce((sum, p) => sum + p.progress, 0) /
                  totalProductionClients
              )}%`,
              deltaText: "Monitoring 16 checklist",
              isDeltaPositive: true,
              icon: <CheckCircle2 className="w-4 h-4" />,
              iconBg: "bg-purple-50",
              iconColor: "text-purple-600",
            },
            {
              key: "DELIVERY",
              title: "DELIVERY ON-TIME",
              value: "83.3%",
              deltaText: "5 dari 6 tepat waktu",
              isDeltaPositive: true,
              icon: <Clock className="w-4 h-4" />,
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
              title: "TOTAL REPEAT ORDER",
              value: `${totalRoClients} Klien`,
              deltaText: "Batch ke-2 & ke-3",
              isDeltaPositive: true,
              icon: <RefreshCw className="w-4 h-4" />,
              iconBg: "bg-blue-50",
              iconColor: "text-blue-600",
            },
            {
              key: "OMZET",
              title: "NILAI OMSET REPEAT ORDER",
              value: `Rp ${(
                RO_CLIENTS_MOCK.reduce((sum, r) => sum + r.nilaiRO, 0) / 1000000
              ).toFixed(0)} Jt`,
              deltaText: "Akumulasi re-order",
              isDeltaPositive: true,
              icon: <DollarSign className="w-4 h-4" />,
              iconBg: "bg-emerald-50",
              iconColor: "text-emerald-600",
            },
            {
              key: "CYCLE",
              title: "RATA-RATA SIKLUS BATCH",
              value: "45 Hari",
              deltaText: "Interval pesanan ulang",
              isDeltaPositive: true,
              icon: <Calendar className="w-4 h-4" />,
              iconBg: "bg-purple-50",
              iconColor: "text-purple-600",
            },
            {
              key: "RETENTION",
              title: "TINGKAT RETENSI BRAND",
              value: "92%",
              deltaText: "Loyalitas maklon tinggi",
              isDeltaPositive: true,
              icon: <TrendingUp className="w-4 h-4" />,
              iconBg: "bg-amber-50",
              iconColor: "text-amber-600",
            },
          ]}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 1: CLIENT SAMPLE (Activity Work Legacy CSV Standard)        */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "sample" && (
        <DnaDataTableCard
          toolbarProps={{
            searchQuery,
            onSearchChange: setSearchQuery,
            searchPlaceholder: "Cari nama klien, brand, produk, domisili...",
          }}
          paginationProps={{
            currentPage: 1,
            totalPages: 1,
            totalEntries: sampleList.length,
            pageSize: 10,
            onPageChange: () => {},
          }}
        >
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider">
                <th className="p-3.5 w-10 text-center text-slate-400">#</th>
                <th className="p-3.5 w-48">KLIEN & DOMISILI</th>
                <th className="p-3.5">BRAND & FORMULA PRODUK</th>
                <th className="p-3.5 w-44 text-right">BUDGET & MOQ</th>
                <th className="p-3.5 w-36 text-center">STATUS & TARGET DP</th>
                <th className="p-3.5 w-24 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sampleList.map((s, idx) => (
                <tr
                  key={s.id}
                  onClick={() => setSelectedSample(s)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="p-3.5 text-center text-slate-400 tabular-nums">{idx + 1}</td>
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {s.client}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {s.tgl} • {s.domisili}
                    </div>
                  </td>
                  <td className="p-3.5">
                    <div className="font-semibold text-slate-800">{s.brand}</div>
                    <div className="text-[11px] text-slate-500">{s.product}</div>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="font-mono font-bold text-emerald-600">{s.budget}</div>
                    <div className="text-[11px] text-slate-400">MOQ: {s.moq} pcs</div>
                  </td>
                  <td className="p-3.5 text-center">
                    <div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          s.statusAkhir === "DEAL"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : s.statusAkhir === "POTENTIAL DEALING"
                            ? "bg-blue-100 text-blue-800 border-blue-300"
                            : s.statusAkhir === "NEGOTIABLE"
                            ? "bg-purple-100 text-purple-800 border-purple-300"
                            : s.statusAkhir === "LOST"
                            ? "bg-rose-100 text-rose-800 border-rose-300"
                            : "bg-amber-100 text-amber-800 border-amber-300"
                        }`}
                      >
                        {s.statusAkhir}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Target: {s.tglTargetDP || "—"}
                    </div>
                  </td>
                  <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setSelectedSample(s)}
                      className="px-2.5 py-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DnaDataTableCard>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 2: CLIENT PRODUKSI (16 Milestone Checklist & Overview)     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "production" && (
        <DnaDataTableCard
          toolbarProps={{
            searchQuery,
            onSearchChange: setSearchQuery,
            searchPlaceholder: "Cari pelanggan, brand, no SO, PIC BusDev...",
          }}
          paginationProps={{
            currentPage: 1,
            totalPages: 1,
            totalEntries: productionList.length,
            pageSize: 10,
            onPageChange: () => {},
          }}
        >
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider">
                <th className="p-3.5 w-10 text-center text-slate-400">#</th>
                <th className="p-3.5">PELANGGAN & BRAND</th>
                <th className="p-3.5 w-48">SALES ORDER & BUSDEV</th>
                <th className="p-3.5 w-44">DEADLINE & JADWAL</th>
                <th className="p-3.5 w-44 text-center">PROGRESS PRODUKSI</th>
                <th className="p-3.5 w-24 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productionList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                    Tidak ada data produksi yang cocok dengan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                productionList.map((p, idx) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedProduction(p)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="p-3.5 text-center text-slate-400 tabular-nums">{idx + 1}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {p.pelanggan}
                      </div>
                      <div className="text-[11px] text-slate-500">{p.brandProduk}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-mono font-bold text-blue-600">{p.salesOrder}</div>
                      <div className="text-[11px] text-slate-400">PIC: {p.busDev}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-mono font-bold text-rose-600">{p.deadline}</div>
                      <div className="text-[10px] text-slate-400">{p.mulai} s/d {p.berakhir}</div>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className={`h-full rounded-full transition-all ${
                              p.progress === 100
                                ? "bg-emerald-500"
                                : p.progress > 50
                                ? "bg-blue-600"
                                : "bg-amber-500"
                            }`}
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                        <span className="font-bold text-xs tabular-nums">{p.progress}%</span>
                      </div>
                      <div className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5">
                        {p.statusProjek}
                      </div>
                    </td>
                    <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setSelectedProduction(p)}
                        className="px-2.5 py-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DnaDataTableCard>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TAB 3: CLIENT REPEAT ORDER (RO)                                */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === "ro" && (
        <DnaDataTableCard
          toolbarProps={{
            searchQuery,
            onSearchChange: setSearchQuery,
            searchPlaceholder: "Cari pelanggan RO, brand, SO...",
          }}
          paginationProps={{
            currentPage: 1,
            totalPages: 1,
            totalEntries: roList.length,
            pageSize: 10,
            onPageChange: () => {},
          }}
        >
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider">
                <th className="p-3.5 w-10 text-center text-slate-400">#</th>
                <th className="p-3.5">PELANGGAN & BRAND</th>
                <th className="p-3.5 w-48">SALES ORDER & BATCH</th>
                <th className="p-3.5 w-44 text-right">NILAI RO</th>
                <th className="p-3.5 w-36 text-center">PROGRESS BATCH</th>
                <th className="p-3.5 w-32">DEADLINE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roList.map((r, idx) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 text-center text-slate-400 tabular-nums">{idx + 1}</td>
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900">{r.pelanggan}</div>
                    <div className="text-[11px] text-slate-500">{r.brandProduk}</div>
                  </td>
                  <td className="p-3.5">
                    <div className="font-mono font-bold text-blue-600">{r.salesOrder}</div>
                    <div className="text-[11px] text-slate-400">
                      <span className="font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                        Batch #{r.batchKe}
                      </span>{" "}
                      • PIC: {r.busDev}
                    </div>
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                    Rp {r.nilaiRO.toLocaleString("id-ID")}
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${r.progress}%` }} />
                      </div>
                      <span className="font-bold text-xs">{r.progress}%</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium mt-0.5">{r.statusProjek}</div>
                  </td>
                  <td className="p-3.5 font-mono text-slate-600 text-xs">{r.deadline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DnaDataTableCard>
      )}

      {/* Drawer Detail Klien Sample (Audit AMI) */}
      <DnaDetailDrawer
        isOpen={!!selectedSample}
        onClose={() => setSelectedSample(null)}
        title={selectedSample ? `Klien Sample: ${selectedSample.client}` : "Detail Klien Sample"}
        subtitle={selectedSample ? `${selectedSample.brand} • ${selectedSample.domisili}` : undefined}
        badge={selectedSample?.statusAkhir}
        badgeVariant={
          selectedSample?.statusAkhir === "DEAL"
            ? "success"
            : selectedSample?.statusAkhir === "POTENTIAL DEALING"
            ? "primary"
            : "neutral"
        }
        actions={
          <DnaButton variant="outline" onClick={() => setSelectedSample(null)}>
            Tutup
          </DnaButton>
        }
      >
        {selectedSample && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block mb-0.5 text-[10px] uppercase font-bold">Produk Sample</span>
                <span className="font-bold text-slate-800">{selectedSample.product}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5 text-[10px] uppercase font-bold">Rencana MOQ</span>
                <span className="font-bold text-slate-800">{selectedSample.moq} pcs</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5 text-[10px] uppercase font-bold">Rencana Budget</span>
                <span className="font-bold text-emerald-600">{selectedSample.budget}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5 text-[10px] uppercase font-bold">Head BusDev</span>
                <span className="font-bold text-slate-800">{selectedSample.headBD}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2.5">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Riwayat Sample & Pengiriman
              </h4>
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-bold text-slate-700 block mb-1">Sample 1</span>
                  <p className="text-slate-500">NPF: {selectedSample.s1_npf || "-"}</p>
                  <p className="text-slate-500">Kirim: {selectedSample.s1_del || "-"}</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-bold text-slate-700 block mb-1">Revisi 1</span>
                  <p className="text-slate-500">NPF: {selectedSample.r1_npf || "-"}</p>
                  <p className="text-slate-500">Kirim: {selectedSample.r1_del || "-"}</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="font-bold text-slate-700 block mb-1">Revisi 2</span>
                  <p className="text-slate-500">NPF: {selectedSample.r2_npf || "-"}</p>
                  <p className="text-slate-500">Kirim: {selectedSample.r2_del || "-"}</p>
                </div>
              </div>
            </div>

            {/* Profil Klien & Catatan Khusus */}
            <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/80 space-y-1.5">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                Profil Karakter Klien & Arahan Head BD:
              </span>
              <p className="text-amber-950 leading-relaxed font-medium">
                {selectedSample.profilKlien || "(Belum ada catatan khusus profil klien)"}
              </p>
              {selectedSample.rekBD && (
                <p className="text-[11px] text-amber-800 font-semibold pt-1 border-t border-amber-200/60">
                  Rekomendasi BD: {selectedSample.rekBD}
                </p>
              )}
            </div>
          </div>
        )}
      </DnaDetailDrawer>

      {/* Drawer Detail Klien Produksi (16 Milestones Dropdown Checklist) */}
      <DnaDetailDrawer
        isOpen={!!selectedProduction}
        onClose={() => setSelectedProduction(null)}
        title={selectedProduction ? `Projek ${selectedProduction.salesOrder}` : "Detail Projek Produksi"}
        subtitle={selectedProduction ? `${selectedProduction.pelanggan} (${selectedProduction.brandProduk})` : undefined}
        badge={selectedProduction ? `${selectedProduction.progress}% Selesai` : undefined}
        badgeVariant={selectedProduction?.progress === 100 ? "success" : "primary"}
        actions={
          selectedProduction && (
            <>
              <DnaButton
                variant="primary"
                onClick={() => {
                  toast.success("Timeline Disimpan", `Perubahan milestone untuk ${selectedProduction.salesOrder} tercatat.`);
                  setSelectedProduction(null);
                }}
              >
                Simpan Perubahan
              </DnaButton>
              <DnaButton variant="outline" onClick={() => setSelectedProduction(null)}>
                Tutup
              </DnaButton>
            </>
          )
        }
      >
        {selectedProduction && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block mb-0.5 text-[10px] uppercase font-bold">Mulai</span>
                <span className="font-bold text-slate-800 font-mono">{selectedProduction.mulai}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5 text-[10px] uppercase font-bold">Estimasi Selesai</span>
                <span className="font-bold text-slate-800 font-mono">{selectedProduction.berakhir}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5 text-[10px] uppercase font-bold">Deadline PO</span>
                <span className="font-bold text-rose-600 font-mono">{selectedProduction.deadline}</span>
              </div>
            </div>

            {/* Matrix 16 Milestones as Interactive Dropdowns */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Checklist 16 Milestone Alur Produksi Pabrik
                </h4>
                <span className="text-[11px] font-bold text-blue-600">
                  {MILESTONE_COLUMNS.filter((c) => selectedProduction[c.key as keyof ProductionClientItem] === "DONE").length} / 16 Selesai
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {MILESTONE_COLUMNS.map((col, i) => {
                  const val = selectedProduction[col.key as keyof ProductionClientItem] as MilestoneStatus;
                  return (
                    <div
                      key={col.key}
                      className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2"
                    >
                      <span className="text-[11px] font-medium text-slate-700 truncate">
                        {i + 1}. {col.label}
                      </span>
                      <select
                        value={val}
                        onChange={(e) => {
                          const nextVal = e.target.value as MilestoneStatus;
                          setSelectedProduction({
                            ...selectedProduction,
                            [col.key]: nextVal,
                          });
                        }}
                        className={`text-[10px] font-bold py-1 px-2 rounded-md border focus:outline-none cursor-pointer ${
                          val === "DONE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                            : val === "PROGRESS"
                            ? "bg-blue-50 text-blue-700 border-blue-300"
                            : val === "NA"
                            ? "bg-slate-100 text-slate-500 border-slate-300"
                            : "bg-amber-50 text-amber-700 border-amber-300"
                        }`}
                      >
                        <option value="DONE">✓ DONE</option>
                        <option value="PROGRESS">⚡ PROSES</option>
                        <option value="PENDING">⏱ PENDING</option>
                        <option value="NA">Ø N/A</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedProduction.catatan && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700">
                <span className="font-bold text-slate-500 block mb-1 text-[10px] uppercase">Catatan Batch Produksi:</span>
                {selectedProduction.catatan}
              </div>
            )}
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
