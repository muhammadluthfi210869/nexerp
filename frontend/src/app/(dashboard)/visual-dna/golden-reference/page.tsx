"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { QueryLoading, QueryError } from "@/components/query-states";
import {
  FileText,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Edit3,
  Trash2,
  X,
  Building2,
  Boxes,
  ShieldAlert,
  Info,
  ChevronDown,
  Clock,
  Activity,
} from "lucide-react";
import { cn, formatRupiah } from "@/lib/utils";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  type DnaDateMode,
  DnaCell,
  DnaCheckbox,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";

// ── Types & Interfaces (bentuk yang dirender tabel Visual DNA) ──
// Semua field di bawah dipetakan dari GET /production/work-orders.
// Field yang TIDAK disediakan backend tidak dikarang: ditandai "—".
export interface WorkOrder {
  id: string;
  wo: string;              // woNumber (backend)
  refPo: string;           // backend belum menyimpan nomor PO di WorkOrder
  produk: string;          // lead.productInterest / brandName
  klien: string;           // lead.clientName
  brand: string;           // lead.brandName
  stage: string;           // LifecycleStatus asli (ditampilkan title-case)
  progressPercent: number; // diturunkan dari urutan LifecycleStatus (lihat STAGE_ORDER)
  progressColor: string;
  target: number;          // targetQty
  hpp: number;             // targetHpp
  totalNilai: number;      // targetQty * targetHpp
  targetDate: string;      // targetCompletion (dd/mm/yyyy)
  materialSummary: string; // ringkasan requisitions[].material.name
  notes: string;           // logs[0].notes
}

interface ApiWorkOrder {
  id: string;
  woNumber: string;
  targetQty: number;
  stage: string;
  targetCompletion: string;
  targetHpp: string | number | null;
  lead?: { clientName?: string; brandName?: string; productInterest?: string } | null;
  requisitions?: { material?: { name?: string } | null }[];
  logs?: { notes?: string | null; loggedAt?: string }[];
}

interface ApiLead {
  id: string;
  clientName: string;
  brandName: string;
  productInterest: string;
}

// Urutan siklus hidup produksi (backend/prisma/schema/enums.prisma).
// Dipakai untuk menurunkan bar progres dari stage NYATA, bukan angka karangan.
const STAGE_ORDER: string[] = [
  'PLANNING', 'WAITING_MATERIAL', 'WAITING_PROCUREMENT', 'READY_TO_PRODUCE',
  'MIXING', 'FILLING', 'PACKING', 'PENDING_QC', 'QC_HOLD', 'REWORK',
  'FINISHED_GOODS', 'DONE', 'DELIVERED', 'CLOSED',
];

const STAGE_DONE = new Set(['FINISHED_GOODS', 'DONE', 'DELIVERED', 'CLOSED']);
const STAGE_WAITING = new Set(['PLANNING', 'WAITING_MATERIAL', 'WAITING_PROCUREMENT']);

function stageProgress(stage: string): number {
  if (stage === 'CANCELLED') return 0;
  const idx = STAGE_ORDER.indexOf(stage);
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / STAGE_ORDER.length) * 100);
}

function stageProgressColor(stage: string): string {
  if (STAGE_DONE.has(stage)) return 'bg-emerald-500';
  if (STAGE_WAITING.has(stage)) return 'bg-amber-500';
  if (stage === 'CANCELLED') return 'bg-rose-500';
  return 'bg-sky-500';
}

function formatDay(value?: string): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Adapter backend → bentuk tabel. Field yang tidak ada di payload jadi "—". */
export function toWorkOrder(item: ApiWorkOrder): WorkOrder {
  const hpp = Number(item.targetHpp ?? 0);
  const target = Number(item.targetQty ?? 0);
  const materials = (item.requisitions ?? [])
    .map((r) => r?.material?.name)
    .filter((n): n is string => Boolean(n));
  return {
    id: item.id,
    wo: item.woNumber ?? '—',
    refPo: '—',
    produk: item.lead?.productInterest || item.lead?.brandName || '—',
    klien: item.lead?.clientName || '—',
    brand: item.lead?.brandName || '—',
    stage: item.stage ?? '—',
    progressPercent: stageProgress(item.stage),
    progressColor: stageProgressColor(item.stage),
    target,
    hpp,
    totalNilai: target * hpp,
    targetDate: formatDay(item.targetCompletion),
    materialSummary: materials.length > 0 ? `${materials.length} material · ${materials.slice(0, 2).join(', ')}${materials.length > 2 ? '…' : ''}` : '—',
    notes: item.logs?.[0]?.notes || '—',
  };
}

type FilterColumnType = "stage" | "klien" | "produk" | "target" | "totalNilai" | "targetDate";
type FloatingWindowSize = "sm" | "md" | "lg" | "xl";

export type TableColumnCount = 6 | 7 | 8 | 9 | 10 | 11;

export const COLUMN_CONFIGS: Record<TableColumnCount, {
  label: string;
  badge: string;
  badgeColor: string;
  scrollStatus: "NONE" | "BORDERLINE" | "REQUIRED";
  description: string;
  breakdown: string;
}> = {
  6: {
    label: "6 Kolom",
    badge: "Strict 1 Kolom 1 Data (Paling Bersih & Lega)",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    scrollStatus: "NONE",
    description: "Karena jumlah kolom hanya 6, ruang horizontal sangat berlimpah! Tidak ada alasan untuk menumpuk 2 data di sel manapun. Seluruh sel adalah 1 data murni, tinggi baris ramping, dan visual sangat lapang.",
    breakdown: "1. WO # | 2. Produk | 3. Status | 4. Progress | 5. Total Nilai | 6. Aksi (100% Murni 1 Data)",
  },
  7: {
    label: "7 Kolom",
    badge: "Strict 1 Kolom 1 Data (+ Kolom Klien Mandiri)",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    scrollStatus: "NONE",
    description: "Menambahkan kolom Klien secara independen tanpa digabung ke Produk. Seluruh kolom tetap 1 data murni (zero stacking), baris seragam ramping, dan 100% pas di layar laptop.",
    breakdown: "1. WO # | 2. Produk | 3. Klien | 4. Status | 5. Progress | 6. Total Nilai | 7. Aksi (100% Murni 1 Data)",
  },
  8: {
    label: "8 Kolom",
    badge: "Mulai Butuh 1 Kolom 2 Data (Penyelamat Ramping)",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    scrollStatus: "NONE",
    description: "Ketika atribut bertambah menjadi 8 kolom, tabel mulai terasa penuh jika semua dipisah. Menyatukan Produk & Klien menjadi 1 kolom 2 data bertindak sebagai 'penyelamat' agar tabel tetap ramping dan muat 1 layar laptop.",
    breakdown: "1. WO # | 2. Produk & Klien (2 Data) | 3. Status | 4. Progress | 5. PIC | 6. Target | 7. Total Nilai | 8. Aksi",
  },
  9: {
    label: "9 Kolom",
    badge: "2 Kolom 2 Data (Kompak Menampung 11 Atribut)",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    scrollStatus: "NONE",
    description: "Menampung 11 atribut data operasional dengan memadatkan 2 pasangan alami (WO+Ref PO dan Produk+Klien). Hasilnya tabel 9 kolom ini tetap muat di layar 1080p tanpa scrollbar samping.",
    breakdown: "1. Dokumen & PO (2 Data) | 2. Produk & Klien (2 Data) | 3. Status | 4. Progress | 5. PIC | 6. Target | 7. Total Nilai | 8. Lini | 9. Aksi",
  },
  10: {
    label: "10 Kolom",
    badge: "2 Kolom 2 Data (Kompak & Ramping Seragam)",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    scrollStatus: "BORDERLINE",
    description: "Tinggi baris tetap seragam dan ramping (~48px) persis seperti pada 8 & 9 kolom. Hanya 2 pasang data alami yang disatukan (Dokumen & PO, Produk & Klien), sedangkan PIC, Lini Kerja, Target, HPP, dan Nilai memiliki kolom tersendiri dengan lebar terproteksi sehingga tidak ada teks yang tercekik atau terputus.",
    breakdown: "1. Dokumen & PO (2 Data) | 2. Produk & Klien (2 Data) | 3. Status | 4. Progress | 5. PIC | 6. Lini Kerja | 7. Target | 8. HPP Satuan | 9. Total Nilai | 10. Aksi",
  },
  11: {
    label: "11 Kolom",
    badge: "2 Kolom 2 Data + # Urut (Standar Tabel Terlebar ERP)",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    scrollStatus: "BORDERLINE",
    description: "Representasi tabel kapasitas tertinggi di ERP (seperti SPB Material Requisition, Karantina QC, Laporan Mutasi Stok). Tetap ramping, proporsional, dan teratur dengan nomor urut, lebar kolom terproteksi, serta scroll horizontal mulus tanpa baris yang membengkak.",
    breakdown: "1. # | 2. Dokumen & PO (2 Data) | 3. Produk & Klien (2 Data) | 4. Status | 5. Progress | 6. PIC | 7. Lini Kerja | 8. Target | 9. HPP Satuan | 10. Total Nilai | 11. Aksi",
  },
};

