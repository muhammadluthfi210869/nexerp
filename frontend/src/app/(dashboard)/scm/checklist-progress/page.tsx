"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  RotateCcw,
  Eye,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  ListOrdered,
  Layers,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaStatCard,
  DnaBadge,
  DnaButton,
  DnaDataTableCard,
  DnaTable,
  DnaTableHead,
  DNA_TABLE_CLASSES,
  DnaCell,
  DnaPagination,
  DnaExportButton,
  DnaModal,
  useDnaToast,
} from "@/components/dna";
import { cn } from "@/lib/utils";

// ── ROW DATA TYPE (EXACT GAMBAR 1) ──
export interface ChecklistProgressRow {
  id: string;
  soNumber: string;
  brand: string;
  product: string;
  customer: string;
  kategori: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  status: "Pending" | "Process" | "Done";
  isInputDesign?: boolean; // For PIC Mas Edi tab
  pic: string;
  bpomNumber?: string;
  bpomStatus?: string;
  notes?: string;
  subMilestones?: Array<{
    urutan: number;
    kategori: string;
    pic: string;
    deadline: string;
    estimasi: string;
    status: "Pending" | "Process" | "Done";
    notes?: string;
  }>;
}

// ── DATASET FROM GAMBAR 1 SCREENSHOT ──
const INITIAL_PROGRESS_ROWS: ChecklistProgressRow[] = [
  {
    id: "cp-1",
    soNumber: "SO-202609-000001",
    brand: "YSMAVELLE",
    product: "White body lotion",
    customer: "Risma Pujayani",
    kategori: "Bahan Kemas",
    tanggalMulai: "2026-09-03",
    tanggalSelesai: "2026-11-25",
    status: "Pending",
    pic: "Nike Febriyanti (SCM)",
    bpomNumber: "NA18260100912",
    bpomStatus: "Proses Uji Laboratorium",
    notes: "Menunggu approval penawaran harga vendor botol pump 250ml.",
    subMilestones: [
      { urutan: 1, kategori: "Desain Logo", pic: "Edi (Creative)", deadline: "2026-09-08", estimasi: "2026-09-07", status: "Done" },
      { urutan: 2, kategori: "Desain Kemasan", pic: "Edi (Creative)", deadline: "2026-09-15", estimasi: "2026-09-16", status: "Process" },
      { urutan: 3, kategori: "Bahan Kemas", pic: "Nike (SCM)", deadline: "2026-10-05", estimasi: "2026-10-10", status: "Pending", notes: "Konfirmasi sampel fisik botol" },
      { urutan: 4, kategori: "Mixing Produksi", pic: "Nur Kholilah (Produksi)", deadline: "2026-10-25", estimasi: "2026-10-25", status: "Pending" },
      { urutan: 5, kategori: "Delivery Kirim", pic: "Agus Pratama (Logistik)", deadline: "2026-11-25", estimasi: "2026-11-25", status: "Pending" },
    ],
  },
  {
    id: "cp-2",
    soNumber: "SO-202609-000001",
    brand: "YSMAVELLE",
    product: "White body lotion",
    customer: "Risma Pujayani",
    kategori: "Label",
    tanggalMulai: "2026-09-03",
    tanggalSelesai: "2026-11-25",
    status: "Pending",
    isInputDesign: true,
    pic: "Edi (Creative)",
    bpomNumber: "NA18260100912",
    bpomStatus: "Drafting Label BPOM",
    notes: "Review teks klaim halal dan nomor NA pada stiker label.",
  },
  {
    id: "cp-3",
    soNumber: "SO-202608-000018",
    brand: "SIGVIOLET",
    product: "DEAL - SHAMPOO SIGVIOLET",
    customer: "Djafar Shodiq (Sigviolet)",
    kategori: "Bahan Kemas",
    tanggalMulai: "2026-08-23",
    tanggalSelesai: "2026-09-10",
    status: "Pending",
    pic: "Nike Febriyanti (SCM)",
    notes: "Pengiriman botol shampoo 100ml dari supplier terlambat 3 hari.",
  },
  {
    id: "cp-4",
    soNumber: "SO-202609-000005",
    brand: "LAWO",
    product: "DARKSPOT CREAM",
    customer: "RAHMAT TUNGGAK (LAWO)",
    kategori: "Label",
    tanggalMulai: "2026-09-01",
    tanggalSelesai: "2026-09-21",
    status: "Process",
    isInputDesign: true,
    pic: "Edi (Creative)",
    notes: "Sedang proses proofing cetak label silver foil.",
  },
  {
    id: "cp-5",
    soNumber: "SO-202608-000017",
    brand: "DRNZK DJ GLOW",
    product: "DJ GLOW COLLAGEN BRIGHTENING SERUM",
    customer: "prof dr Noor Zaman Khan",
    kategori: "Label",
    tanggalMulai: "2026-08-19",
    tanggalSelesai: "2026-09-08",
    status: "Process",
    isInputDesign: true,
    pic: "Edi (Creative)",
    notes: "Proses approval cetak offset warna gradasi.",
  },
  {
    id: "cp-6",
    soNumber: "SO-202608-000017",
    brand: "DRNZK DJ GLOW",
    product: "DJ GLOW COLLAGEN BRIGHTENING SERUM",
    customer: "prof dr Noor Zaman Khan",
    kategori: "Box",
    tanggalMulai: "2026-08-19",
    tanggalSelesai: "2026-09-08",
    status: "Process",
    pic: "Nike Febriyanti (SCM)",
    notes: "Cetak hard box hologram 1.000 pcs selesai 80%.",
  },
  {
    id: "cp-7",
    soNumber: "SO-202608-000017",
    brand: "DRNZK DJ GLOW",
    product: "DJ GLOW COLLAGEN BRIGHTENING DAY CREAM",
    customer: "prof dr Noor Zaman Khan",
    kategori: "Box",
    tanggalMulai: "2026-08-19",
    tanggalSelesai: "2026-09-08",
    status: "Process",
    pic: "Nike Febriyanti (SCM)",
  },
  {
    id: "cp-8",
    soNumber: "SO-202608-000017",
    brand: "DRNZK DJ GLOW",
    product: "DJ GLOW COLLAGEN BRIGHTENING NIGHT CREAM",
    customer: "prof dr Noor Zaman Khan",
    kategori: "Box",
    tanggalMulai: "2026-08-19",
    tanggalSelesai: "2026-09-08",
    status: "Process",
    pic: "Nike Febriyanti (SCM)",
  },
  {
    id: "cp-9",
    soNumber: "SO-202608-000017",
    brand: "DRNZK DJ GLOW",
    product: "DJ GLOW COLLAGEN BRIGHTENING FACIAL WASH",
    customer: "prof dr Noor Zaman Khan",
    kategori: "Box",
    tanggalMulai: "2026-08-19",
    tanggalSelesai: "2026-09-08",
    status: "Process",
    pic: "Nike Febriyanti (SCM)",
  },
  {
    id: "cp-10",
    soNumber: "SO-202608-000009",
    brand: "JO&LA",
    product: "Sky",
    customer: "Benny gunawan",
    kategori: "Label",
    tanggalMulai: "2026-08-13",
    tanggalSelesai: "2026-11-04",
    status: "Process",
    isInputDesign: true,
    pic: "Edi (Creative)",
    notes: "Layouting packaging dan botol tester parfum.",
  },
];

