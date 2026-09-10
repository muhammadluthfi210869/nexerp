"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  RotateCcw,
  Eye,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  Clock,
  ArrowLeft,
  AlertCircle,
  Package,
  Layers,
  CheckCircle2,
  SlidersHorizontal,
  History,
  TrendingUp,
  CheckSquare,
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
  useDnaToast,
} from "@/components/dna";
import { cn } from "@/lib/utils";

// ── TYPES & INTERFACES ──
export interface MilestoneRow {
  urutan: number;
  namaTimeline: string;
  pic: string;
  periodeHari: string; // e.g. "0-1", "1-2"
  startDayOffset: number; // For Gantt chart calculation
  durationDays: number;
  tanggalMulai: string;
  tanggalSelesai: string;
  estimasiDeadline?: string;
  status: "Done" | "In Progress" | "Pending" | "Overdue";
  notes?: string;
}

export interface ProjectTrackingItem {
  id: string;
  salesCode: string;
  customer: string;
  brand: string;
  product: string;
  salesCategory: "Produk Baru" | "Repeat Order" | "Custom Formulasi";
  packagingType: string;
  packagingDetail: string;
  busdev: string;
  picPo: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  totalHariKerja: number;
  hariKerjaSeninJumat: number;
  hariSebenarnya: number;
  weekendDilewati: number;
  status: "ON_TRACK" | "PENDING_APPROVAL" | "OVERDUE" | "COMPLETED";
  fotoKemasanUrl: string;
  milestones: MilestoneRow[];
}