export default function GoldenReferencePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"WORK_ORDERS" | "ANALYTICS">("WORK_ORDERS");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKpiFilter, setSelectedKpiFilter] = useState<string | null>(null);
  const [selectedFilterColumn, setSelectedFilterColumn] = useState<FilterColumnType>("stage");
  const [filterColumnValue, setFilterColumnValue] = useState<string>("ALL");
  const [dateMode, setDateMode] = useState<DnaDateMode>("1_MONTH");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  // ── SUMBER DATA NYATA ──
  const workOrdersQuery = useQuery<WorkOrder[]>({
    queryKey: ["production-work-orders"],
    queryFn: async () => {
      const res = await api.get("/production/work-orders");
      const raw: any[] = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      return raw.map(toWorkOrder);
    },
    staleTime: 30_000,
  });

  const leadsQuery = useQuery<ApiLead[]>({
    queryKey: ["production-leads"],
    queryFn: async () => {
      const res = await api.get("/production/leads");
      return Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
    },
    staleTime: 60_000,
  });

  const workOrders = workOrdersQuery.data ?? [];

  // ── TABLE COLUMN DENSITY VISUALIZER LAB (6, 7, 8, 9, 10, 11 KOLOM) ──
  const [activeColumnCount, setActiveColumnCount] = useState<TableColumnCount>(8);

  // ── FLOATING DETAIL INSPECTION WINDOW STATE ──
  const [inspectingWo, setInspectingWo] = useState<WorkOrder | null>(null);

  // ── FLOATING INPUT (CREATE) WINDOW SIZING & STATE ──
  const [modalSize, setModalSize] = useState<FloatingWindowSize>("lg");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form buat WO — hanya field yang benar-benar diterima POST /production/work-orders.
  const [newLeadId, setNewLeadId] = useState<string>("");
  const [newTarget, setNewTarget] = useState<number>(1000);
  const [newTargetDate, setNewTargetDate] = useState<string>("");
  const [newNotes, setNewNotes] = useState("Work order baru didaftarkan.");
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");

  const leadOptions = leadsQuery.data ?? [];
  const selectedLead = leadOptions.find((l) => l.id === newLeadId) ?? null;

  const [editingWo, setEditingWo] = useState<WorkOrder | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    consequences?: string[];
    variant: "danger" | "warning" | "info";
    confirmLabel: string;
    cancelLabel?: string;
    requiresReason?: boolean;
    reasonPlaceholder?: string;
    onConfirm: (reason?: string) => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    variant: "danger",
    confirmLabel: "Konfirmasi",
    onConfirm: () => {},
  });
  const [confirmReason, setConfirmReason] = useState("");
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "info" | "warning" } | null>(null);

  const showToast = (text: string, type: "success" | "info" | "warning" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (confirmDialog.isOpen) setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        else if (isCreateModalOpen) setIsCreateModalOpen(false);
        else if (editingWo) setEditingWo(null);
        else if (inspectingWo) setInspectingWo(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [confirmDialog.isOpen, isCreateModalOpen, editingWo, inspectingWo]);

  const uniqueClients = useMemo(() => Array.from(new Set(workOrders.map((item) => item.klien))).filter((c) => c !== "—"), [workOrders]);
  const uniqueStages = useMemo(() => Array.from(new Set(workOrders.map((item) => item.stage))).filter((s) => s !== "—"), [workOrders]);

  const filteredClientOptions = useMemo(() => {
    if (!clientSearchQuery.trim()) return leadOptions;
    const q = clientSearchQuery.toLowerCase();
    return leadOptions.filter((c) => c.clientName.toLowerCase().includes(q) || c.brandName.toLowerCase().includes(q) || c.productInterest.toLowerCase().includes(q));
  }, [clientSearchQuery, leadOptions]);

  const parseItemDate = (dateStr: string): Date | null => {
    try {
      const dmy = dateStr.split(" ")[0].split("/");
      if (dmy.length === 3) return new Date(Number(dmy[2]), Number(dmy[1]) - 1, Number(dmy[0]));
    } catch { return null; }
    return null;
  };

  const filteredAndSortedData = useMemo(() => {
    return workOrders
      .filter((item) => {
        if (selectedKpiFilter === "OMSET" && !STAGE_DONE.has(item.stage)) return false;
        if (selectedKpiFilter === "APPROVED" && !STAGE_DONE.has(item.stage)) return false;
        if (selectedKpiFilter === "PENDING" && !STAGE_WAITING.has(item.stage)) return false;
        if (selectedKpiFilter === "EFFICIENCY" && item.progressPercent < 50) return false;

        if (searchQuery.trim() !== "") {
          const q = searchQuery.toLowerCase();
          if (!item.wo.toLowerCase().includes(q) && !item.produk.toLowerCase().includes(q) && !item.klien.toLowerCase().includes(q) && !item.brand.toLowerCase().includes(q)) return false;
        }

        if (filterColumnValue !== "ALL") {
          if (selectedFilterColumn === "stage" && item.stage !== filterColumnValue) return false;
          if (selectedFilterColumn === "klien" && item.klien !== filterColumnValue) return false;
        }

        if (dateMode !== "ALL") {
          // Filter tanggal memakai target completion NYATA, dan "sekarang"
          // sebagai jangkar — bukan tanggal yang dipatok di kode.
          const itemDate = parseItemDate(item.targetDate);
          if (itemDate) {
            if (dateMode === "CUSTOM" && startDate && endDate) {
              const start = new Date(startDate);
              const end = new Date(endDate);
              end.setHours(23, 59, 59, 999);
              if (itemDate < start || itemDate > end) return false;
            } else {
              const diffDays = Math.abs(itemDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
              if (dateMode === "1_DAY" && diffDays > 1) return false;
              if (dateMode === "1_WEEK" && diffDays > 7) return false;
              if (dateMode === "1_MONTH" && diffDays > 30) return false;
              if (dateMode === "1_YEAR" && diffDays > 365) return false;
            }
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (selectedFilterColumn === "produk") {
          if (filterColumnValue === "ASC") return a.produk.localeCompare(b.produk);
          if (filterColumnValue === "DESC") return b.produk.localeCompare(a.produk);
        }
        if (selectedFilterColumn === "target") {
          if (filterColumnValue === "NUM_DESC") return b.target - a.target;
          if (filterColumnValue === "NUM_ASC") return a.target - b.target;
        }
        if (selectedFilterColumn === "totalNilai") {
          if (filterColumnValue === "NUM_DESC") return b.totalNilai - a.totalNilai;
          if (filterColumnValue === "NUM_ASC") return a.totalNilai - b.totalNilai;
        }
        if (!sortColumn) return 0;
        const dir = sortDirection === "asc" ? 1 : -1;
        switch (sortColumn) {
          case "wo": return dir * a.wo.localeCompare(b.wo);
          case "produk": return dir * a.produk.localeCompare(b.produk);
          case "klien": return dir * a.klien.localeCompare(b.klien);
          case "stage": return dir * a.stage.localeCompare(b.stage);
          case "target": return dir * (a.target - b.target);
          case "totalNilai": return dir * (a.totalNilai - b.totalNilai);
          case "targetDate": return dir * a.targetDate.localeCompare(b.targetDate);
          default: return 0;
        }
      });
  }, [workOrders, selectedKpiFilter, searchQuery, selectedFilterColumn, filterColumnValue, dateMode, startDate, endDate, sortColumn, sortDirection]);

  const handleHeaderSortToggle = (colKey: string) => {
    if (sortColumn === colKey) {
      if (sortDirection === "asc") setSortDirection("desc");
      else { setSortColumn(null); setSortDirection("asc"); }
    } else { setSortColumn(colKey); setSortDirection("asc"); }
  };

  const toggleSelectAll = () => {
    if (selectedRowIds.length === filteredAndSortedData.length) setSelectedRowIds([]);
    else setSelectedRowIds(filteredAndSortedData.map((item) => item.id));
  };

  const toggleSelectRow = (id: string) => {
    setSelectedRowIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  };

  // Backend TIDAK punya DELETE /production/work-orders/:id — jadi penghapusan
// ditampilkan sebagai jalur yang tidak didukung, bukan dihapus dari state lokal.
  const requestDeleteWo = (woItem: WorkOrder) => {
    setConfirmReason("");
    setConfirmDialog({
      isOpen: true,
      variant: "warning",
      title: `Hapus Work Order ${woItem.wo}?`,
      description: `Backend belum menyediakan endpoint hapus Work Order (tidak ada DELETE /production/work-orders/:id). Data tidak akan berubah di server.`,
      consequences: [
        "Tidak ada request yang dikirim ke server.",
        "Untuk membatalkan produksi, ubah stage lewat alur produksi, bukan hapus dokumen.",
      ],
      confirmLabel: "Mengerti",
      cancelLabel: "Tutup",
      onConfirm: () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleOpenEditModal = (wo: WorkOrder) => {
    setEditingWo({ ...wo });
  };

  // Backend TIDAK punya PATCH /production/work-orders/:id — perubahan tidak
  // dikirim ke server dan state lokal tidak dipalsukan.
  const handleSaveEditedWo = () => {
    if (!editingWo) return;
    setConfirmDialog({
      isOpen: true,
      variant: "warning",
      title: "Ubah Work Order tidak didukung backend",
      description: "Backend belum menyediakan endpoint perubahan Work Order (tidak ada PATCH /production/work-orders/:id). Perubahan tidak dapat disimpan.",
      consequences: ["Tidak ada request yang dikirim ke server.", "Perubahan pada form akan dibuang saat modal ditutup."],
      confirmLabel: "Mengerti",
      cancelLabel: "Tutup",
      onConfirm: () => setConfirmDialog((prev) => ({ ...prev, isOpen: false })),
    });
  };

  const createWorkOrder = useMutation({
    mutationFn: async () => {
      const res = await api.post("/production/work-orders", {
        leadId: newLeadId,
        targetQty: newTarget,
        targetCompletion: newTargetDate,
        notes: newNotes || undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-work-orders"] });
      setIsCreateModalOpen(false);
      showToast("Work Order baru diterbitkan di server.", "success");
    },
    onError: () => showToast("Gagal membuat Work Order di server.", "warning"),
  });

  const canCreate = Boolean(newLeadId) && newTarget > 0 && Boolean(newTargetDate) && !createWorkOrder.isPending;

  const handleCreateNewWo = () => {
    if (!canCreate) return;
    // stage ditetapkan backend ke WAITING_MATERIAL; nomor WO digenerate backend.
    createWorkOrder.mutate();
  };

  // Ringkasan KPI dari Work Order NYATA (bukan angka statis).
  const totalOmset = workOrders.reduce((sum, item) => sum + item.totalNilai, 0);
  const doneCount = workOrders.filter((item) => STAGE_DONE.has(item.stage)).length;
  const waitingCount = workOrders.filter((item) => STAGE_WAITING.has(item.stage)).length;
  const avgProgress = workOrders.length > 0
    ? Math.round(workOrders.reduce((sum, item) => sum + item.progressPercent, 0) / workOrders.length)
    : 0;

  return (
    <div className="space-y-6 pb-20 text-slate-900 bg-[#F8FAFC] min-h-screen">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[100] animate-in slide-in-from-top-3 fade-in duration-200">
          <div className={cn("flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-[13px] font-medium backdrop-blur-md", toastMessage.type === "success" && "bg-emerald-50/95 border-emerald-200 text-emerald-800", toastMessage.type === "info" && "bg-blue-50/95 border-blue-200 text-blue-800", toastMessage.type === "warning" && "bg-amber-50/95 border-amber-200 text-amber-800")}>
            {toastMessage.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {toastMessage.type === "info" && <Info className="w-4 h-4 text-blue-600 shrink-0" />}
            {toastMessage.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      <DnaPageHeader
        backLink={{ href: "/dna-visual", label: "Kembali ke Visual DNA Specs" }}
        title="WORK ORDERS & PRODUCTION"
        tabs={[
          { key: "WORK_ORDERS", label: "Work Orders", count: workOrders.length, icon: <FileText className="w-3.5 h-3.5" /> },
          { key: "ANALYTICS", label: "Analytics", icon: <BarChart3 className="w-3.5 h-3.5" /> },
        ]}
        activeTab={activeTab}
        onTabChange={(k) => setActiveTab(k as "WORK_ORDERS" | "ANALYTICS")}
      />

      <DnaKpiGrid
        cards={[
          { key: "OMSET", title: "TOTAL NILAI WO", value: workOrdersQuery.isLoading ? "…" : formatRupiah(totalOmset), subtext: "target qty × HPP satuan", isDeltaPositive: true, icon: "$", iconBg: "bg-blue-50", iconColor: "text-blue-600", isSelected: selectedKpiFilter === "OMSET", onClick: () => setSelectedKpiFilter(selectedKpiFilter === "OMSET" ? null : "OMSET") },
          { key: "APPROVED", title: "SELESAI / TERKIRIM", value: workOrdersQuery.isLoading ? "…" : `${doneCount} WO`, subtext: "stage FINISHED_GOODS ke atas", isDeltaPositive: true, icon: <CheckCircle2 className="w-4 h-4" />, iconBg: "bg-emerald-50", iconColor: "text-emerald-600", isSelected: selectedKpiFilter === "APPROVED", onClick: () => setSelectedKpiFilter(selectedKpiFilter === "APPROVED" ? null : "APPROVED") },
          { key: "PENDING", title: "MENUNGGU MATERIAL", value: workOrdersQuery.isLoading ? "…" : `${waitingCount} WO`, subtext: "stage PLANNING / WAITING_*", isDeltaPositive: false, icon: <AlertTriangle className="w-4 h-4" />, iconBg: "bg-amber-50", iconColor: "text-amber-600", isSelected: selectedKpiFilter === "PENDING", onClick: () => setSelectedKpiFilter(selectedKpiFilter === "PENDING" ? null : "PENDING") },
          { key: "EFFICIENCY", title: "RATA-RATA PROGRES", value: workOrdersQuery.isLoading ? "…" : `${avgProgress}%`, subtext: "dari urutan stage aktual", isDeltaPositive: true, icon: <Sparkles className="w-4 h-4" />, iconBg: "bg-sky-50", iconColor: "text-sky-600", isSelected: selectedKpiFilter === "EFFICIENCY", onClick: () => setSelectedKpiFilter(selectedKpiFilter === "EFFICIENCY" ? null : "EFFICIENCY") },
        ]}
      />

      {/* ── VISUAL DNA INTERACTIVE COLUMN DENSITY LAB (6 TO 11 COLUMNS) ── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                Visual DNA Column Density Lab
              </span>
              <span
                className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                  activeColumnCount === 8
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : activeColumnCount <= 7
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : activeColumnCount === 9
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                    : "bg-purple-50 text-purple-700 border-purple-200"
                )}
              >
                {activeColumnCount} Kolom Aktif
              </span>
            </div>
            <h3 className="text-[15px] font-black text-slate-900 mt-0.5">
              Simulasi Lebar Tabel: 6, 7, 8, 9, 10, &amp; 11 Kolom
            </h3>
          </div>

          {/* 6-Way Segmented Column Switcher */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/70 self-start md:self-auto shrink-0 flex-wrap gap-1">
            {([6, 7, 8, 9, 10, 11] as TableColumnCount[]).map((count) => {
              const isSelected = activeColumnCount === count;
              return (
                <button
                  key={count}
                  onClick={() => setActiveColumnCount(count)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all cursor-pointer",
                    isSelected
                      ? "bg-white text-blue-700 shadow-xs border border-blue-200"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  )}
                >
                  <span>{count} Kolom</span>
                  {count === 6 && (
                    <span className="text-[9.5px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60">
                      1 Data Murni
                    </span>
                  )}
                  {count === 7 && (
                    <span className="text-[9.5px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60">
                      1 Data Murni
                    </span>
                  )}
                  {count === 8 && (
                    <span className="text-[9.5px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200/60">
                      1 Kolom 2 Data
                    </span>
                  )}
                  {count === 9 && (
                    <span className="text-[9.5px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200/60">
                      2 Kolom 2 Data
                    </span>
                  )}
                  {count === 10 && (
                    <span className="text-[9.5px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200/60">
                      2 Kolom 2 Data
                    </span>
                  )}
                  {count === 11 && (
                    <span className="text-[9.5px] font-semibold text-slate-700 bg-slate-200 px-1.5 py-0.2 rounded">
                      Max ERP (11 Kolom)
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Explainer Card for Active Column Count */}
        <div
          className={cn(
            "p-3.5 rounded-xl border text-[12px] leading-relaxed transition-all",
            activeColumnCount === 8
              ? "bg-blue-50/50 border-blue-200 text-slate-700"
              : activeColumnCount <= 7
              ? "bg-amber-50/40 border-amber-200 text-slate-700"
              : activeColumnCount === 9
              ? "bg-indigo-50/40 border-indigo-200 text-slate-700"
              : "bg-slate-50 border-slate-200 text-slate-700"
          )}
        >
          <div className="flex items-start gap-2.5">
            {activeColumnCount === 8 ? (
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            ) : activeColumnCount >= 10 ? (
              <Info className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <strong className="text-slate-900 font-semibold">
                  {COLUMN_CONFIGS[activeColumnCount].label}: {COLUMN_CONFIGS[activeColumnCount].badge}
                </strong>
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.2 rounded-full border",
                    COLUMN_CONFIGS[activeColumnCount].scrollStatus === "NONE"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : COLUMN_CONFIGS[activeColumnCount].scrollStatus === "BORDERLINE"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  )}
                >
                  {COLUMN_CONFIGS[activeColumnCount].scrollStatus === "NONE" && "✅ Zero Scroll (100% Fit di Layar Laptop)"}
                  {COLUMN_CONFIGS[activeColumnCount].scrollStatus === "BORDERLINE" && "⚠️ Borderline di Layar 1366px"}
                  {COLUMN_CONFIGS[activeColumnCount].scrollStatus === "REQUIRED" && "🔄 Wajib Horizontal Scrollbar"}
                </span>
              </div>
              <p className="text-slate-600">
                {COLUMN_CONFIGS[activeColumnCount].description}
              </p>
              <div className="pt-1 text-[11px] tabular-nums text-slate-500 bg-white/70 px-2.5 py-1 rounded-lg border border-slate-200/60 inline-block">
                Struktur Kolom: {COLUMN_CONFIGS[activeColumnCount].breakdown}
              </div>
            </div>
          </div>
        </div>
      </div>

      <DnaDataTableCard
        toolbarProps={{
          searchQuery,
          onSearchChange: setSearchQuery,
          searchPlaceholder: "Cari WO / Produk / Klien...",
          filterColumns: [
            { key: "stage", label: "Stage (Status)", type: "select", options: uniqueStages },
            { key: "klien", label: "Klien", type: "select", options: uniqueClients },
            { key: "produk", label: "Produk", type: "sort_alpha" },
            { key: "target", label: "Target (Pcs)", type: "sort_numeric" },
            { key: "totalNilai", label: "Nilai (Rp)", type: "sort_numeric" },
          ],
          selectedColumn: selectedFilterColumn,
          onSelectColumn: (col) => setSelectedFilterColumn(col as FilterColumnType),
          filterValue: filterColumnValue,
          onFilterValueChange: setFilterColumnValue,
          enableDateFilter: true,
          dateMode,
          onDateModeChange: setDateMode,
          startDate,
          onStartDateChange: setStartDate,
          endDate,
          onEndDateChange: setEndDate,
          actionButton: { label: "Tambah Work Order", onClick: () => setIsCreateModalOpen(true) },
        }}
        paginationProps={{ currentPage: 1, totalPages: 1, totalEntries: filteredAndSortedData.length, pageSize: 10, onPageChange: () => {} }}
      >
        {workOrdersQuery.isLoading ? (
          <QueryLoading message="Memuat Work Order..." />
        ) : workOrdersQuery.isError ? (
          <QueryError
            error={workOrdersQuery.error}
            onRetry={() => workOrdersQuery.refetch()}
            message="Gagal memuat Work Order dari server"
          />
        ) : filteredAndSortedData.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <FileText className="w-8 h-8 text-slate-300 mb-3" />
            <p className="text-[13px] font-bold text-slate-600">Belum ada Work Order</p>
            <p className="text-[11.5px] text-slate-400 mt-1">
              {workOrders.length === 0
                ? "Backend belum mengembalikan Work Order apa pun."
                : "Tidak ada Work Order yang cocok dengan filter aktif."}
            </p>
          </div>
        ) : activeColumnCount === 6 ? (
          /* ── 6 KOLOM: STRICT 1 KOLOM 1 DATA (ZERO STACKING / LEGA & BERSIH) ── */
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider">
                <DnaTh className="p-3.5 w-10 text-center"><DnaCheckbox checked={selectedRowIds.length === filteredAndSortedData.length && filteredAndSortedData.length > 0} onChange={toggleSelectAll} /></DnaTh>
                <DnaTh className="p-3.5 w-36 cursor-pointer hover:bg-slate-100/60" onClick={() => handleHeaderSortToggle("wo")}>WO #</DnaTh>
                <DnaTh className="p-3.5 cursor-pointer hover:bg-slate-100/60" onClick={() => handleHeaderSortToggle("produk")}>PRODUK</DnaTh>
                <DnaTh className="p-3.5 w-36 cursor-pointer hover:bg-slate-100/60" onClick={() => handleHeaderSortToggle("stage")}>STATUS</DnaTh>
                <DnaTh className="p-3.5 w-40">PROGRESS</DnaTh>
                <DnaTh className="p-3.5 w-44 text-right cursor-pointer hover:bg-slate-100/60" onClick={() => handleHeaderSortToggle("totalNilai")}>TOTAL NILAI</DnaTh>
                <DnaTh className="p-3.5 text-center w-24">AKSI</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {filteredAndSortedData.map((wo) => (
                <DnaTableRow key={wo.id} className="hover:bg-slate-50/80 transition-colors">
                  <DnaTd className="p-3.5 text-center"><DnaCheckbox checked={selectedRowIds.includes(wo.id)} onChange={() => toggleSelectRow(wo.id)} /></DnaTd>
                  <DnaTd className="p-3.5"><DnaCell.Code value={wo.wo} onClick={() => setInspectingWo(wo)} /></DnaTd>
                  <DnaTd className="p-3.5"><DnaCell.Text primary={wo.produk} /></DnaTd>
                  <DnaTd className="p-3.5"><DnaCell.Badge status={wo.stage} /></DnaTd>
                  <DnaTd className="p-3.5"><DnaCell.Progress value={wo.progressPercent} colorClass={wo.progressColor} /></DnaTd>
                  <DnaTd className="p-3.5 text-right"><DnaCell.Currency value={wo.totalNilai} /></DnaTd>
                  <DnaTd className="p-3.5 text-center">
                    <div className="flex gap-1 justify-center">
                      <button onClick={() => setInspectingWo(wo)} title="Inspeksi Detail" className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"><FileText className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleOpenEditModal(wo)} title="Edit Data" className="p-1.5 text-slate-400 hover:text-amber-600 rounded-md hover:bg-amber-50 transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => requestDeleteWo(wo)} title="Hapus Data" className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </DnaTd>
                </DnaTableRow>
              ))}
            </DnaTableBody>
          </DnaTable>
        ) : activeColumnCount === 7 ? (
          /* ── 7 KOLOM: STRICT 1 KOLOM 1 DATA (+ KOLOM KLIEN MANDIRI) ── */
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider">
                <DnaTh className="p-3.5 w-10 text-center"><DnaCheckbox checked={selectedRowIds.length === filteredAndSortedData.length && filteredAndSortedData.length > 0} onChange={toggleSelectAll} /></DnaTh>
                <DnaTh className="p-3.5 w-32 cursor-pointer hover:bg-slate-100/60" onClick={() => handleHeaderSortToggle("wo")}>WO #</DnaTh>
                <DnaTh className="p-3.5 cursor-pointer hover:bg-slate-100/60" onClick={() => handleHeaderSortToggle("produk")}>PRODUK</DnaTh>
                <DnaTh className="p-3.5 w-44 cursor-pointer hover:bg-slate-100/60" onClick={() => handleHeaderSortToggle("klien")}>KLIEN</DnaTh>
                <DnaTh className="p-3.5 w-36 cursor-pointer hover:bg-slate-100/60" onClick={() => handleHeaderSortToggle("stage")}>STATUS</DnaTh>
                <DnaTh className="p-3.5 w-36">PROGRESS</DnaTh>
                <DnaTh className="p-3.5 w-40 text-right cursor-pointer hover:bg-slate-100/60" onClick={() => handleHeaderSortToggle("totalNilai")}>TOTAL NILAI</DnaTh>
                <DnaTh className="p-3.5 text-center w-24">AKSI</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {filteredAndSortedData.map((wo) => (
                <DnaTableRow key={wo.id} className="hover:bg-slate-50/80 transition-colors">
                  <DnaTd className="p-3.5 text-center"><DnaCheckbox checked={selectedRowIds.includes(wo.id)} onChange={() => toggleSelectRow(wo.id)} /></DnaTd>
                  <DnaTd className="p-3.5"><DnaCell.Code value={wo.wo} onClick={() => setInspectingWo(wo)} /></DnaTd>
                  <DnaTd className="p-3.5"><DnaCell.Text primary={wo.produk} /></DnaTd>
                  <DnaTd className="p-3.5"><DnaCell.Text primary={wo.klien} /></DnaTd>
                  <DnaTd className="p-3.5"><DnaCell.Badge status={wo.stage} /></DnaTd>
                  <DnaTd className="p-3.5"><DnaCell.Progress value={wo.progressPercent} colorClass={wo.progressColor} /></DnaTd>
                  <DnaTd className="p-3.5 text-right"><DnaCell.Currency value={wo.totalNilai} /></DnaTd>
                  <DnaTd className="p-3.5 text-center">
                    <div className="flex gap-1 justify-center">
                      <button onClick={() => setInspectingWo(wo)} title="Inspeksi Detail" className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"><FileText className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleOpenEditModal(wo)} title="Edit Data" className="p-1.5 text-slate-400 hover:text-amber-600 rounded-md hover:bg-amber-50 transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => requestDeleteWo(wo)} title="Hapus Data" className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </DnaTd>
                </DnaTableRow>
              ))}
            </DnaTableBody>
          </DnaTable>
        ) : activeColumnCount === 8 ? (
          /* ── 8 KOLOM: CLEAN LINEAR (STANDAR EMAS ERP - 1 KOLOM 2 DATA PENYELAMAT) ── */
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider">
                <DnaTh className="p-3.5 w-10 text-center"><DnaCheckbox checked={selectedRowIds.length === filteredAndSortedData.length && filteredAndSortedData.length > 0} onChange={toggleSelectAll} /></DnaTh>
                <DnaTh className="p-3.5 w-32 cursor-pointer hover:bg-slate-100/60" onClick={() => handleHeaderSortToggle("wo")}>WO #</DnaTh>
                <DnaTh className="p-3.5 cursor-pointer hover:bg-slate-100/60" onClick={() => handleHeaderSortToggle("produk")}>PRODUK &amp; KLIEN</DnaTh>
                <DnaTh className="p-3.5 w-36 cursor-pointer hover:bg-slate-100/60" onClick={() => handleHeaderSortToggle("stage")}>STATUS</DnaTh>
                <DnaTh className="p-3.5 w-36">PROGRESS</DnaTh>
                <DnaTh className="p-3.5 w-40">MATERIAL</DnaTh>
                <DnaTh className="p-3.5 w-28 text-right cursor-pointer hover:bg-slate-100/60" onClick={() => handleHeaderSortToggle("target")}>TARGET</DnaTh>
                <DnaTh className="p-3.5 w-36 text-right cursor-pointer hover:bg-slate-100/60" onClick={() => handleHeaderSortToggle("totalNilai")}>TOTAL NILAI</DnaTh>
                <DnaTh className="p-3.5 text-center w-24">AKSI</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {filteredAndSortedData.map((wo) => (
                <DnaTableRow key={wo.id} className="hover:bg-slate-50/80 transition-colors">
                  <DnaTd className="p-3.5 text-center"><DnaCheckbox checked={selectedRowIds.includes(wo.id)} onChange={() => toggleSelectRow(wo.id)} /></DnaTd>
                  <DnaTd className="p-3.5"><DnaCell.Code value={wo.wo} onClick={() => setInspectingWo(wo)} /></DnaTd>
                  <DnaTd className="p-3.5"><DnaCell.Text primary={wo.produk} secondary={wo.klien} /></DnaTd>
                  <DnaTd className="p-3.5"><DnaCell.Badge status={wo.stage} /></DnaTd>
                  <DnaTd className="p-3.5"><DnaCell.Progress value={wo.progressPercent} colorClass={wo.progressColor} /></DnaTd>
                  <DnaTd className="p-3.5"><span className="text-[11.5px] text-slate-600 truncate max-w-[160px] inline-block font-medium">{wo.materialSummary}</span></DnaTd>
                  <DnaTd className="p-3.5 text-right">
                    <span className="tabular-nums text-slate-800 font-semibold tabular-nums">{wo.target.toLocaleString("id-ID")}</span>
                    <span className="text-[10.5px] text-slate-400 ml-1">Pcs</span>
                  </DnaTd>
                  <DnaTd className="p-3.5 text-right"><DnaCell.Currency value={wo.totalNilai} /></DnaTd>
                  <DnaTd className="p-3.5 text-center">
                    <div className="flex gap-1 justify-center">
                      <button onClick={() => setInspectingWo(wo)} title="Inspeksi Detail" className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"><FileText className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleOpenEditModal(wo)} title="Edit Data" className="p-1.5 text-slate-400 hover:text-amber-600 rounded-md hover:bg-amber-50 transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => requestDeleteWo(wo)} title="Hapus Data" className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </DnaTd>
                </DnaTableRow>
              ))}
            </DnaTableBody>
          </DnaTable>
        ) : activeColumnCount === 9 ? (
          /* ── 9 KOLOM: 2 KOLOM 2 DATA (MENAMPUNG 11 ATRIBUT SECARA EFISIEN) ── */
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider">
                <DnaTh className="p-3.5 w-10 text-center"><DnaCheckbox checked={selectedRowIds.length === filteredAndSortedData.length && filteredAndSortedData.length > 0} onChange={toggleSelectAll} /></DnaTh>
                <DnaTh className="p-3.5 w-32 cursor-pointer hover:bg-slate-100/60" onClick={() => handleHeaderSortToggle("wo")}>DOKUMEN &amp; PO</DnaTh>
                <DnaTh className="p-3.5 cursor-pointer hover:bg-slate-100/60" onClick={() => handleHeaderSortToggle("produk")}>PRODUK &amp; KLIEN</DnaTh>
                <DnaTh className="p-3.5 w-32 cursor-pointer hover:bg-slate-100/60" onClick={() => handleHeaderSortToggle("stage")}>STATUS</DnaTh>
                <DnaTh className="p-3.5 w-32">PROGRESS</DnaTh>
                <DnaTh className="p-3.5 w-36 cursor-pointer hover:bg-slate-100/60" onClick={() => handleHeaderSortToggle("targetDate")}>TARGET DATE</DnaTh>
                <DnaTh className="p-3.5 w-28 text-right cursor-pointer hover:bg-slate-100/60" onClick={() => handleHeaderSortToggle("target")}>TARGET</DnaTh>
                <DnaTh className="p-3.5 w-32 text-right cursor-pointer hover:bg-slate-100/60" onClick={() => handleHeaderSortToggle("totalNilai")}>TOTAL NILAI</DnaTh>
                <DnaTh className="p-3.5 w-36">MATERIAL</DnaTh>
                <DnaTh className="p-3.5 text-center w-24">AKSI</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {filteredAndSortedData.map((wo) => (
                <DnaTableRow key={wo.id} className="hover:bg-slate-50/80 transition-colors">
                  <DnaTd className="p-3.5 text-center"><DnaCheckbox checked={selectedRowIds.includes(wo.id)} onChange={() => toggleSelectRow(wo.id)} /></DnaTd>
                  <DnaTd className="p-3.5"><DnaCell.Code value={wo.wo} subtitle={`Ref: ${wo.refPo}`} onClick={() => setInspectingWo(wo)} /></DnaTd>
                  <DnaTd className="p-3.5"><DnaCell.Text primary={wo.produk} secondary={wo.klien} /></DnaTd>
                  <DnaTd className="p-3.5"><DnaCell.Badge status={wo.stage} /></DnaTd>
                  <DnaTd className="p-3.5"><DnaCell.Progress value={wo.progressPercent} colorClass={wo.progressColor} /></DnaTd>
                  <DnaTd className="p-3.5"><span className="text-[11.5px] text-slate-600 truncate max-w-[160px] inline-block font-medium">{wo.materialSummary}</span></DnaTd>
                  <DnaTd className="p-3.5 text-right">
                    <span className="tabular-nums text-slate-800 font-semibold tabular-nums">{wo.target.toLocaleString("id-ID")}</span>
                    <span className="text-[10.5px] text-slate-400 ml-1">Pcs</span>
                  </DnaTd>
                  <DnaTd className="p-3.5 text-right"><DnaCell.Currency value={wo.totalNilai} /></DnaTd>
                  <DnaTd className="p-3.5">
                    <span className="text-[11.5px] text-slate-600 truncate max-w-[150px] inline-block font-medium">
                      {wo.materialSummary}
                    </span>
                  </DnaTd>
                  <DnaTd className="p-3.5 text-center">
                    <div className="flex gap-1 justify-center">
                      <button onClick={() => setInspectingWo(wo)} title="Inspeksi Detail" className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"><FileText className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleOpenEditModal(wo)} title="Edit Data" className="p-1.5 text-slate-400 hover:text-amber-600 rounded-md hover:bg-amber-50 transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => requestDeleteWo(wo)} title="Hapus Data" className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </DnaTd>
                </DnaTableRow>
              ))}
            </DnaTableBody>
          </DnaTable>
        ) : activeColumnCount === 10 ? (
          /* ── 10 KOLOM: 2 KOLOM 2 DATA (KOMPAK, RAMPING & LEBAR TERPROTEKSI) ── */
          <div className="overflow-x-auto">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider">
                  <DnaTh className="p-3.5 w-10 text-center"><DnaCheckbox checked={selectedRowIds.length === filteredAndSortedData.length && filteredAndSortedData.length > 0} onChange={toggleSelectAll} /></DnaTh>
                  <DnaTh className="p-3.5 w-36 min-w-[140px] cursor-pointer hover:bg-slate-100/60 whitespace-nowrap" onClick={() => handleHeaderSortToggle("wo")}>DOKUMEN &amp; PO</DnaTh>
                  <DnaTh className="p-3.5 min-w-[240px] cursor-pointer hover:bg-slate-100/60" onClick={() => handleHeaderSortToggle("produk")}>PRODUK &amp; KLIEN</DnaTh>
                  <DnaTh className="p-3.5 w-32 min-w-[120px] cursor-pointer hover:bg-slate-100/60 whitespace-nowrap" onClick={() => handleHeaderSortToggle("stage")}>STATUS</DnaTh>
                  <DnaTh className="p-3.5 w-32 min-w-[120px] whitespace-nowrap">PROGRESS</DnaTh>
                  <DnaTh className="p-3.5 w-36 min-w-[140px] cursor-pointer hover:bg-slate-100/60 whitespace-nowrap" onClick={() => handleHeaderSortToggle("targetDate")}>TARGET DATE</DnaTh>
                  <DnaTh className="p-3.5 w-40 min-w-[150px] whitespace-nowrap">MATERIAL</DnaTh>
                  <DnaTh className="p-3.5 w-28 min-w-[100px] text-right cursor-pointer hover:bg-slate-100/60 whitespace-nowrap" onClick={() => handleHeaderSortToggle("target")}>TARGET</DnaTh>
                  <DnaTh className="p-3.5 w-32 min-w-[110px] text-right whitespace-nowrap">HPP SATUAN</DnaTh>
                  <DnaTh className="p-3.5 w-36 min-w-[120px] text-right cursor-pointer hover:bg-slate-100/60 whitespace-nowrap" onClick={() => handleHeaderSortToggle("totalNilai")}>TOTAL NILAI</DnaTh>
                  <DnaTh className="p-3.5 text-center w-24 whitespace-nowrap">AKSI</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {filteredAndSortedData.map((wo) => (
                  <DnaTableRow key={wo.id} className="hover:bg-slate-50/80 transition-colors">
                    <DnaTd className="p-3.5 text-center"><DnaCheckbox checked={selectedRowIds.includes(wo.id)} onChange={() => toggleSelectRow(wo.id)} /></DnaTd>
                    <DnaTd className="p-3.5 whitespace-nowrap"><DnaCell.Code value={wo.wo} subtitle={`Ref: ${wo.refPo}`} onClick={() => setInspectingWo(wo)} /></DnaTd>
                    <DnaTd className="p-3.5 min-w-[240px]"><DnaCell.Text primary={wo.produk} secondary={wo.klien} /></DnaTd>
                    <DnaTd className="p-3.5 whitespace-nowrap"><DnaCell.Badge status={wo.stage} /></DnaTd>
                    <DnaTd className="p-3.5"><DnaCell.Progress value={wo.progressPercent} colorClass={wo.progressColor} /></DnaTd>
                    <DnaTd className="p-3.5 whitespace-nowrap"><span className="text-[11.5px] text-slate-600 truncate max-w-[160px] inline-block font-medium">{wo.materialSummary}</span></DnaTd>
                    <DnaTd className="p-3.5 whitespace-nowrap">
                      <span className="text-[11.5px] text-slate-600 truncate max-w-[160px] inline-block font-medium">
                        {wo.materialSummary}
                      </span>
                    </DnaTd>
                    <DnaTd className="p-3.5 text-right whitespace-nowrap"><DnaCell.Number value={wo.target} suffix="Pcs" /></DnaTd>
                    <DnaTd className="p-3.5 text-right whitespace-nowrap"><DnaCell.Currency value={wo.hpp} /></DnaTd>
                    <DnaTd className="p-3.5 text-right whitespace-nowrap"><DnaCell.Currency value={wo.totalNilai} /></DnaTd>
                    <DnaTd className="p-3.5 text-center">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => setInspectingWo(wo)} title="Inspeksi Detail" className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"><FileText className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleOpenEditModal(wo)} title="Edit Data" className="p-1.5 text-slate-400 hover:text-amber-600 rounded-md hover:bg-amber-50 transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => requestDeleteWo(wo)} title="Hapus Data" className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </DnaTd>
                  </DnaTableRow>
                ))}
              </DnaTableBody>
            </DnaTable>
          </div>
        ) : (
          /* ── 11 KOLOM: 2 KOLOM 2 DATA + # URUT (STANDAR TABEL TERLEBAR ERP) ── */
          <div className="overflow-x-auto">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider">
                  <DnaTh className="p-3.5 w-10 text-center"><DnaCheckbox checked={selectedRowIds.length === filteredAndSortedData.length && filteredAndSortedData.length > 0} onChange={toggleSelectAll} /></DnaTh>
                  <DnaTh className="p-3.5 w-10 text-slate-400 tabular-nums text-center">#</DnaTh>
                  <DnaTh className="p-3.5 w-36 min-w-[140px] cursor-pointer hover:bg-slate-100/60 whitespace-nowrap" onClick={() => handleHeaderSortToggle("wo")}>DOKUMEN &amp; PO</DnaTh>
                  <DnaTh className="p-3.5 min-w-[240px] cursor-pointer hover:bg-slate-100/60" onClick={() => handleHeaderSortToggle("produk")}>PRODUK &amp; KLIEN</DnaTh>
                  <DnaTh className="p-3.5 w-32 min-w-[120px] cursor-pointer hover:bg-slate-100/60 whitespace-nowrap" onClick={() => handleHeaderSortToggle("stage")}>STATUS</DnaTh>
                  <DnaTh className="p-3.5 w-32 min-w-[120px] whitespace-nowrap">PROGRESS</DnaTh>
                  <DnaTh className="p-3.5 w-36 min-w-[140px] cursor-pointer hover:bg-slate-100/60 whitespace-nowrap" onClick={() => handleHeaderSortToggle("targetDate")}>TARGET DATE</DnaTh>
                  <DnaTh className="p-3.5 w-40 min-w-[150px] whitespace-nowrap">MATERIAL</DnaTh>
                  <DnaTh className="p-3.5 w-28 min-w-[100px] text-right cursor-pointer hover:bg-slate-100/60 whitespace-nowrap" onClick={() => handleHeaderSortToggle("target")}>TARGET</DnaTh>
                  <DnaTh className="p-3.5 w-32 min-w-[110px] text-right whitespace-nowrap">HPP SATUAN</DnaTh>
                  <DnaTh className="p-3.5 w-36 min-w-[120px] text-right cursor-pointer hover:bg-slate-100/60 whitespace-nowrap" onClick={() => handleHeaderSortToggle("totalNilai")}>TOTAL NILAI</DnaTh>
                  <DnaTh className="p-3.5 text-center w-24 whitespace-nowrap">AKSI</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {filteredAndSortedData.map((wo, index) => (
                  <DnaTableRow key={wo.id} className="hover:bg-slate-50/80 transition-colors">
                    <DnaTd className="p-3.5 text-center"><DnaCheckbox checked={selectedRowIds.includes(wo.id)} onChange={() => toggleSelectRow(wo.id)} /></DnaTd>
                    <DnaTd className="p-3.5 text-slate-400 tabular-nums text-[11px] tabular-nums text-center">{index + 1}</DnaTd>
                    <DnaTd className="p-3.5 whitespace-nowrap"><DnaCell.Code value={wo.wo} subtitle={`Ref: ${wo.refPo}`} onClick={() => setInspectingWo(wo)} /></DnaTd>
                    <DnaTd className="p-3.5 min-w-[240px]"><DnaCell.Text primary={wo.produk} secondary={wo.klien} /></DnaTd>
                    <DnaTd className="p-3.5 whitespace-nowrap"><DnaCell.Badge status={wo.stage} /></DnaTd>
                    <DnaTd className="p-3.5"><DnaCell.Progress value={wo.progressPercent} colorClass={wo.progressColor} /></DnaTd>
                    <DnaTd className="p-3.5 whitespace-nowrap"><span className="text-[11.5px] text-slate-600 truncate max-w-[160px] inline-block font-medium">{wo.materialSummary}</span></DnaTd>
                    <DnaTd className="p-3.5 whitespace-nowrap">
                      <span className="text-[11.5px] text-slate-600 truncate max-w-[160px] inline-block font-medium">
                        {wo.materialSummary}
                      </span>
                    </DnaTd>
                    <DnaTd className="p-3.5 text-right whitespace-nowrap"><DnaCell.Number value={wo.target} suffix="Pcs" /></DnaTd>
                    <DnaTd className="p-3.5 text-right whitespace-nowrap"><DnaCell.Currency value={wo.hpp} /></DnaTd>
                    <DnaTd className="p-3.5 text-right whitespace-nowrap"><DnaCell.Currency value={wo.totalNilai} /></DnaTd>
                    <DnaTd className="p-3.5 text-center">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => setInspectingWo(wo)} title="Inspeksi Detail" className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"><FileText className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleOpenEditModal(wo)} title="Edit Data" className="p-1.5 text-slate-400 hover:text-amber-600 rounded-md hover:bg-amber-50 transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => requestDeleteWo(wo)} title="Hapus Data" className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </DnaTd>
                  </DnaTableRow>
                ))}
              </DnaTableBody>
            </DnaTable>
          </div>
        )}
      </DnaDataTableCard>

      {/* ── 05. MASTER FLOATING WINDOW DETAIL INSPECTION (CENTER FLOATING MODAL, BUKAN SIDE DRAWER) ── */}
      {inspectingWo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-3 md:p-6 animate-in fade-in duration-200">
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            style={{ maxHeight: "88vh" }}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-bold text-slate-900 text-[16px]">Inspeksi Work Order Produksi</h3>
                    <span className="tabular-nums text-[12px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                      {inspectingWo.wo}
                    </span>
                    <DnaCell.Badge status={inspectingWo.stage} />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Ref. PO: <span className="tabular-nums text-slate-700 font-semibold">{inspectingWo.refPo}</span> • Target: <span className="tabular-nums text-slate-700 font-semibold">{inspectingWo.targetDate}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingWo(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 border-none bg-transparent cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-5 text-[12px] custom-scrollbar flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Target Produksi</span>
                  <span className="font-bold text-slate-900 text-[15px] tabular-nums tabular-nums">
                    {inspectingWo.target.toLocaleString("id-ID")} Pcs
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">HPP Satuan</span>
                  <span className="font-bold text-slate-900 text-[15px] tabular-nums tabular-nums">
                    Rp {inspectingWo.hpp.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <span className="text-[10px] uppercase font-bold text-blue-600 block tracking-wider">Total Nilai WO</span>
                  <span className="font-bold text-blue-700 text-[15px] tabular-nums tabular-nums">
                    Rp {inspectingWo.totalNilai.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Progres Batch</span>
                  <span className="font-bold text-slate-900 text-[15px] tabular-nums tabular-nums">
                    {inspectingWo.progressPercent}%
                  </span>
                </div>
              </div>
              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/80 space-y-3">
                <h4 className="font-bold text-slate-800 text-[12px] uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" /> Informasi Produk & Mitra
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Nama Produk / Formula</span>
                    <span className="font-bold text-slate-900 text-[14px]">{inspectingWo.produk}</span>
                    <span className="inline-block mt-1 text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                      {inspectingWo.brand}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Klien / Brand Owner</span>
                    <span className="font-bold text-slate-900 text-[14px]">{inspectingWo.klien}</span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">Material: {inspectingWo.materialSummary}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-600" /> Tahapan Produksi & Quality Control
                  </span>
                  <span className="font-semibold text-slate-600 tabular-nums">{inspectingWo.progressPercent}% Selesai</span>
                </div>
                <DnaCell.Progress
                  value={inspectingWo.progressPercent}
                  colorClass={inspectingWo.progressColor}
                />
              </div>
              <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-100/80 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-amber-900 tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" /> Catatan Operasional & Terakhir Diperbarui
                </span>
                <p className="text-slate-700 leading-relaxed text-[12px]">{inspectingWo.notes}</p>
                <div className="pt-2 text-[10px] text-slate-400 tabular-nums">
                  Timestamp: {inspectingWo.targetDate} • Stage: {inspectingWo.stage}
                </div>
              </div>
            </div>
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                onClick={() => {
                  const wo = inspectingWo;
                  setInspectingWo(null);
                  handleOpenEditModal(wo);
                }}
                className="h-9 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-xl text-[12px] border border-blue-200 cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" /> Ubah Data Work Order
              </button>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setInspectingWo(null)}
                  className="h-9 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[12px] font-semibold border-none cursor-pointer transition-colors"
                >
                  Tutup Window
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-3 md:p-6 animate-in fade-in duration-200">
          <div
            className={cn("bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 transition-all", modalSize === "sm" && "w-full max-w-md", modalSize === "md" && "w-full max-w-xl", modalSize === "lg" && "w-full max-w-3xl", modalSize === "xl" && "w-full max-w-5xl")}
            style={{ maxHeight: "88vh" }}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center"><Boxes className="w-5 h-5" /></div>
                <div>
                  <div className="flex items-center gap-2"><h3 className="font-bold text-slate-900 text-[15px]">Buat Work Order Baru</h3><span className="px-2 py-0.5 rounded-md bg-blue-100/70 text-blue-700 tabular-nums text-[10px] font-bold">DRAFT</span></div>
                </div>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 border-none bg-transparent cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-5 text-[12px] custom-scrollbar flex-1">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <h4 className="font-bold text-slate-800 text-[12px] uppercase tracking-wider flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-blue-600" /> Informasi Klien & Produk</h4>
                </div>
                <div className={cn("grid gap-3.5", modalSize === "sm" ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2")}>
                  <div className="relative">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Lead Produksi <span className="text-rose-500">*</span></label>
                    <div onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)} className="w-full min-h-[38px] px-3 py-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl cursor-pointer flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">
                          {selectedLead ? selectedLead.clientName : leadsQuery.isLoading ? "Memuat lead..." : "Pilih lead"}
                        </div>
                        {selectedLead && (
                          <div className="text-[10.5px] text-slate-500">{selectedLead.brandName} · {selectedLead.productInterest}</div>
                        )}
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
                    {isClientDropdownOpen && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto custom-scrollbar">
                        <div className="p-2 border-b border-slate-100 sticky top-0 bg-white">
                          <input
                            type="text"
                            value={clientSearchQuery}
                            onChange={(e) => setClientSearchQuery(e.target.value)}
                            placeholder="Cari lead..."
                            className="w-full h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11.5px] focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        {filteredClientOptions.length === 0 ? (
                          <div className="p-3 text-[11.5px] text-slate-500">
                            {leadsQuery.isError ? "Gagal memuat daftar lead dari server." : "Tidak ada lead yang cocok."}
                          </div>
                        ) : (
                          filteredClientOptions.map((lead) => (
                            <button
                              key={lead.id}
                              type="button"
                              onClick={() => {
                                setNewLeadId(lead.id);
                                setIsClientDropdownOpen(false);
                                setClientSearchQuery("");
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors"
                            >
                              <div className="font-semibold text-slate-900 text-[11.5px]">{lead.clientName}</div>
                              <div className="text-[10.5px] text-slate-500">{lead.brandName} · {lead.productInterest}</div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Target Selesai <span className="text-rose-500">*</span></label>
                    <input type="date" value={newTargetDate} onChange={(e) => setNewTargetDate(e.target.value)} className="w-full h-9.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:border-blue-500" />
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <h4 className="font-bold text-slate-800 text-[12px] uppercase tracking-wider flex items-center gap-1.5"><Boxes className="w-3.5 h-3.5 text-blue-600" /> Parameter Produksi</h4>
                </div>
                <p className="text-[11px] text-slate-500">
                  Nomor WO, stage awal, dan HPP dihitung backend saat Work Order dibuat.
                </p>
                <div className={cn("grid gap-3.5", modalSize === "sm" ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2")}>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Target Qty (Pcs)</label>
                    <input type="number" value={newTarget} onChange={(e) => setNewTarget(Number(e.target.value))} className="w-full h-9.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] tabular-nums font-bold" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Catatan</label>
                    <input type="text" value={newNotes} onChange={(e) => setNewNotes(e.target.value)} className="w-full h-9.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px]" />
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0 gap-3">
              <button onClick={() => setIsCreateModalOpen(false)} className="h-9 px-4 bg-white border border-slate-200 rounded-xl text-[12px] font-semibold">Batal</button>
              <button onClick={handleCreateNewWo} disabled={!canCreate} className={cn("h-9 px-5 rounded-xl text-[12px] font-semibold border-none transition-all", canCreate ? "bg-blue-600 text-white cursor-pointer" : "bg-slate-200 text-slate-400 cursor-not-allowed")}>{createWorkOrder.isPending ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </div>
        </div>
      )}

      {editingWo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-3 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150" style={{ maxHeight: "88vh" }}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center"><Edit3 className="w-5 h-5" /></div>
                <div><h3 className="font-bold text-slate-900 text-[15px]">Ubah Data WO</h3><span className="tabular-nums text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">{editingWo.wo}</span></div>
              </div>
              <button onClick={() => setEditingWo(null)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 text-[12px] custom-scrollbar flex-1">
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50 text-[11.5px] text-amber-800 leading-relaxed">
                <strong className="font-bold">Backend belum menyediakan endpoint ubah Work Order.</strong>{" "}
                Tidak ada PATCH /production/work-orders/:id, jadi form ini hanya menampilkan data
                yang tersimpan di server. Untuk mengubah stage, gunakan alur produksi (dispatch/schedule),
                bukan editor ini.
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500">Produk / Minat</span>
                  <div className="mt-0.5 font-bold text-slate-900 text-[13px]">{editingWo.produk}</div>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500">Klien</span>
                  <div className="mt-0.5 font-bold text-slate-900 text-[13px]">{editingWo.klien}</div>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500">Brand</span>
                  <div className="mt-0.5 font-bold text-slate-900 text-[13px]">{editingWo.brand}</div>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500">Stage</span>
                  <div className="mt-0.5"><DnaCell.Badge status={editingWo.stage} /></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Target</span>
                  <span className="font-bold text-slate-900 text-[13px] tabular-nums">{editingWo.target.toLocaleString("id-ID")} Pcs</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">HPP Satuan</span>
                  <span className="font-bold text-slate-900 text-[13px] tabular-nums">{formatRupiah(editingWo.hpp)}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Nilai</span>
                  <span className="font-bold text-slate-900 text-[13px] tabular-nums">{formatRupiah(editingWo.totalNilai)}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <span className="text-[11px] text-slate-600 font-semibold">Target Selesai</span>
                <span className="tabular-nums font-bold text-slate-800 text-[13px]">{editingWo.targetDate}</span>
              </div>

              <div>
                <span className="block text-[11px] font-semibold text-slate-500 mb-1">Catatan Terakhir (log produksi)</span>
                <p className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-700">{editingWo.notes}</p>
              </div>
            </div>

            {/* 3. DOCKED STICKY FOOTER */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500">
                Hanya baca — perubahan tidak dapat disimpan
              </span>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingWo(null)}
                  className="h-9 px-4 bg-white border border-slate-200 text-slate-700 rounded-xl text-[12px] font-semibold hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedWo}
                  className="h-9 px-5 rounded-xl text-[12px] font-semibold border-none transition-all shadow-2xs bg-amber-100 text-amber-800 hover:bg-amber-200 cursor-pointer"
                >
                  Kenapa tidak bisa simpan?
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 08. UNIVERSAL ENTERPRISE CONFIRMATION DIALOG (REPLACES NATIVE BROWSER CONFIRM/ALERT) ── */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            {/* Header Icon + Title */}
            <div className="flex items-start gap-3.5">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                  confirmDialog.variant === "danger" && "bg-rose-50 border-rose-200 text-rose-600",
                  confirmDialog.variant === "warning" && "bg-amber-50 border-amber-200 text-amber-600",
                  confirmDialog.variant === "info" && "bg-blue-50 border-blue-200 text-blue-600"
                )}
              >
                {confirmDialog.variant === "danger" && <ShieldAlert className="w-5 h-5" />}
                {confirmDialog.variant === "warning" && <AlertTriangle className="w-5 h-5" />}
                {confirmDialog.variant === "info" && <Info className="w-5 h-5" />}
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-[15px] leading-snug">
                  {confirmDialog.title}
                </h3>
                <p className="text-[12px] text-slate-600 mt-1 leading-relaxed">
                  {confirmDialog.description}
                </p>
              </div>
            </div>

            {/* Consequences / Audit impact list */}
            {confirmDialog.consequences && confirmDialog.consequences.length > 0 && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[11px] text-slate-700">
                <span className="font-bold block text-slate-800 uppercase tracking-wider text-[10px]">
                  Dampak Sistem & Audit:
                </span>
                {confirmDialog.consequences.map((c, i) => (
                  <div key={i} className="flex items-start gap-1.5 leading-snug text-slate-600">
                    <span className="text-slate-400">•</span>
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Optional Audit Reason Input */}
            {confirmDialog.requiresReason && (
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Alasan Penghapusan / Void <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={confirmReason}
                  onChange={(e) => setConfirmReason(e.target.value)}
                  placeholder={confirmDialog.reasonPlaceholder || "Tuliskan alasan..."}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:border-rose-500 focus:bg-white"
                  autoFocus
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmDialog((p) => ({ ...p, isOpen: false }))}
                className="h-9 px-4 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl text-[12px] hover:bg-slate-50 cursor-pointer transition-colors"
              >
                {confirmDialog.cancelLabel || "Batal"}
              </button>
              <button
                type="button"
                disabled={confirmDialog.requiresReason && !confirmReason.trim()}
                onClick={() => confirmDialog.onConfirm(confirmReason)}
                className={cn(
                  "h-9 px-4 font-semibold rounded-xl text-[12px] border-none transition-all shadow-2xs",
                  confirmDialog.requiresReason && !confirmReason.trim()
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : confirmDialog.variant === "danger"
                    ? "bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                    : confirmDialog.variant === "warning"
                    ? "bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                    : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                )}
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