export default function ChecklistProgressPage() {
  const { showToast } = useDnaToast();

  const [items, setItems] = useState<ChecklistProgressRow[]>(INITIAL_PROGRESS_ROWS);
  const [activeTab, setActiveTab] = useState<"MAIN" | "INPUT_DESIGN">("MAIN");
  const [viewMode, setViewMode] = useState<"ALL" | "PIC_ONLY">("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Detail Modal State
  const [selectedItem, setSelectedItem] = useState<ChecklistProgressRow | null>(null);

  // Stats for KPI cards
  const stats = useMemo(() => {
    const totalSo = new Set(items.map((i) => i.soNumber)).size;
    const pendingItems = items.filter((i) => i.status === "Pending").length;
    const designItems = items.filter((i) => i.isInputDesign).length;
    const processItems = items.filter((i) => i.status === "Process").length;
    return { totalSo, pendingItems, designItems, processItems };
  }, [items]);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return items.filter((item) => {
      // Tab filter
      if (activeTab === "INPUT_DESIGN" && !item.isInputDesign) return false;

      // View mode (PIC ONLY vs ALL)
      if (viewMode === "PIC_ONLY" && !item.pic.toLowerCase().includes("scm") && !item.pic.toLowerCase().includes("nike")) {
        return false;
      }

      // Status filter
      if (statusFilter !== "ALL" && item.status !== statusFilter) return false;

      // Search query
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchSo = item.soNumber.toLowerCase().includes(q);
        const matchBrand = item.brand.toLowerCase().includes(q);
        const matchProduct = item.product.toLowerCase().includes(q);
        const matchCustomer = item.customer.toLowerCase().includes(q);
        const matchKategori = item.kategori.toLowerCase().includes(q);
        const matchPic = item.pic.toLowerCase().includes(q);
        if (!matchSo && !matchBrand && !matchProduct && !matchCustomer && !matchKategori && !matchPic) {
          return false;
        }
      }

      return true;
    });
  }, [items, activeTab, viewMode, statusFilter, searchQuery]);

  // Paginated dataset
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;

  return (
    <div className="space-y-6 pb-20 text-slate-900 bg-[#F8FAFC] min-h-screen">
      {/* ── 01. UNBOXED PAGE HEADER (DNA SPEC) ── */}
      <DnaPageHeader
        title="CHECKLIST PROGRESS (KIL ERP)"
        badge={<DnaBadge status="info">PROGRESS CONTROL</DnaBadge>}
        subtitle="Pemantauan alur progres checklist SO maklon, tahapan bahan kemas, label, box, serta dokumen legalitas BPOM."
        breadcrumbItems={[
          { label: "Dashboard", href: "/executive/dashboard" },
          { label: "Umum & Kendali", href: "/scm/checklist-progress" },
          { label: "Checklist Progress" },
        ]}
        actions={
          <div className="flex items-center gap-2.5">
            <DnaExportButton
              onExport={(type: string) => {
                showToast({
                  type: "success",
                  title: `Ekspor ${type.toUpperCase()} Berhasil`,
                  message: `Data ${filteredData.length} checklist progress berhasil diunduh.`,
                });
              }}
            />
          </div>
        }
      />

      {/* ── 02. 4-KPI STAT CARDS ROW ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DnaStatCard
          label="Total SO Aktif"
          value={stats.totalSo}
          subtext="Sales Order dalam pengerjaan"
          variant="default"
        />
        <DnaStatCard
          label="Item Pending (Notifikasi)"
          value={stats.pendingItems}
          subtext="Perlu tindakan verifikasi cepat"
          variant="danger"
        />
        <DnaStatCard
          label="Checklist Input Design"
          value={stats.designItems}
          subtext="PIC Mas Edi (Creative Design)"
          variant="warning"
        />
        <DnaStatCard
          label="Sedang Berjalan (Process)"
          value={stats.processItems}
          subtext="Tahapan produksi & kemasan"
          variant="success"
        />
      </div>

      {/* ── 03. NAVBAR TABS & TOGGLE FILTER (SESUAI LEGACY CSV & GAMBAR 1) ── */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        {/* Navbar Tabs: Main | Input Design */}
        <div className="inline-flex p-1 bg-slate-100 border border-slate-200 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab("MAIN");
              setPage(1);
            }}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              activeTab === "MAIN"
                ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            Main Checklist
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("INPUT_DESIGN");
              setPage(1);
            }}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
              activeTab === "INPUT_DESIGN"
                ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <span>Input Design (PIC Mas Edi)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-mono">
              {stats.designItems}
            </span>
          </button>
        </div>

        {/* Filter Controls: Toggle Versi Keseluruhan vs PIC & Status */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle Versi Keseluruhan vs Khusus PIC */}
          <div className="inline-flex p-0.5 bg-slate-200/80 rounded-lg border border-slate-300 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode("ALL")}
              className={cn(
                "px-2.5 py-1 rounded-md transition-all cursor-pointer",
                viewMode === "ALL" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Versi Keseluruhan
            </button>
            <button
              type="button"
              onClick={() => setViewMode("PIC_ONLY")}
              className={cn(
                "px-2.5 py-1 rounded-md transition-all cursor-pointer",
                viewMode === "PIC_ONLY" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Khusus Kebutuhan PIC
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="Pending">Pending (Notifikasi)</option>
            <option value="Process">Process</option>
            <option value="Done">Done</option>
          </select>

          {/* Reset Filter */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("MAIN");
              setViewMode("ALL");
              setStatusFilter("ALL");
              setSearchQuery("");
              setPage(1);
              showToast({ type: "info", title: "Filter Direset", message: "Menampilkan seluruh checklist progress." });
            }}
            className="h-8 px-2.5 text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 bg-white flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ── 04. DATA TABLE (EXACT GAMBAR 1 STRUCTURE) ── */}
      <DnaDataTableCard
        title="TABEL CHECKLIST PROGRESS MAKLON"
        count={filteredData.length}
        badge={<DnaBadge status="neutral">GSERP KIL SPEC</DnaBadge>}
        actions={
          <div className="flex items-center gap-3">
            {/* Show entries selector */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="h-8 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-hidden"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
            </div>

            {/* Search input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="h-8 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500/20 w-48 placeholder:text-slate-400 font-medium"
              />
            </div>
          </div>
        }
      >
        <DnaTable>
          <DnaTableHead>
            <tr>
              <th className={cn(DNA_TABLE_CLASSES.th, "w-12 text-center")}>#</th>
              <th className={DNA_TABLE_CLASSES.th}>No. Sales</th>
              <th className={DNA_TABLE_CLASSES.th}>Brand/Produk</th>
              <th className={DNA_TABLE_CLASSES.th}>Customer</th>
              <th className={DNA_TABLE_CLASSES.th}>Kategori</th>
              <th className={DNA_TABLE_CLASSES.th}>Tanggal Mulai</th>
              <th className={DNA_TABLE_CLASSES.th}>Tanggal Selesai</th>
              <th className={cn(DNA_TABLE_CLASSES.th, "text-center")}>Status</th>
              <th className={cn(DNA_TABLE_CLASSES.th, "text-center w-24")}>#</th>
            </tr>
          </DnaTableHead>
          <tbody className={DNA_TABLE_CLASSES.tbody}>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Tidak ada data checklist ditemukan</p>
                  <p className="text-xs text-slate-400">Silakan sesuaikan filter status atau kata kunci pencarian.</p>
                </td>
              </tr>
            ) : (
              paginatedData.map((item, idx) => (
                <tr key={item.id} className={DNA_TABLE_CLASSES.tr}>
                  {/* # */}
                  <td className={cn(DNA_TABLE_CLASSES.td, "text-center font-mono text-slate-400 text-xs")}>
                    {(page - 1) * pageSize + idx + 1}
                  </td>

                  {/* No. Sales */}
                  <td className={DNA_TABLE_CLASSES.td}>
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="font-mono font-bold text-xs text-blue-700 hover:underline cursor-pointer">
                        {item.soNumber}
                      </span>
                    </div>
                  </td>

                  {/* Brand / Produk (Stacked layout per Gambar 1) */}
                  <td className={DNA_TABLE_CLASSES.td}>
                    <div>
                      <p className="font-extrabold text-slate-900 text-xs uppercase tracking-tight">
                        {item.brand}
                      </p>
                      <p className="text-[11.5px] text-slate-600 font-medium">
                        {item.product}
                      </p>
                    </div>
                  </td>

                  {/* Customer */}
                  <td className={DNA_TABLE_CLASSES.td}>
                    <span className="text-xs font-semibold text-slate-800">
                      {item.customer}
                    </span>
                  </td>

                  {/* Kategori Badge (Blue per Gambar 1) */}
                  <td className={DNA_TABLE_CLASSES.td}>
                    <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-600 text-white shadow-2xs">
                      {item.kategori}
                    </span>
                  </td>

                  {/* Tanggal Mulai */}
                  <td className={DNA_TABLE_CLASSES.td}>
                    <span className="font-mono text-xs text-slate-700">
                      {item.tanggalMulai}
                    </span>
                  </td>

                  {/* Tanggal Selesai */}
                  <td className={DNA_TABLE_CLASSES.td}>
                    <span className="font-mono text-xs text-slate-700">
                      {item.tanggalSelesai}
                    </span>
                  </td>

                  {/* Status Badge (Pending: Rose/Red, Process: Amber/Orange, Done: Emerald) */}
                  <td className={cn(DNA_TABLE_CLASSES.td, "text-center")}>
                    <span
                      className={cn(
                        "inline-block px-2.5 py-0.5 rounded text-[10.5px] font-bold shadow-2xs",
                        item.status === "Pending"
                          ? "bg-rose-900/80 text-rose-100 border border-rose-800"
                          : item.status === "Process"
                          ? "bg-amber-600 text-amber-50 border border-amber-500"
                          : "bg-emerald-700 text-emerald-50 border border-emerald-600"
                      )}
                    >
                      {item.status}
                    </span>
                  </td>

                  {/* # Action Icons (Eye + List per Gambar 1) */}
                  <td className={cn(DNA_TABLE_CLASSES.td, "text-center")}>
                    <div className="flex items-center justify-center gap-1">
                      {/* Eye / View Modal */}
                      <button
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors shadow-2xs cursor-pointer"
                        title="Lihat Detail SO"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* List / Timeline Modal */}
                      <button
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors shadow-2xs cursor-pointer"
                        title="Rincian Kronologis"
                      >
                        <ListOrdered className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </DnaTable>

        {/* ── PAGINATION BAR ── */}
        <DnaPagination
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredData.length}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
        />
      </DnaDataTableCard>

      {/* ── DETAIL MODAL (1 SO = 1 CHECKLIST UTAMA DENGAN RINCIAN KRONOLOGIS PER SO) ── */}
      <DnaModal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={`Detail Checklist Progress: ${selectedItem?.soNumber}`}
        subtitle={`Klien: ${selectedItem?.customer} • Brand: ${selectedItem?.brand} (${selectedItem?.product})`}
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-4">
            {/* Header info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs">
              <div>
                <p className="text-slate-400 font-medium">Customer Klien:</p>
                <p className="font-bold text-slate-800">{selectedItem.customer}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Nomor Izin BPOM:</p>
                <p className="font-mono font-bold text-blue-700">{selectedItem.bpomNumber || "Dalam Proses Pengajuan"}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">PIC Penanggung Jawab:</p>
                <p className="font-bold text-slate-800">{selectedItem.pic}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Status Keseluruhan:</p>
                <span className="font-bold text-amber-700">{selectedItem.status}</span>
              </div>
            </div>

            {selectedItem.notes && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <span className="font-bold">Catatan Kendala: </span>
                  <span>{selectedItem.notes}</span>
                </div>
              </div>
            )}

            {/* Rincian Kronologis Tahapan (Sesuai Legacy ERP Poin 36, 54, 55, 64-67) */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100/80 px-3.5 py-2 border-b border-slate-200 text-xs font-bold text-slate-700">
                Rincian Kronologis Seluruh Kategori SO (Urutan Proses Sesuai SOP)
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-3 py-2 text-center w-10">#</th>
                    <th className="px-3 py-2">Kategori Milestone</th>
                    <th className="px-3 py-2">PIC Penanggung Jawab</th>
                    <th className="px-3 py-2 font-mono">Target Deadline</th>
                    <th className="px-3 py-2 font-mono">Estimasi</th>
                    <th className="px-3 py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(selectedItem.subMilestones || [
                    { urutan: 1, kategori: "Desain Logo", pic: "Edi (Creative)", deadline: "2026-09-08", estimasi: "2026-09-07", status: "Done" as const },
                    { urutan: 2, kategori: "HKI Merek", pic: "Cipta (Legal)", deadline: "2026-09-14", estimasi: "2026-09-14", status: "Done" as const },
                    { urutan: 3, kategori: "BPOM NA", pic: "Cipta (Regulasi)", deadline: "2026-09-28", estimasi: "2026-09-28", status: "Process" as const },
                    { urutan: 4, kategori: "Bahan Baku & Kemas", pic: "Nike (SCM)", deadline: "2026-10-15", estimasi: "2026-10-18", status: "Pending" as const },
                    { urutan: 5, kategori: "Mixing Produksi", pic: "Nur Kholilah", deadline: "2026-10-28", estimasi: "2026-10-28", status: "Pending" as const },
                    { urutan: 6, kategori: "Delivery", pic: "Agus Pratama", deadline: "2026-11-25", estimasi: "2026-11-25", status: "Pending" as const },
                  ]).map((sub) => (
                    <tr key={sub.urutan} className="hover:bg-slate-50/60">
                      <td className="px-3 py-2 text-center font-mono text-slate-400">{sub.urutan}</td>
                      <td className="px-3 py-2 font-semibold text-slate-800">{sub.kategori}</td>
                      <td className="px-3 py-2 font-medium text-slate-700">{sub.pic}</td>
                      <td className="px-3 py-2 font-mono text-slate-600">{sub.deadline}</td>
                      <td className="px-3 py-2 font-mono text-slate-500">{sub.estimasi}</td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold shadow-2xs",
                            sub.status === "Done"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : sub.status === "Process"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-rose-100 text-rose-800 border border-rose-200"
                          )}
                        >
                          {sub.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <DnaButton variant="secondary" onClick={() => setSelectedItem(null)}>
                Tutup Detail
              </DnaButton>
            </div>
          </div>
        )}
      </DnaModal>
    </div>
  );
}