// ── SAMPLE DATASETS MATCHING GAMBAR 2 (26 TAHAPAN LENGKAP) ──
const SAMPLE_MILESTONES_GAMBAR_2: MilestoneRow[] = [
  { urutan: 1, namaTimeline: "Design Logo", pic: "Edi (Creative)", periodeHari: "0-1", startDayOffset: 0, durationDays: 1, tanggalMulai: "2026-09-09", tanggalSelesai: "2026-09-10", status: "Done" },
  { urutan: 2, namaTimeline: "HKI", pic: "Cipta (Legal)", periodeHari: "1-2", startDayOffset: 1, durationDays: 1, tanggalMulai: "2026-09-10", tanggalSelesai: "2026-09-11", status: "Done" },
  { urutan: 3, namaTimeline: "Busdev Mengumpulkan Berkas Klien dan Membuat Order", pic: "Fitri (Busdev)", periodeHari: "1-3", startDayOffset: 1, durationDays: 2, tanggalMulai: "2026-09-10", tanggalSelesai: "2026-09-12", status: "Done" },
  { urutan: 4, namaTimeline: "RND Membuat Batch Record", pic: "Dr. Hendra (QC/R&D)", periodeHari: "1-2", startDayOffset: 1, durationDays: 1, tanggalMulai: "2026-09-10", tanggalSelesai: "2026-09-11", status: "Done" },
  { urutan: 5, namaTimeline: "Admin Proses Daftar Brand", pic: "Cipta (Legal)", periodeHari: "1-7", startDayOffset: 1, durationDays: 6, tanggalMulai: "2026-09-10", tanggalSelesai: "2026-09-16", status: "Done" },
  { urutan: 6, namaTimeline: "Admin Proses Berkas NA BPOM", pic: "Cipta (Regulasi)", periodeHari: "2-7", startDayOffset: 2, durationDays: 5, tanggalMulai: "2026-09-11", tanggalSelesai: "2026-09-16", status: "Done" },
  { urutan: 7, namaTimeline: "Admin Proses FKP", pic: "R&D Admin", periodeHari: "4-6", startDayOffset: 4, durationDays: 2, tanggalMulai: "2026-09-15", tanggalSelesai: "2026-09-17", status: "Done" },
  { urutan: 8, namaTimeline: "Admin Proses FRP", pic: "R&D Admin", periodeHari: "5-8", startDayOffset: 5, durationDays: 3, tanggalMulai: "2026-09-16", tanggalSelesai: "2026-09-21", status: "Done" },
  { urutan: 9, namaTimeline: "Timeline dari Kepala Pabrik ke Busdev (dan Masuk Kalender)", pic: "Plant Manager", periodeHari: "2-5", startDayOffset: 2, durationDays: 3, tanggalMulai: "2026-09-11", tanggalSelesai: "2026-09-16", status: "Done" },
  { urutan: 10, namaTimeline: "Busdev Work Order Logo", pic: "Fitri (Busdev)", periodeHari: "2-4", startDayOffset: 2, durationDays: 2, tanggalMulai: "2026-09-11", tanggalSelesai: "2026-09-15", status: "Done" },
  { urutan: 11, namaTimeline: "Busdev Work Order Design", pic: "Fitri (Busdev)", periodeHari: "2-5", startDayOffset: 2, durationDays: 3, tanggalMulai: "2026-09-11", tanggalSelesai: "2026-09-16", status: "Done" },
  { urutan: 12, namaTimeline: "Design Kemasan", pic: "Edi (Creative)", periodeHari: "7-16", startDayOffset: 7, durationDays: 9, tanggalMulai: "2026-09-18", tanggalSelesai: "2026-09-29", estimasiDeadline: "2026-09-28", status: "In Progress" },
  { urutan: 13, namaTimeline: "NA di BPOM 14 Hari", pic: "Cipta (Regulasi)", periodeHari: "9-26", startDayOffset: 9, durationDays: 17, tanggalMulai: "2026-09-22", tanggalSelesai: "2026-10-15", estimasiDeadline: "2026-10-15", status: "In Progress" },
  { urutan: 14, namaTimeline: "DIP", pic: "R&D Regulatory", periodeHari: "8-10", startDayOffset: 8, durationDays: 2, tanggalMulai: "2026-09-21", tanggalSelesai: "2026-09-23", status: "Done" },
  { urutan: 15, namaTimeline: "QC - Kemasan Baru", pic: "Dr. Hendra (QC)", periodeHari: "8-13", startDayOffset: 8, durationDays: 5, tanggalMulai: "2026-09-21", tanggalSelesai: "2026-09-25", status: "Done" },
  { urutan: 16, namaTimeline: "Design Approval Kemasan", pic: "Fitri (Busdev)", periodeHari: "16-17", startDayOffset: 16, durationDays: 1, tanggalMulai: "2026-10-13", tanggalSelesai: "2026-10-14", status: "Pending" },
  { urutan: 17, namaTimeline: "Bahan Baku", pic: "Nike Febriyanti (SCM)", periodeHari: "7-18", startDayOffset: 7, durationDays: 11, tanggalMulai: "2026-09-18", tanggalSelesai: "2026-10-01", status: "In Progress", notes: "UV Filter dalam perjalanan laut" },
  { urutan: 18, namaTimeline: "Bahan Kemas", pic: "Nike Febriyanti (SCM)", periodeHari: "7-18", startDayOffset: 7, durationDays: 11, tanggalMulai: "2026-09-18", tanggalSelesai: "2026-10-01", status: "In Progress", notes: "Botol tube 50g diproduksi vendor" },
  { urutan: 19, namaTimeline: "Tanda Tangan Approval Design Klien", pic: "Fitri (Busdev)", periodeHari: "17-19", startDayOffset: 17, durationDays: 2, tanggalMulai: "2026-10-14", tanggalSelesai: "2026-10-16", status: "Pending" },
  { urutan: 20, namaTimeline: "Bahan Packing (Label)", pic: "Nike Febriyanti (SCM)", periodeHari: "17-21", startDayOffset: 17, durationDays: 4, tanggalMulai: "2026-10-14", tanggalSelesai: "2026-10-20", status: "Pending" },
  { urutan: 21, namaTimeline: "Bahan Packing Tube/Box", pic: "Nike Febriyanti (SCM)", periodeHari: "17-31", startDayOffset: 17, durationDays: 14, tanggalMulai: "2026-10-14", tanggalSelesai: "2026-11-04", status: "Pending" },
  { urutan: 22, namaTimeline: "QC - Gudang (2 periode)", pic: "Dr. Hendra (QC)", periodeHari: "21-27, 33-35", startDayOffset: 21, durationDays: 6, tanggalMulai: "2026-10-19", tanggalSelesai: "2026-10-28", status: "Pending" },
  { urutan: 23, namaTimeline: "Produksi (2 periode)", pic: "Nur Kholilah (Produksi)", periodeHari: "21-29", startDayOffset: 21, durationDays: 8, tanggalMulai: "2026-10-19", tanggalSelesai: "2026-10-29", status: "Pending" },
  { urutan: 24, namaTimeline: "Packing (2 periode)", pic: "Nur Kholilah (Produksi)", periodeHari: "26-30", startDayOffset: 26, durationDays: 4, tanggalMulai: "2026-10-27", tanggalSelesai: "2026-10-31", status: "Pending" },
  { urutan: 25, namaTimeline: "QC (1 periode)", pic: "Dr. Hendra (QC)", periodeHari: "28-30", startDayOffset: 28, durationDays: 2, tanggalMulai: "2026-10-29", tanggalSelesai: "2026-10-31", status: "Pending" },
  { urutan: 26, namaTimeline: "Delivery (2 periode)", pic: "Agus Pratama (Logistik)", periodeHari: "27-29, 30-31", startDayOffset: 27, durationDays: 3, tanggalMulai: "2026-10-30", tanggalSelesai: "2026-11-02", status: "Pending" },
];

