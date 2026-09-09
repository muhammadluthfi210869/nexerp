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
    <div className="min-h-screen bg-[#F8FAFC] pb-20 text-slate-900 font-sans">
      {/* Top Header */}
      <div className="p-6 lg:p-8 space-y-6">
        <DnaPageHeader
          title="Client Pipeline & Milestone Manager"
          description="Pelacakan Terpadu Siklus Maklon: Activity Work Sample R&D (Audit AMI) → Checklist 16 Tahap Produksi Pabrik → Repeat Order Batch"
          backLink={{ href: "/bussdev/guest-book", label: "Buku Tamu" }}
          tabs={[
            {
              key: "sample",
              label: "1. Client Sample (Activity Work)",
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
            items={[
              {
                label: "Total Klien Sample Aktif",
                value: `${totalSampleClients} Klien`,
                subtitle: "Activity Work Juli — Dreamlab",
                trend: "36 Formulasi",
                icon: FlaskConical,
                variant: "blue",
              },
              {
                label: "Rencana Budget Closing",
                value: "Rp 507.500.000",
                subtitle: "Total potensi omset pipeline sample",
                trend: "Valuasi pipeline",
                icon: DollarSign,
                variant: "emerald",
              },
              {
                label: "Total Rencana MOQ",
                value: "9.900 pcs",
                subtitle: "Rata-rata 500 pcs per brand",
                trend: "Kapasitas maklon",
                icon: Package,
                variant: "purple",
              },
              {
                label: "Status Akhir (Closing Rate)",
                value: "1 Deal / 12 Potential",
                subtitle: "18 On Process • 2 Negotiable • 3 Lost",
                trend: "High Conversion",
                icon: TrendingUp,
                variant: "amber",
              },
            ]}
          />
        )}

        {activeTab === "production" && (
          <DnaKpiGrid
            items={[
              {
                label: "Total Projek Produksi Aktif",
                value: `${totalProductionClients} Projek`,
                subtitle: "Dalam siklus 16 milestone pabrik",
                trend: "Active Batch",
                icon: Layers,
                variant: "blue",
              },
              {
                label: "Total Nilai Kontrak PO",
                value: `Rp ${(
                  PRODUCTION_CLIENTS_MOCK.reduce((sum, p) => sum + p.nilaiKontrak, 0) / 1000000
                ).toFixed(0)} Jt`,
                subtitle: "Nilai bruto order produksi",
                trend: "Secured revenue",
                icon: DollarSign,
                variant: "emerald",
              },
              {
                label: "Rata-Rata Progress Produksi",
                value: `${Math.round(
                  PRODUCTION_CLIENTS_MOCK.reduce((sum, p) => sum + p.progress, 0) /
                    totalProductionClients
                )}%`,
                subtitle: "Monitoring 16 checklist milestone",
                trend: "Sesuai timeline",
                icon: CheckCircle2,
                variant: "purple",
              },
              {
                label: "Delivery On-Time Rate",
                value: "83.3%",
                subtitle: "5 dari 6 tepat waktu / ready",
                trend: "1 pending kemasan",
                icon: Clock,
                variant: "amber",
              },
            ]}
          />
        )}

        {activeTab === "ro" && (
          <DnaKpiGrid
            items={[
              {
                label: "Total Repeat Order (RO)",
                value: `${totalRoClients} Klien`,
                subtitle: "Klien repeat order batch ke-2 & ke-3",
                trend: "Retensi tinggi",
                icon: RefreshCw,
                variant: "blue",
              },
              {
                label: "Nilai Omset Repeat Order",
                value: `Rp ${(
                  RO_CLIENTS_MOCK.reduce((sum, r) => sum + r.nilaiRO, 0) / 1000000
                ).toFixed(0)} Jt`,
                subtitle: "Akumulasi re-order bulan ini",
                trend: "High Margin",
                icon: DollarSign,
                variant: "emerald",
              },
              {
                label: "Rata-Rata Siklus Batch",
                value: "45 Hari",
                subtitle: "Interval repeat order dari stok habis",
                trend: "Siklus stabil",
                icon: Calendar,
                variant: "purple",
              },
              {
                label: "Tingkat Retensi Brand",
                value: "92%",
                subtitle: "Loyalitas klien maklon konsisten",
                trend: "Customer Lifetime",
                icon: TrendingUp,
                variant: "amber",
              },
            ]}
          />
        )}

        {/* Integrated AR Aging Summary Widget for BusDev (Requirement Poin 17 & 76) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-800 tracking-tight uppercase">
                  Widget Terintegrasi: AR Aging BusDev Summary
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800">
                  PIUTANG KLIEN
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Peringatan tagihan invoice sebelum approval batch baru (H-3 Kuning, H-7 Merah, Overdue Bouncing)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Overdue H-3:</span>
              <span className="text-xs font-bold text-amber-600">Rp 52.000.000 (1 Klien)</span>
            </div>
            <div className="h-8 w-px bg-slate-100" />
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Overdue H-7:</span>
              <span className="text-xs font-bold text-rose-600">Rp 21.000.000 (1 Klien)</span>
            </div>
          </div>
        </div>

        {/* Level-2 Filter Toolbar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="w-80">
            <DnaInput
              placeholder={
                activeTab === "sample"
                  ? "Cari nama klien, brand, produk, domisili..."
                  : activeTab === "production"
                  ? "Cari pelanggan, brand, no SO, PIC BusDev..."
                  : "Cari pelanggan RO, brand, SO..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
          <div className="text-xs font-bold text-slate-400 flex items-center gap-2">
            <span>
              Menampilkan{" "}
              <span className="text-slate-900 font-bold">
                {activeTab === "sample"
                  ? sampleList.length
                  : activeTab === "production"
                  ? productionList.length
                  : roList.length}
              </span>{" "}
              Record
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 1: CLIENT SAMPLE (Activity Work Legacy CSV Standard)        */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === "sample" && (
          <DnaDataTableCard
            title="Tabel Activity Work — Client Sample R&D (Audit AMI)"
            count={sampleList.length}
            description="Format kanonikal identik AMI - ACTIVITY WORK - JULI (1).csv: Pipeline sample, target MOQ, revisi formula, tgl target DP, dan profil klien."
          >
            {/* Banner Aturan Legacy */}
            <div className="bg-amber-50/70 border-b border-amber-200/60 px-4 py-2.5 flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2 font-semibold">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Aturan DP: Tgl target DP jatuh tempo 30 hari setelah sample pertama dikirim ke klien.</span>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-bold">
                <span>Total Rencana MOQ: 9.900 pcs</span>
                <span>•</span>
                <span>Rencana Budget Closing: Rp 507.500.000</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  {/* Row 1: Main Headers */}
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold uppercase tracking-wider select-none whitespace-nowrap text-[10px]">
                    <th className="py-2.5 px-2.5 w-8 text-center" rowSpan={2}>#</th>
                    <th className="py-2.5 px-2.5" rowSpan={2}>TGL</th>
                    <th className="py-2.5 px-3 min-w-[130px]" rowSpan={2}>NAMA CLIENT</th>
                    <th className="py-2.5 px-2.5" rowSpan={2}>BRAND</th>
                    <th className="py-2.5 px-2.5" rowSpan={2}>DOMISILI</th>
                    <th className="py-2.5 px-2.5" rowSpan={2}>NO TELP</th>
                    <th className="py-2.5 px-3 min-w-[140px]" rowSpan={2}>SAMPLE PRODUCT</th>
                    <th className="py-2.5 px-2.5 text-right" rowSpan={2}>RENCANA MOQ</th>
                    <th className="py-2.5 px-3 text-right min-w-[110px]" rowSpan={2}>BUDGET CLOSING</th>
                    <th className="py-1.5 px-2 text-center bg-blue-50/60 border-l border-r border-slate-200" colSpan={2}>SAMPLE 1</th>
                    <th className="py-1.5 px-2 text-center bg-purple-50/60 border-r border-slate-200" colSpan={2}>REVISI 1</th>
                    <th className="py-1.5 px-2 text-center bg-amber-50/60 border-r border-slate-200" colSpan={2}>REVISI 2</th>
                    <th className="py-2.5 px-3 min-w-[160px]" rowSpan={2}>STATUS PROGRESS</th>
                    <th className="py-2.5 px-2 text-center" rowSpan={2}>HKI</th>
                    <th className="py-2.5 px-2.5" rowSpan={2}>KEMASAN</th>
                    <th className="py-2.5 px-2.5 text-center" rowSpan={2}>TARGET DP</th>
                    <th className="py-2.5 px-2.5 text-center min-w-[90px]" rowSpan={2}>STATUS AKHIR</th>
                    <th className="py-2.5 px-2.5" rowSpan={2}>HEAD BD</th>
                    <th className="py-2.5 px-2 text-right" rowSpan={2}>#</th>
                  </tr>
                  {/* Row 2: Sub-headers for NPF & Delivery */}
                  <tr className="border-b border-slate-200 bg-slate-100/50 text-slate-500 font-semibold text-[9px] uppercase tracking-wider select-none text-center">
                    <th className="py-1 px-2 border-l border-slate-200">NPF</th>
                    <th className="py-1 px-2 border-r border-slate-200">Delivery</th>
                    <th className="py-1 px-2">NPF</th>
                    <th className="py-1 px-2 border-r border-slate-200">Delivery</th>
                    <th className="py-1 px-2">NPF</th>
                    <th className="py-1 px-2 border-r border-slate-200">Delivery</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sampleList.map((s, idx) => (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedSample(s)}
                      className="hover:bg-slate-50/90 transition-colors cursor-pointer"
                    >
                      <td className="py-2.5 px-2.5 text-center font-bold text-slate-400">
                        {s.no || idx + 1}
                      </td>
                      <td className="py-2.5 px-2.5 font-semibold text-slate-700 whitespace-nowrap font-mono text-[10px]">
                        {s.tgl || "—"}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                        {s.client}
                      </td>
                      <td className="py-2.5 px-2.5 font-semibold text-slate-700 whitespace-nowrap">
                        {s.brand && s.brand !== "-" ? s.brand : "—"}
                      </td>
                      <td className="py-2.5 px-2.5 text-slate-600 whitespace-nowrap">
                        {s.domisili || "—"}
                      </td>
                      <td className="py-2.5 px-2.5 font-mono text-slate-500 text-[10px] whitespace-nowrap">
                        {s.phone ? `0${s.phone}` : "—"}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-semibold text-blue-700 bg-blue-50/80 px-2 py-0.5 rounded border border-blue-100">
                          {s.product}
                        </span>
                        {s.prio && s.prio !== "STANDAR" && (
                          <span className="ml-1 text-[9px] font-bold text-amber-700 bg-amber-50 px-1 py-0.5 rounded">
                            {s.prio}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-2.5 text-right whitespace-nowrap font-semibold text-slate-700">
                        {s.moq && s.moq !== "-" ? `${s.moq} pcs` : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap font-bold text-slate-900">
                        {s.budget || "—"}
                      </td>

                      {/* Sample 1 NPF & Delivery */}
                      <td className="py-2.5 px-2 text-center font-mono text-[10px] text-slate-600 border-l border-slate-100 whitespace-nowrap">
                        {s.s1_npf || "—"}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-[10px] text-emerald-700 font-semibold border-r border-slate-100 whitespace-nowrap">
                        {s.s1_del || "—"}
                      </td>

                      {/* Revisi 1 NPF & Delivery */}
                      <td className="py-2.5 px-2 text-center font-mono text-[10px] text-slate-600 whitespace-nowrap">
                        {s.r1_npf || "—"}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-[10px] text-emerald-700 font-semibold border-r border-slate-100 whitespace-nowrap">
                        {s.r1_del || "—"}
                      </td>

                      {/* Revisi 2 NPF & Delivery */}
                      <td className="py-2.5 px-2 text-center font-mono text-[10px] text-slate-600 whitespace-nowrap">
                        {s.r2_npf || "—"}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-[10px] text-emerald-700 font-semibold border-r border-slate-100 whitespace-nowrap">
                        {s.r2_del || "—"}
                      </td>

                      {/* Status Progress */}
                      <td className="py-2.5 px-3 max-w-[200px]">
                        <p className="text-[11px] text-slate-700 font-medium line-clamp-2">
                          {s.progress || "—"}
                        </p>
                        {s.lastFU && (
                          <p className="text-[9px] text-slate-400 mt-0.5 font-mono">FU: {s.lastFU}</p>
                        )}
                      </td>

                      {/* HKI */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                            s.hki && s.hki.includes("SUDAH")
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-50 text-slate-500 border-slate-200"
                          }`}
                        >
                          {s.hki && s.hki.includes("SUDAH") ? "SUDAH" : "BELUM"}
                        </span>
                      </td>

                      {/* Kemasan */}
                      <td className="py-2.5 px-2.5 whitespace-nowrap text-slate-600 text-[10px]">
                        {s.kemasanPrimer || "BELUM PILIH"}
                      </td>

                      {/* Target DP */}
                      <td className="py-2.5 px-2.5 text-center whitespace-nowrap font-mono text-[10px] text-amber-700 font-medium">
                        {s.tglTargetDP || "—"}
                      </td>

                      {/* Status Akhir */}
                      <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
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
                      </td>

                      {/* Head BD */}
                      <td className="py-2.5 px-2.5 whitespace-nowrap">
                        <span className="font-semibold text-slate-700 text-xs">{s.headBD}</span>
                      </td>

                      {/* Aksi */}
                      <td className="py-2.5 px-2 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSample(s);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Lihat Profil & Catatan Klien"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DnaDataTableCard>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 2: CLIENT PRODUKSI (16 Milestone Checklist & Header Filters) */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === "production" && (
          <DnaDataTableCard
            title="Tabel Client Produksi — Monitoring 16 Milestone Alur Maklon"
            count={productionList.length}
            description="Tabel monitoring 16 tahapan kerja produksi. Masing-masing kolom milestone dilengkapi filter status (Semua / Done / Proses / Pending)."
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  {/* Header Row 1: Column Names */}
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold uppercase tracking-wider select-none whitespace-nowrap">
                    <th className="py-2 px-3 w-8 text-center" rowSpan={2}>#</th>
                    <th className="py-2 px-3 min-w-[150px]" rowSpan={2}>Pelanggan</th>
                    <th className="py-2 px-3 min-w-[160px]" rowSpan={2}>Brand/Produk</th>
                    <th className="py-2 px-3" rowSpan={2}>Sales Order</th>
                    <th className="py-2 px-3" rowSpan={2}>BusDev</th>
                    <th className="py-2 px-2 text-center" rowSpan={2}>Mulai</th>
                    <th className="py-2 px-2 text-center" rowSpan={2}>Berakhir</th>
                    <th className="py-2 px-2 text-center" rowSpan={2}>Deadline</th>
                    <th className="py-2 px-3 text-center min-w-[90px]" rowSpan={2}>Progress</th>
                    <th className="py-2 px-3 text-center" rowSpan={2}>Status Projek</th>

                    {/* 16 Milestone Headers */}
                    {MILESTONE_COLUMNS.map((col) => (
                      <th key={col.key} className="py-2 px-2 text-center text-[10px] min-w-[76px]">
                        {col.label}
                      </th>
                    ))}

                    <th className="py-2 px-3 text-right" rowSpan={2}>#</th>
                  </tr>

                  {/* Header Row 2: Filter "Semua" for each of the 16 Milestones */}
                  <tr className="border-b border-slate-200 bg-slate-100/60 text-slate-500 text-[10px]">
                    {MILESTONE_COLUMNS.map((col) => (
                      <th key={col.key} className="py-1 px-1 text-center font-normal">
                        <select
                          className="w-full text-[10px] py-0.5 px-1 rounded border border-slate-300/80 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                          value={milestoneFilters[col.key] || "Semua"}
                          onChange={(e) => handleMilestoneFilterChange(col.key, e.target.value)}
                        >
                          <option value="Semua">Semua</option>
                          <option value="Done">Done</option>
                          <option value="Proses">Proses</option>
                          <option value="Pending">Pending</option>
                        </select>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {productionList.length === 0 ? (
                    <tr>
                      <td colSpan={27} className="text-center py-12 text-slate-400">
                        Tidak ada data produksi yang cocok dengan filter milestone yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    productionList.map((p, idx) => (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedProduction(p)}
                        className="hover:bg-slate-50/90 transition-colors cursor-pointer"
                      >
                        <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                          {p.no || idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                          {p.pelanggan}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-700 whitespace-nowrap">
                          {p.brandProduk}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-semibold text-[10px]">
                            {p.salesOrder}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-700 font-medium">
                          {p.busDev}
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-500 whitespace-nowrap font-mono text-[10px]">
                          {p.mulai}
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-500 whitespace-nowrap font-mono text-[10px]">
                          {p.berakhir}
                        </td>
                        <td className="py-2.5 px-2 text-center text-rose-600 font-bold whitespace-nowrap font-mono text-[10px]">
                          {p.deadline}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center gap-1.5 justify-center">
                            <div className="w-12 bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  p.progress === 100
                                    ? "bg-emerald-500"
                                    : p.progress >= 60
                                    ? "bg-blue-600"
                                    : "bg-amber-500"
                                }`}
                                style={{ width: `${p.progress}%` }}
                              />
                            </div>
                            <span className="font-bold text-[10px] text-slate-700">{p.progress}%</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {p.statusProjek}
                          </span>
                        </td>

                        {/* 16 Milestone Badges */}
                        {MILESTONE_COLUMNS.map((col) => (
                          <td key={col.key} className="py-2 px-1 text-center">
                            <MilestoneBadge status={p[col.key as keyof ProductionClientItem] as MilestoneStatus} />
                          </td>
                        ))}

                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProduction(p);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Lihat Detail Projek"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </DnaDataTableCard>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 3: CLIENT REPEAT ORDER (RO)                                */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === "ro" && (
          <DnaDataTableCard
            title="Daftar Client Repeat Order (RO)"
            count={roList.length}
            description="Monitoring produksi batch ulang pelanggan tetap maklon kosmetik."
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[12px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider uppercase select-none">
                    <th className="p-3.5">PELANGGAN & BRAND</th>
                    <th className="p-3.5">NO. SALES ORDER</th>
                    <th className="p-3.5">BATCH KE-</th>
                    <th className="p-3.5">PIC BUSDEV</th>
                    <th className="p-3.5">DEADLINE BATCH</th>
                    <th className="p-3.5 text-right">NILAI RO</th>
                    <th className="p-3.5 text-center">PROGRESS BATCH</th>
                    <th className="p-3.5 text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roList.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <DnaCell.Text primary={r.pelanggan} secondary={r.brandProduk} />
                      </td>
                      <td className="p-3.5">
                        <DnaCell.Code value={r.salesOrder} />
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-200">
                          Batch #{r.batchKe}
                        </span>
                      </td>
                      <td className="p-3.5 font-medium text-slate-700">{r.busDev}</td>
                      <td className="p-3.5 font-mono text-slate-600 text-xs">{r.deadline}</td>
                      <td className="p-3.5 text-right font-bold text-slate-900">
                        Rp {r.nilaiRO.toLocaleString("id-ID")}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center gap-1.5 justify-center">
                          <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${r.progress}%` }} />
                          </div>
                          <span className="font-bold text-xs">{r.progress}%</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {r.statusProjek}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DnaDataTableCard>
        )}
      </div>

      {/* Modal Detail Klien Sample (Audit AMI) */}
      <DnaModal
        isOpen={!!selectedSample}
        onClose={() => setSelectedSample(null)}
        title="Detail Activity Work Klien Sample"
        size="lg"
      >
        {selectedSample && (
          <div className="space-y-5 text-sm">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Klien Sample #{selectedSample.no}
                </span>
                <h3 className="text-base font-bold text-slate-900">{selectedSample.client}</h3>
                <p className="text-xs text-slate-500">
                  Brand: <span className="font-semibold text-slate-700">{selectedSample.brand}</span> • Domisili:{" "}
                  <span className="font-semibold text-slate-700">{selectedSample.domisili}</span>
                </p>
              </div>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  selectedSample.statusAkhir === "DEAL"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : selectedSample.statusAkhir === "POTENTIAL DEALING"
                    ? "bg-blue-100 text-blue-800 border-blue-300"
                    : "bg-amber-100 text-amber-800 border-amber-300"
                }`}
              >
                {selectedSample.statusAkhir}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block mb-0.5">Produk Sample</span>
                <span className="font-bold text-slate-800">{selectedSample.product}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block mb-0.5">Rencana MOQ</span>
                <span className="font-bold text-slate-800">{selectedSample.moq} pcs</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block mb-0.5">Rencana Budget</span>
                <span className="font-bold text-emerald-600">{selectedSample.budget}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block mb-0.5">Head BusDev</span>
                <span className="font-bold text-slate-800">{selectedSample.headBD}</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Riwayat Sample & Pengiriman
              </h4>
              <div className="grid grid-cols-3 gap-3 text-xs">
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

            {/* Profil Klien & Catatan Khusus (Authentic Note from Legacy ERP) */}
            <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/80 space-y-1.5">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">
                Profil Karakter Klien & Arahan Head BD:
              </span>
              <p className="text-xs text-amber-950 leading-relaxed font-medium">
                {selectedSample.profilKlien || "(Belum ada catatan khusus profil klien)"}
              </p>
              {selectedSample.rekBD && (
                <p className="text-[11px] text-amber-800 font-semibold pt-1 border-t border-amber-200/60">
                  Rekomendasi BD: {selectedSample.rekBD}
                </p>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <DnaButton variant="secondary" onClick={() => setSelectedSample(null)}>
                Tutup
              </DnaButton>
            </div>
          </div>
        )}
      </DnaModal>

      {/* Modal Detail Klien Produksi (16 Milestones) */}
      <DnaModal
        isOpen={!!selectedProduction}
        onClose={() => setSelectedProduction(null)}
        title="Detail Projek & 16 Milestone Produksi"
        size="lg"
      >
        {selectedProduction && (
          <div className="space-y-5 text-sm">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {selectedProduction.salesOrder}
                </span>
                <h3 className="text-base font-bold text-slate-900">{selectedProduction.pelanggan}</h3>
                <p className="text-xs text-slate-500">
                  {selectedProduction.brandProduk} • PIC:{" "}
                  <span className="font-semibold text-slate-700">{selectedProduction.busDev}</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 block">Progress Projek</span>
                <span className="text-base font-black text-blue-600">{selectedProduction.progress}%</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block mb-0.5">Tanggal Mulai</span>
                <span className="font-bold text-slate-800 font-mono">{selectedProduction.mulai}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block mb-0.5">Estimasi Berakhir</span>
                <span className="font-bold text-slate-800 font-mono">{selectedProduction.berakhir}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block mb-0.5">Target Deadline PO</span>
                <span className="font-bold text-rose-600 font-mono">{selectedProduction.deadline}</span>
              </div>
            </div>

            {/* Matrix 16 Milestones */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Status 16 Milestone Alur Produksi
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                {MILESTONE_COLUMNS.map((col) => {
                  const val = selectedProduction[col.key as keyof ProductionClientItem] as MilestoneStatus;
                  return (
                    <div
                      key={col.key}
                      className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between"
                    >
                      <span className="text-[11px] font-semibold text-slate-700">{col.label}</span>
                      <MilestoneBadge status={val} />
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedProduction.catatan && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700">
                <span className="font-bold text-slate-500 block mb-1">Catatan Batch Produksi:</span>
                {selectedProduction.catatan}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <DnaButton variant="secondary" onClick={() => setSelectedProduction(null)}>
                Tutup
              </DnaButton>
              <DnaButton
                variant="primary"
                onClick={() => {
                  toast.success("Timeline Disimpan", `Perubahan milestone untuk ${selectedProduction.salesOrder} tercatat.`);
                  setSelectedProduction(null);
                }}
              >
                Update Milestone
              </DnaButton>
            </div>
          </div>
        )}
      </DnaModal>
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