const INITIAL_PROJECT_ITEMS: ProjectTrackingItem[] = [
  {
    id: "proj-1",
    salesCode: "SO-202609-000001",
    customer: "Paramita (MJB Beauty)",
    brand: "MJB Beauty",
    product: "Tinted Sunscreen Glowing Series, 50g",
    salesCategory: "Produk Baru",
    packagingType: "Botol Tube 50g Matte Gold",
    packagingDetail: "Botol tube soft-touch print foil gold + nozzle tip applicator",
    busdev: "Fitri Handayani",
    picPo: "Nike Febriyanti (SCM)",
    tanggalMulai: "2026-09-09",
    tanggalSelesai: "2026-12-01",
    totalHariKerja: 59,
    hariKerjaSeninJumat: 60,
    hariSebenarnya: 83,
    weekendDilewati: 23,
    status: "ON_TRACK",
    fotoKemasanUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80",
    milestones: SAMPLE_MILESTONES_GAMBAR_2,
  },
  {
    id: "proj-2",
    salesCode: "SO-202609-000005",
    customer: "RAHMAT TUNGGAK (LAWO)",
    brand: "LAWO",
    product: "DARKSPOT CREAM 30g",
    salesCategory: "Repeat Order",
    packagingType: "Pot Jar Putih 30g",
    packagingDetail: "Pot jar akrilik doff double wall dengan lid steril",
    busdev: "Budi Hermawan",
    picPo: "Nike Febriyanti (SCM)",
    tanggalMulai: "2026-09-01",
    tanggalSelesai: "2026-10-25",
    totalHariKerja: 40,
    hariKerjaSeninJumat: 40,
    hariSebenarnya: 54,
    weekendDilewati: 14,
    status: "ON_TRACK",
    fotoKemasanUrl: "https://images.unsplash.com/photo-1608248597359-2169b93e4a2e?w=500&auto=format&fit=crop&q=80",
    milestones: SAMPLE_MILESTONES_GAMBAR_2.slice(0, 15),
  },
  {
    id: "proj-3",
    salesCode: "SO-202608-000018",
    customer: "Djafar Shodiq (Sigviolet)",
    brand: "SIGVIOLET",
    product: "DEAL - SHAMPOO SIGVIOLET 250ml",
    salesCategory: "Produk Baru",
    packagingType: "Botol Pump 250ml Hitam",
    packagingDetail: "Botol pump HDPE solid black matte",
    busdev: "Fitri Handayani",
    picPo: "Nike Febriyanti (SCM)",
    tanggalMulai: "2026-08-23",
    tanggalSelesai: "2026-10-15",
    totalHariKerja: 38,
    hariKerjaSeninJumat: 38,
    hariSebenarnya: 52,
    weekendDilewati: 14,
    status: "OVERDUE",
    fotoKemasanUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&auto=format&fit=crop&q=80",
    milestones: SAMPLE_MILESTONES_GAMBAR_2.slice(0, 18).map((m) =>
      m.urutan === 18 ? { ...m, status: "Overdue" as const, notes: "Keterlambatan supply botol pump dari pabrik" } : m
    ),
  },
  {
    id: "proj-4",
    salesCode: "SO-202608-000017",
    customer: "prof dr Noor Zaman Khan",
    brand: "DRNZK DJ GLOW",
    product: "DJ GLOW COLLAGEN BRIGHTENING SERUM 20ml",
    salesCategory: "Produk Baru",
    packagingType: "Botol Pipet Kaca 20ml",
    packagingDetail: "Botol kaca transparan dengan pipet dropper karet putih",
    busdev: "Budi Hermawan",
    picPo: "Ahmad Fauzi (SCM)",
    tanggalMulai: "2026-08-19",
    tanggalSelesai: "2026-11-10",
    totalHariKerja: 58,
    hariKerjaSeninJumat: 58,
    hariSebenarnya: 82,
    weekendDilewati: 24,
    status: "PENDING_APPROVAL",
    fotoKemasanUrl: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500&auto=format&fit=crop&q=80",
    milestones: SAMPLE_MILESTONES_GAMBAR_2.slice(0, 16),
  },
];

export default function ChecklistTrackingPage() {
  const { showToast } = useDnaToast();

  const [projects, setProjects] = useState<ProjectTrackingItem[]>(INITIAL_PROJECT_ITEMS);
  const [searchQuery, setSearchQuery] = useState("");
  const [tabFilter, setTabFilter] = useState<"ALL" | "ON_TRACK" | "PENDING_APPROVAL" | "OVERDUE">("ALL");
  const [picFilter, setPicFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Expanded row IDs for inline dropdown accordion ke bawah!
  const [expandedRowIds, setExpandedRowIds] = useState<string[]>([]);

  // Active full-screen timeline item view (Gambar 2 mode!)
  const [viewingTimelineItem, setViewingTimelineItem] = useState<ProjectTrackingItem | null>(null);

  // Distinct list of PICs for filter
  const picOptions = useMemo(() => {
    const list = new Set<string>();
    projects.forEach((proj) => {
      list.add(proj.busdev);
      list.add(proj.picPo);
      proj.milestones.forEach((m) => list.add(m.pic));
    });
    return Array.from(list).sort();
  }, [projects]);

  // Toggle expand row ke bawah
  const toggleRowExpansion = (id: string) => {
    setExpandedRowIds((prev) =>
      prev.includes(id) ? prev.filter((rId) => rId !== id) : [...prev, id]
    );
  };

  // Toggle status of milestone inside expanded dropdown
  const handleToggleMilestone = (projectId: string, urutan: number) => {
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== projectId) return proj;
        const updated = proj.milestones.map((m) => {
          if (m.urutan !== urutan) return m;
          const nextStatus = m.status === "Done" ? "In Progress" : m.status === "In Progress" ? "Done" : "In Progress";
          return { ...m, status: nextStatus as any };
        });
        return { ...proj, milestones: updated };
      })
    );
    showToast({
      type: "success",
      title: "Status Diperbarui",
      message: "Progres tahapan milestone berhasil disimpan.",
    });
  };

  // Filtered dataset with Deep Search
  const filteredProjects = useMemo(() => {
    return projects.filter((item) => {
      // Tab filter
      if (tabFilter === "ON_TRACK" && item.status !== "ON_TRACK" && item.status !== "COMPLETED") return false;
      if (tabFilter === "PENDING_APPROVAL" && item.status !== "PENDING_APPROVAL") return false;
      if (tabFilter === "OVERDUE" && item.status !== "OVERDUE") return false;

      // PIC filter
      if (picFilter !== "ALL") {
        const matchPicInMilestones = item.milestones.some((m) => m.pic.toLowerCase().includes(picFilter.toLowerCase()));
        const matchPicPo = item.picPo.toLowerCase().includes(picFilter.toLowerCase());
        const matchBusdev = item.busdev.toLowerCase().includes(picFilter.toLowerCase());
        if (!matchPicInMilestones && !matchPicPo && !matchBusdev) return false;
      }

      // Deep Search
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchCode = item.salesCode.toLowerCase().includes(q);
        const matchClient = item.customer.toLowerCase().includes(q);
        const matchBrand = item.brand.toLowerCase().includes(q);
        const matchProduct = item.product.toLowerCase().includes(q);
        const matchPackagingType = item.packagingType.toLowerCase().includes(q);
        const matchPackagingDetail = item.packagingDetail.toLowerCase().includes(q);
        const matchPicPo = item.picPo.toLowerCase().includes(q);
        const matchBusdev = item.busdev.toLowerCase().includes(q);
        const matchMilestone = item.milestones.some(
          (m) => m.namaTimeline.toLowerCase().includes(q) || m.pic.toLowerCase().includes(q)
        );

        if (
          !matchCode &&
          !matchClient &&
          !matchBrand &&
          !matchProduct &&
          !matchPackagingType &&
          !matchPackagingDetail &&
          !matchPicPo &&
          !matchBusdev &&
          !matchMilestone
        ) {
          return false;
        }
      }

      return true;
    });
  }, [projects, tabFilter, picFilter, searchQuery]);

  // Paginated dataset
  const paginatedProjects = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, page, pageSize]);

  const totalPages = Math.ceil(filteredProjects.length / pageSize) || 1;

  // ════════════════════════════════════════════════════════════════
  // VIEW MODE: GAMBAR 2 (TIMELINE CHECKLIST VIEW LENGKAP)
  // ════════════════════════════════════════════════════════════════
  if (viewingTimelineItem) {
    const item = viewingTimelineItem;
    return (
      <div className="space-y-6 pb-20 text-slate-900 bg-[#F8FAFC] min-h-screen">
        {/* Top Spec / Header Bar per Gambar 2 */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <p className="text-xs text-slate-500 font-medium">Beranda / Timeline Checklist</p>
            <h1 className="text-xl font-bold text-slate-900 mt-1">Timeline Checklist</h1>
          </div>
          <button
            type="button"
            onClick={() => setViewingTimelineItem(null)}
            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali</span>
          </button>
        </div>

        {/* ── CARD 1: INFORMASI CHECKLIST (PERSIS GAMBAR 2) ── */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="bg-sky-500 px-4 py-2.5 text-white font-bold text-xs flex items-center gap-2">
            <CheckSquare className="w-4 h-4" />
            <span>Informasi Checklist</span>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-y-2.5 gap-x-6 text-xs">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Sales Code :</span>
              <span className="px-2.5 py-0.5 bg-blue-600 text-white rounded font-mono font-bold text-[11px]">
                {item.salesCode}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Customer :</span>
              <span className="font-bold text-slate-800">{item.customer}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Brand/Produk :</span>
              <span className="font-semibold text-slate-800">
                {item.brand} <span className="text-slate-500 font-normal">({item.product})</span>
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Kategori Penjualan :</span>
              <span className="font-bold text-slate-800">{item.salesCategory}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Tanggal Mulai :</span>
              <span className="px-2.5 py-0.5 bg-emerald-600 text-white rounded font-mono font-bold text-[11px]">
                {item.tanggalMulai}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Tanggal Selesai :</span>
              <span className="px-2.5 py-0.5 bg-amber-600 text-white rounded font-mono font-bold text-[11px]">
                {item.tanggalSelesai}
              </span>
            </div>
          </div>
        </div>

        {/* ── CARD 2: RINGKASAN HARI KERJA (PERSIS GAMBAR 2) ── */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="bg-sky-500 px-4 py-2.5 text-white font-bold text-xs flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Ringkasan Hari Kerja</span>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-y-2.5 gap-x-6 text-xs">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Total Hari Kerja :</span>
              <span className="px-2.5 py-0.5 bg-blue-600 text-white rounded font-bold text-[11px]">
                {item.totalHariKerja} hari
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Tanggal Mulai :</span>
              <span className="font-mono text-slate-800 font-semibold">{item.tanggalMulai}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Tanggal Selesai :</span>
              <span className="font-mono text-slate-800 font-semibold">{item.tanggalSelesai}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Hari Kerja (Senin-Jumat) :</span>
              <span className="px-2.5 py-0.5 bg-emerald-600 text-white rounded font-bold text-[11px]">
                {item.hariKerjaSeninJumat} hari
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Hari Sebenarnya (termasuk weekend) :</span>
              <span className="px-2.5 py-0.5 bg-blue-500 text-white rounded font-bold text-[11px]">
                {item.hariSebenarnya} hari
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Weekend Dilewati :</span>
              <span className="px-2.5 py-0.5 bg-rose-600 text-white rounded font-bold text-[11px]">
                {item.weekendDilewati} hari
              </span>
            </div>
          </div>
        </div>

        {/* ── CARD 3: VISUALISASI TIMELINE GANTT CHART HORIZONTAL (PERSIS GAMBAR 2) ── */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="bg-sky-500 px-4 py-2.5 text-white font-bold text-xs flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span>Visualisasi Timeline</span>
          </div>

          <div className="p-4 overflow-x-auto">
            {/* Gantt Header Axis (0, 10, 20, 30, 40, 50, 60, 70, 80) */}
            <div className="min-w-[800px]">
              <div className="grid grid-cols-12 border-b border-slate-200 pb-1 text-[10px] font-bold text-slate-400">
                <div className="col-span-3 text-left pl-2">Tahapan Milestone</div>
                <div className="col-span-1 text-center">0</div>
                <div className="col-span-1 text-center">10</div>
                <div className="col-span-1 text-center">20</div>
                <div className="col-span-1 text-center">30</div>
                <div className="col-span-1 text-center">40</div>
                <div className="col-span-1 text-center">50</div>
                <div className="col-span-1 text-center">60</div>
                <div className="col-span-1 text-center">70</div>
                <div className="col-span-1 text-center">80</div>
              </div>

              {/* Gantt Milestone Horizontal Bars */}
              <div className="divide-y divide-slate-100 py-1">
                {item.milestones.map((m) => {
                  const leftPercent = Math.min(90, (m.startDayOffset / 60) * 100);
                  const widthPercent = Math.max(3, (m.durationDays / 60) * 100);

                  return (
                    <div key={m.urutan} className="grid grid-cols-12 items-center py-1.5 hover:bg-slate-50/70 text-xs">
                      {/* Name */}
                      <div className="col-span-3 text-[11px] font-semibold text-slate-700 truncate pl-2" title={m.namaTimeline}>
                        {m.namaTimeline}
                      </div>

                      {/* Bar Track (9 Columns) */}
                      <div className="col-span-9 relative h-5 flex items-center bg-slate-50/50 rounded">
                        <div
                          className="absolute h-3.5 bg-amber-500 hover:bg-amber-600 rounded text-[9px] font-bold text-amber-950 flex items-center justify-center shadow-2xs transition-all cursor-pointer"
                          style={{
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                            minWidth: "16px",
                          }}
                          title={`${m.namaTimeline}: ${m.tanggalMulai} s/d ${m.tanggalSelesai} (${m.durationDays} hari)`}
                        >
                          {m.durationDays > 1 && <span className="px-1">{m.durationDays}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── CARD 4: TABEL DETAIL TIMELINE (PERSIS GAMBAR 2 DENGAN HEADER KUNING) ── */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-amber-400 text-slate-950 font-bold border-b border-amber-500">
                <th className="py-2.5 px-3 text-center w-10">#</th>
                <th className="py-2.5 px-3 text-center w-16">Urutan</th>
                <th className="py-2.5 px-3">Nama Timeline</th>
                <th className="py-2.5 px-3">Periode (Hari)</th>
                <th className="py-2.5 px-3">Tanggal Mulai</th>
                <th className="py-2.5 px-3">Tanggal Selesai</th>
                <th className="py-2.5 px-3 text-center">Durasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {item.milestones.map((m) => (
                <tr key={m.urutan} className="hover:bg-slate-50/80">
                  <td className="py-2 px-3 text-center font-mono text-slate-500">{m.urutan}</td>
                  <td className="py-2 px-3 text-center">
                    <span className="px-2 py-0.5 bg-slate-800 text-white rounded font-mono font-bold text-[10px]">
                      {m.urutan}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-800">{m.namaTimeline}</td>
                  <td className="py-2 px-3 font-mono text-slate-600">{m.periodeHari}</td>
                  <td className="py-2 px-3">
                    <span className="px-2.5 py-0.5 bg-emerald-600 text-white rounded font-mono font-bold text-[10.5px]">
                      {m.tanggalMulai}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <span className="px-2.5 py-0.5 bg-rose-600 text-white rounded font-mono font-bold text-[10.5px]">
                      {m.tanggalSelesai}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className="px-2.5 py-0.5 bg-blue-600 text-white rounded font-bold text-[10.5px]">
                      {m.durationDays} hari
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold border-t border-slate-200">
                <td colSpan={6} className="py-2.5 px-3 text-right text-slate-700">Total Hari Kerja:</td>
                <td className="py-2.5 px-3 text-center">
                  <span className="px-3 py-1 bg-blue-600 text-white rounded font-bold text-xs">
                    {item.totalHariKerja} hari
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // MAIN VIEW: TABLE CHECKLIST TRACKING WITH DROPDOWN EXPAND
  // ════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 pb-20 text-slate-900 bg-[#F8FAFC] min-h-screen">
      {/* ── 01. UNBOXED PAGE HEADER (DNA SPEC) ── */}
      <DnaPageHeader
        title="CHECKLIST TRACKING PROJEK SLA"
        badge={<DnaBadge status="info">SLA MONITORING</DnaBadge>}
        subtitle="Tracking timeline tahapan SO maklon, inspeksi deadline terpisah per PIC dan estimasi penyelesaian, serta visualisasi Gantt chart."
        breadcrumbItems={[
          { label: "Dashboard", href: "/executive/dashboard" },
          { label: "Umum & Kendali", href: "/project-control/checklist-tracking" },
          { label: "Checklist Tracking" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <DnaExportButton
              onExport={(type: string) => {
                showToast({
                  type: "success",
                  title: `Ekspor ${type.toUpperCase()} Berhasil`,
                  message: `Data ${filteredProjects.length} tracking projek berhasil diunduh.`,
                });
              }}
            />
          </div>
        }
      />

      {/* ── 02. 4-KPI STAT CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DnaStatCard
          label="Total Projek Maklon"
          value={projects.length}
          subtext="Seluruh SO maklon terdaftar"
          variant="default"
        />
        <DnaStatCard
          label="Projek On Track"
          value={projects.filter((p) => p.status === "ON_TRACK").length}
          subtext="Sesuai jadwal SLA tahapan"
          variant="success"
        />
        <DnaStatCard
          label="Menunggu Approval"
          value={projects.filter((p) => p.status === "PENDING_APPROVAL").length}
          subtext="Tertahan persetujuan desain/klien"
          variant="warning"
        />
        <DnaStatCard
          label="Tertunda / Overdue"
          value={projects.filter((p) => p.status === "OVERDUE").length}
          subtext="Melewati batas deadline per PIC"
          variant="danger"
        />
      </div>

      {/* ── 03. FILTER BAR WITH PIC SELECTOR ── */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        {/* Tab Filters */}
        <div className="inline-flex p-1 bg-slate-100 border border-slate-200 rounded-xl">
          {[
            { key: "ALL", label: `Semua (${projects.length})` },
            { key: "ON_TRACK", label: `On Track (${projects.filter((p) => p.status === "ON_TRACK").length})` },
            { key: "PENDING_APPROVAL", label: `Menunggu Approval (${projects.filter((p) => p.status === "PENDING_APPROVAL").length})` },
            { key: "OVERDUE", label: `Tertunda (${projects.filter((p) => p.status === "OVERDUE").length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setTabFilter(tab.key as any);
                setPage(1);
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                tabFilter === tab.key
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* PIC Filter Dropdown + Reset */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs shadow-2xs">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Filter PIC:</span>
            <select
              value={picFilter}
              onChange={(e) => {
                setPicFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-slate-800 font-semibold focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Semua PIC</option>
              {picOptions.map((pic) => (
                <option key={pic} value={pic}>
                  {pic}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setTabFilter("ALL");
              setPicFilter("ALL");
              setSearchQuery("");
              setPage(1);
              showToast({ type: "info", title: "Filter Direset", message: "Menampilkan seluruh checklist tracking." });
            }}
            className="h-8 px-2.5 text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 bg-white flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ── 04. DATA TABLE WITH ACCORDION DROPDOWN KE BAWAH ── */}
      <DnaDataTableCard
        title="MATRIKS CHECKLIST TRACKING PROJEK"
        count={filteredProjects.length}
        badge={<DnaBadge status="neutral">TRACKING MATRIX</DnaBadge>}
        actions={
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari SO, klien, produk, botol/tube, PIC PO..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="h-8 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500/20 w-64 placeholder:text-slate-400 font-medium"
            />
          </div>
        }
      >
        <DnaTable>
          <DnaTableHead>
            <tr>
              <th className={cn(DNA_TABLE_CLASSES.th, "w-10 text-center")}>#</th>
              <th className={DNA_TABLE_CLASSES.th}>No. Sales & Klien</th>
              <th className={DNA_TABLE_CLASSES.th}>Brand / Produk</th>
              <th className={DNA_TABLE_CLASSES.th}>Kemasan</th>
              <th className={DNA_TABLE_CLASSES.th}>BusDev & SCM PO</th>
              <th className={DNA_TABLE_CLASSES.th}>Deadline SO</th>
              <th className={cn(DNA_TABLE_CLASSES.th, "text-center")}>Status Projek</th>
              <th className={cn(DNA_TABLE_CLASSES.th, "text-center w-36")}>Aksi</th>
            </tr>
          </DnaTableHead>
          <tbody className={DNA_TABLE_CLASSES.tbody}>
            {paginatedProjects.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Tidak ada projek ditemukan</p>
                  <p className="text-xs text-slate-400">Silakan sesuaikan kata kunci pencarian atau filter PIC.</p>
                </td>
              </tr>
            ) : (
              paginatedProjects.map((item, idx) => {
                const isExpanded = expandedRowIds.includes(item.id);

                return (
                  <React.Fragment key={item.id}>
                    {/* Main Row */}
                    <tr className={cn(DNA_TABLE_CLASSES.tr, isExpanded && "bg-blue-50/40")}>
                      <td className={cn(DNA_TABLE_CLASSES.td, "text-center font-mono text-slate-400 text-xs")}>
                        {(page - 1) * pageSize + idx + 1}
                      </td>

                      {/* Sales Code & Klien */}
                      <td className={DNA_TABLE_CLASSES.td}>
                        <div>
                          <DnaCell.Code value={item.salesCode} />
                          <p className="text-xs font-semibold text-slate-800 mt-0.5">{item.customer}</p>
                        </div>
                      </td>

                      {/* Brand & Produk */}
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

                      {/* Kemasan */}
                      <td className={DNA_TABLE_CLASSES.td}>
                        <div className="flex items-center gap-1.5 text-xs">
                          <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-700">{item.packagingType}</span>
                        </div>
                      </td>

                      {/* BusDev & PO */}
                      <td className={DNA_TABLE_CLASSES.td}>
                        <div className="text-xs">
                          <p className="font-semibold text-slate-800">{item.busdev}</p>
                          <p className="text-[11px] text-slate-500">PO: {item.picPo}</p>
                        </div>
                      </td>

                      {/* Deadline SO */}
                      <td className={DNA_TABLE_CLASSES.td}>
                        <div className="text-xs">
                          <p className="font-bold text-slate-800">{item.tanggalSelesai}</p>
                          <p className="text-[10.5px] text-slate-400 font-mono">Mulai: {item.tanggalMulai}</p>
                        </div>
                      </td>

                      {/* Status Projek */}
                      <td className={cn(DNA_TABLE_CLASSES.td, "text-center")}>
                        <DnaBadge
                          status={
                            item.status === "ON_TRACK" || item.status === "COMPLETED"
                              ? "SUCCESS"
                              : item.status === "PENDING_APPROVAL"
                              ? "WARNING"
                              : "DANGER"
                          }
                        >
                          {item.status.replace("_", " ")}
                        </DnaBadge>
                      </td>

                      {/* 2 AKSI: DETAIL (DROPDOWN KE BAWAH) & TIMELINE (BUKA GAMBAR 2) */}
                      <td className={cn(DNA_TABLE_CLASSES.td, "text-center")}>
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Aksi 1: Detail ke bawah */}
                          <button
                            type="button"
                            onClick={() => toggleRowExpansion(item.id)}
                            className={cn(
                              "px-2 py-1 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer border shadow-2xs",
                              isExpanded
                                ? "bg-slate-800 text-white border-slate-900"
                                : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
                            )}
                            title="Rincian sub-milestone ke bawah"
                          >
                            <span>Detail</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>

                          {/* Aksi 2: Timeline (Membuka Tampilan Gambar 2) */}
                          <button
                            type="button"
                            onClick={() => setViewingTimelineItem(item)}
                            className="px-2 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="Buka Visualisasi Timeline (Gantt)"
                          >
                            <span>Timeline</span>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* ── EXPANDED DROPDOWN ACCORDION KE BAWAH (SESUAI REQUIREMENT.MD) ── */}
                    {isExpanded && (
                      <tr className="bg-slate-50/90 border-b border-blue-200">
                        <td colSpan={8} className="p-4 pl-12">
                          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-3">
                            <div className="bg-slate-100/90 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-800">
                                  Rincian Sub-Milestone: {item.salesCode} ({item.brand})
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  — Deadline Terpisah per PIC & Estimasi Penyelesaian
                                </span>
                              </div>
                              <span className="text-xs font-bold text-blue-700 font-mono">
                                Total {item.milestones.length} Tahapan
                              </span>
                            </div>

                            <div className="overflow-x-auto px-4 pb-4">
                              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                                  <tr>
                                    <th className="py-2 px-3 text-center w-10">#</th>
                                    <th className="py-2 px-3">Milestone / Kategori</th>
                                    <th className="py-2 px-3">PIC Penanggung Jawab</th>
                                    <th className="py-2 px-3 font-mono">Deadline SO</th>
                                    <th className="py-2 px-3 font-mono text-blue-700">Deadline per PIC</th>
                                    <th className="py-2 px-3 font-mono text-emerald-700">Estimasi Selesai</th>
                                    <th className="py-2 px-3 text-center">Status</th>
                                    <th className="py-2 px-3">Catatan / Kendala</th>
                                    <th className="py-2 px-3 text-center">Aksi Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {item.milestones.map((m) => (
                                    <tr key={m.urutan} className="hover:bg-slate-50/80">
                                      <td className="py-2 px-3 text-center font-mono text-slate-400">
                                        {m.urutan}
                                      </td>
                                      <td className="py-2 px-3 font-semibold text-slate-800">
                                        {m.namaTimeline}
                                      </td>
                                      <td className="py-2 px-3 font-medium text-slate-700">
                                        {m.pic}
                                      </td>
                                      <td className="py-2 px-3 font-mono text-slate-600">
                                        {item.tanggalSelesai}
                                      </td>
                                      <td className="py-2 px-3 font-mono font-bold text-blue-700">
                                        {m.tanggalSelesai}
                                      </td>
                                      <td className="py-2 px-3 font-mono font-bold text-emerald-700">
                                        {m.estimasiDeadline || m.tanggalSelesai}
                                      </td>
                                      <td className="py-2 px-3 text-center">
                                        <span
                                          className={cn(
                                            "px-2 py-0.5 rounded text-[10px] font-bold shadow-2xs",
                                            m.status === "Done"
                                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                              : m.status === "In Progress"
                                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                                              : m.status === "Overdue"
                                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                                              : "bg-slate-100 text-slate-600 border border-slate-200"
                                          )}
                                        >
                                          {m.status}
                                        </span>
                                      </td>
                                      <td className="py-2 px-3 text-[11px] text-slate-500 max-w-xs">
                                        {m.notes || "—"}
                                      </td>
                                      <td className="py-2 px-3 text-center">
                                        <button
                                          type="button"
                                          onClick={() => handleToggleMilestone(item.id, m.urutan)}
                                          className={cn(
                                            "px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer",
                                            m.status === "Done"
                                              ? "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300"
                                              : "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-700"
                                          )}
                                        >
                                          {m.status === "Done" ? "Batal Done" : "Set Done ✓"}
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </DnaTable>

        {/* ── PAGINATION BAR ── */}
        <DnaPagination
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredProjects.length}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
        />
      </DnaDataTableCard>
    </div>
  );
}
