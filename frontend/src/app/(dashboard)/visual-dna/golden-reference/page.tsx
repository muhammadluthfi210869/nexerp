"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Download,
  Printer,
  Edit3,
  Trash2,
  X,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Plus,
  RotateCcw,
  Check,
  Search,
  Building2,
  Boxes,
  FileSpreadsheet,
  Layers,
  ShieldAlert,
  Info,
  Maximize2,
  CornerDownLeft,
  ChevronDown,
  Clock,
  UserCheck,
  Package,
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
} from "@/components/dna";

// ── Types & Interfaces ──
interface WorkOrder {
  id: string;
  wo: string;
  refPo: string;
  produk: string;
  klien: string;
  category: string;
  stage: "Finished Goods" | "Mixing" | "Waiting Material" | "Pending Review";
  progressPercent: number;
  progressColor: string;
  pic: string;
  picInitial: string;
  target: number;
  hpp: number;
  totalNilai: number;
  updatedAt: string;
  line: string;
  notes: string;
}

interface ClientMaster {
  id: string;
  name: string;
  category: string;
  creditLimit: number;
  activeOrders: number;
  contact: string;
}

const CLIENT_OPTIONS: ClientMaster[] = [
  { id: "c1", name: "PT Glow Skin Global", category: "Skincare FMCG", creditLimit: 500000000, activeOrders: 4, contact: "0812-8899-1122" },
  { id: "c2", name: "CV Cantika Ayu", category: "Cosmetics & Bodycare", creditLimit: 150000000, activeOrders: 3, contact: "0813-4455-6677" },
  { id: "c3", name: "PT Derma Solusi", category: "Clinical Aesthetic", creditLimit: 750000000, activeOrders: 2, contact: "0811-2233-4455" },
  { id: "c4", name: "PT Natura Indah", category: "Organic Herbal", creditLimit: 300000000, activeOrders: 2, contact: "0815-9900-1122" },
  { id: "c5", name: "PT Aurora Beauty", category: "Premium Serum", creditLimit: 250000000, activeOrders: 1, contact: "0812-3456-7890" },
];

// ── INITIAL MOCK DATA ──
const INITIAL_WORK_ORDERS: WorkOrder[] = [
  {
    id: "1",
    wo: "WO-2608-01",
    refPo: "PO-2026-081",
    produk: "Acne Clarifying Serum 30ml",
    klien: "PT Glow Skin Global",
    category: "Skincare",
    stage: "Finished Goods",
    progressPercent: 100,
    progressColor: "bg-emerald-500",
    pic: "Budi Santoso",
    picInitial: "B",
    target: 5000,
    hpp: 18500,
    totalNilai: 92500000,
    updatedAt: "25/08/2026 14:32",
    line: "Line A — Packaging",
    notes: "Batch dirilis QC setelah uji stabilitas & mikrobiologi lulus tanpa catatan.",
  },
  {
    id: "2",
    wo: "WO-2608-02",
    refPo: "PO-2026-082",
    produk: "Hydrating Barrier Toner 100ml",
    klien: "CV Cantika Ayu",
    category: "Skincare",
    stage: "Mixing",
    progressPercent: 65,
    progressColor: "bg-sky-500",
    pic: "Siti Rahma",
    picInitial: "S",
    target: 3000,
    hpp: 14200,
    totalNilai: 42600000,
    updatedAt: "25/08/2026 11:15",
    line: "Line B — Homogenizer",
    notes: "Fase pendinginan tangki pendingin sedang berlangsung; target suhu 28°C.",
  },
  {
    id: "3",
    wo: "WO-2608-03",
    refPo: "PO-2026-083",
    produk: "Sunscreen Gel SPF 50 50ml",
    klien: "PT Derma Solusi",
    category: "Suncare",
    stage: "Waiting Material",
    progressPercent: 20,
    progressColor: "bg-amber-500",
    pic: "Agus Tri",
    picInitial: "A",
    target: 10000,
    hpp: 21000,
    totalNilai: 210000000,
    updatedAt: "24/08/2026 16:45",
    line: "Line A — Staging Area",
    notes: "Menunggu pasokan UV Filter Zinc Oxide dari distributor tiba sore hari.",
  },
  {
    id: "4",
    wo: "WO-2608-04",
    refPo: "PO-2026-084",
    produk: "Brightening Day Cream 25g",
    klien: "PT Glow Skin Global",
    category: "Skincare",
    stage: "Pending Review",
    progressPercent: 0,
    progressColor: "bg-slate-400",
    pic: "Dewi Lestari",
    picInitial: "D",
    target: 2500,
    hpp: 16800,
    totalNilai: 42000000,
    updatedAt: "24/08/2026 09:20",
    line: "RnD Pilot Plant",
    notes: "Permintaan modifikasi formula parfum dari pihak klien masih ditelaah QC.",
  },
  {
    id: "5",
    wo: "WO-2608-05",
    refPo: "PO-2026-085",
    produk: "Gentle Cleanser Oat 120ml",
    klien: "PT Natura Indah",
    category: "Cleanser",
    stage: "Finished Goods",
    progressPercent: 100,
    progressColor: "bg-emerald-500",
    pic: "Budi Santoso",
    picInitial: "B",
    target: 4000,
    hpp: 12500,
    totalNilai: 50000000,
    updatedAt: "23/08/2026 17:00",
    line: "Warehouse FG",
    notes: "Karantina 24 jam selesai, siap dikirimkan ke gudang pusat logistik.",
  },
  {
    id: "6",
    wo: "WO-2608-06",
    refPo: "PO-2026-086",
    produk: "Lip Tint Serum Peach 5ml",
    klien: "CV Cantika Ayu",
    category: "Decorative",
    stage: "Mixing",
    progressPercent: 45,
    progressColor: "bg-sky-500",
    pic: "Hendra Wijaya",
    picInitial: "H",
    target: 8000,
    hpp: 9800,
    totalNilai: 78400000,
    updatedAt: "23/08/2026 13:30",
    line: "Line C — Color Matching",
    notes: "Penyesuaian shade merah muda pastel ronde kedua telah disetujui internal.",
  },
  {
    id: "7",
    wo: "WO-2608-07",
    refPo: "PO-2026-087",
    produk: "Peeling Solution BHA 2% 30ml",
    klien: "PT Derma Solusi",
    category: "Exfoliator",
    stage: "Waiting Material",
    progressPercent: 15,
    progressColor: "bg-amber-500",
    pic: "Agus Tri",
    picInitial: "A",
    target: 6000,
    hpp: 15400,
    totalNilai: 92400000,
    updatedAt: "22/08/2026 10:00",
    line: "Warehouse Raw Material",
    notes: "Botol droper amber 30ml sedang proses sterilisasi di clean room.",
  },
  {
    id: "8",
    wo: "WO-2608-08",
    refPo: "PO-2026-088",
    produk: "Eye Cream Peptide Complex 15g",
    klien: "PT Natura Indah",
    category: "Special Treatment",
    stage: "Mixing",
    progressPercent: 80,
    progressColor: "bg-sky-500",
    pic: "Siti Rahma",
    picInitial: "S",
    target: 2000,
    hpp: 28500,
    totalNilai: 57000000,
    updatedAt: "22/08/2026 08:45",
    line: "Line B — Homogenizer",
    notes: "Viskositas emulsi tercapai sempurna; siap dipindahkan ke tangki penampung.",
  },
  {
    id: "9",
    wo: "WO-2608-09",
    refPo: "PO-2026-089",
    produk: "Soothing Cica Calming Mist 60ml",
    klien: "CV Cantika Ayu",
    category: "Face Mist",
    stage: "Pending Review",
    progressPercent: 0,
    progressColor: "bg-slate-400",
    pic: "Dewi Lestari",
    picInitial: "D",
    target: 5000,
    hpp: 11000,
    totalNilai: 55000000,
    updatedAt: "21/08/2026 15:10",
    line: "RnD Lab",
    notes: "Menunggu approval penambahan persentase extract Centella dari Brand Owner.",
  },
  {
    id: "10",
    wo: "WO-2608-10",
    refPo: "PO-2026-090",
    produk: "Charcoal Clay Mask Detox 50g",
    klien: "PT Glow Skin Global",
    category: "Wash-off Mask",
    stage: "Finished Goods",
    progressPercent: 100,
    progressColor: "bg-emerald-500",
    pic: "Budi Santoso",
    picInitial: "B",
    target: 3500,
    hpp: 17200,
    totalNilai: 60200000,
    updatedAt: "21/08/2026 12:00",
    line: "Warehouse FG",
    notes: "COA (Certificate of Analysis) lengkap, siap terbit surat jalan ekspedisi.",
  },
];

type FilterColumnType = "stage" | "klien" | "produk" | "pic" | "target" | "totalNilai";
type FloatingWindowSize = "sm" | "md" | "lg" | "xl";

export default function GoldenReferencePage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(INITIAL_WORK_ORDERS);
  const [activeTab, setActiveTab] = useState<"WORK_ORDERS" | "ANALYTICS">("WORK_ORDERS");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKpiFilter, setSelectedKpiFilter] = useState<string | null>(null);
  const [selectedFilterColumn, setSelectedFilterColumn] = useState<FilterColumnType>("stage");
  const [filterColumnValue, setFilterColumnValue] = useState<string>("ALL");
  const [dateMode, setDateMode] = useState<DnaDateMode>("1_MONTH");
  const [startDate, setStartDate] = useState<string>("2026-08-02");
  const [endDate, setEndDate] = useState<string>("2026-09-10");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [showStateDemo, setShowStateDemo] = useState<"NONE" | "EMPTY" | "LOADING" | "ERROR">("NONE");

  // ── FLOATING DETAIL INSPECTION WINDOW STATE ──
  const [inspectingWo, setInspectingWo] = useState<WorkOrder | null>(null);

  // ── FLOATING INPUT (CREATE) WINDOW SIZING & STATE ──
  const [modalSize, setModalSize] = useState<FloatingWindowSize>("lg");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [newClient, setNewClient] = useState<ClientMaster>(CLIENT_OPTIONS[4]);
  const [newBrandName, setNewBrandName] = useState("Aurora Glow");
  const [newCategory, setNewCategory] = useState("Skincare");
  const [newTarget, setNewTarget] = useState<number>(1000);
  const [newHpp, setNewHpp] = useState<number>(150000);
  const [newNotes, setNewNotes] = useState("Work order baru didaftarkan.");
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");

  const [lineItems, setLineItems] = useState([
    { id: "1", name: "Botol Dropper 30ml Amber Glass", qty: 1000, unit: "Pcs", unitPrice: 3200, total: 3200000 },
    { id: "2", name: "Cap Pipette Gold Collar + Rubber", qty: 1000, unit: "Pcs", unitPrice: 2100, total: 2100000 },
    { id: "3", name: "Label Stiker Vinyl Doff Water Resistant", qty: 1000, unit: "Pcs", unitPrice: 850, total: 850000 },
  ]);

  const calculatedNilai = newTarget * newHpp;

  const [editingWo, setEditingWo] = useState<WorkOrder | null>(null);
  const [originalWo, setOriginalWo] = useState<WorkOrder | null>(null);

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

  const uniqueClients = useMemo(() => Array.from(new Set(workOrders.map((item) => item.klien))), [workOrders]);
  const uniquePics = useMemo(() => Array.from(new Set(workOrders.map((item) => item.pic))), [workOrders]);

  const filteredClientOptions = useMemo(() => {
    if (!clientSearchQuery.trim()) return CLIENT_OPTIONS;
    const q = clientSearchQuery.toLowerCase();
    return CLIENT_OPTIONS.filter((c) => c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
  }, [clientSearchQuery]);

  const parseItemDate = (dateStr: string): Date | null => {
    try {
      const parts = dateStr.split(" ");
      const dmy = parts[0].split("/");
      if (dmy.length === 3) return new Date(Number(dmy[2]), Number(dmy[1]) - 1, Number(dmy[0]));
    } catch { return null; }
    return null;
  };

  const filteredAndSortedData = useMemo(() => {
    return workOrders
      .filter((item) => {
        if (selectedKpiFilter === "OMSET" && item.stage !== "Finished Goods") return false;
        if (selectedKpiFilter === "APPROVED" && item.stage !== "Finished Goods") return false;
        if (selectedKpiFilter === "PENDING" && item.stage !== "Pending Review") return false;
        if (selectedKpiFilter === "EFFICIENCY" && item.progressPercent < 50) return false;

        if (searchQuery.trim() !== "") {
          const q = searchQuery.toLowerCase();
          if (!item.wo.toLowerCase().includes(q) && !item.produk.toLowerCase().includes(q) && !item.klien.toLowerCase().includes(q) && !item.pic.toLowerCase().includes(q)) return false;
        }

        if (filterColumnValue !== "ALL") {
          if (selectedFilterColumn === "stage" && item.stage !== filterColumnValue) return false;
          if (selectedFilterColumn === "klien" && item.klien !== filterColumnValue) return false;
          if (selectedFilterColumn === "pic" && item.pic !== filterColumnValue) return false;
        }

        if (dateMode !== "ALL") {
          const itemDate = parseItemDate(item.updatedAt);
          if (itemDate) {
            if (dateMode === "CUSTOM" && startDate && endDate) {
              const start = new Date(startDate);
              const end = new Date(endDate);
              end.setHours(23, 59, 59, 999);
              if (itemDate < start || itemDate > end) return false;
            } else {
              const anchorDate = new Date(2026, 7, 25);
              const diffMs = anchorDate.getTime() - itemDate.getTime();
              const diffDays = diffMs / (1000 * 60 * 60 * 24);
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
          case "pic": return dir * a.pic.localeCompare(b.pic);
          case "target": return dir * (a.target - b.target);
          case "totalNilai": return dir * (a.totalNilai - b.totalNilai);
          case "updatedAt": return dir * a.updatedAt.localeCompare(b.updatedAt);
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

  const requestDeleteWo = (woItem: WorkOrder) => {
    setConfirmReason("");
    setConfirmDialog({
      isOpen: true,
      variant: "danger",
      title: `Hapus Work Order ${woItem.wo}?`,
      description: `Anda akan menghapus data batch ${woItem.produk} untuk klien ${woItem.klien}. Tindakan ini tidak dapat dibatalkan.`,
      consequences: ["Alokasi stok bahan baku akan dikembalikan.", "Riwayat audit akan diarsipkan.", "Jadwal mesin akan dikosongkan."],
      confirmLabel: "Ya, Hapus Dokumen",
      cancelLabel: "Batal",
      requiresReason: true,
      reasonPlaceholder: "Contoh: Salah nomor batch formulasi...",
      onConfirm: (reason) => {
        setWorkOrders((prev) => prev.filter((item) => item.id !== woItem.id));
        if (inspectingWo?.id === woItem.id) setInspectingWo(null);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        showToast(`Work Order ${woItem.wo} berhasil dihapus.`, "info");
      },
    });
  };

  const handleOpenEditModal = (wo: WorkOrder) => {
    setOriginalWo({ ...wo });
    setEditingWo({ ...wo });
  };

  const getDirtyFields = () => {
    if (!editingWo || !originalWo) return [];
    const dirty: string[] = [];
    if (editingWo.produk !== originalWo.produk) dirty.push("produk");
    if (editingWo.klien !== originalWo.klien) dirty.push("klien");
    if (editingWo.stage !== originalWo.stage) dirty.push("stage");
    if (editingWo.target !== originalWo.target) dirty.push("target");
    if (editingWo.hpp !== originalWo.hpp) dirty.push("hpp");
    if (editingWo.progressPercent !== originalWo.progressPercent) dirty.push("progress");
    if (editingWo.notes !== originalWo.notes) dirty.push("notes");
    return dirty;
  };

  const dirtyFields = getDirtyFields();

  const handleSaveEditedWo = () => {
    if (!editingWo || !originalWo) return;
    const isTargetChanged = editingWo.target !== originalWo.target;
    const isHppChanged = editingWo.hpp !== originalWo.hpp;
    if (isTargetChanged || isHppChanged) {
      setConfirmDialog({
        isOpen: true,
        variant: "warning",
        title: "Konfirmasi Perubahan Finansial & Target",
        description: `Terdapat perubahan nilai krusial pada Work Order ${editingWo.wo}:`,
        consequences: [
          isTargetChanged ? `Target: ${originalWo.target.toLocaleString("id-ID")} → ${editingWo.target.toLocaleString("id-ID")} Pcs` : "",
          isHppChanged ? `HPP Satuan: Rp ${originalWo.hpp.toLocaleString("id-ID")} → Rp ${editingWo.hpp.toLocaleString("id-ID")}` : "",
        ].filter(Boolean),
        confirmLabel: "Setujui & Simpan Perubahan",
        cancelLabel: "Periksa Kembali",
        onConfirm: () => {
          setWorkOrders((prev) => prev.map((item) => (item.id === editingWo.id ? editingWo : item)));
          setEditingWo(null);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          showToast(`Perubahan pada ${editingWo.wo} berhasil disimpan.`, "success");
        },
      });
    } else {
      setWorkOrders((prev) => prev.map((item) => (item.id === editingWo.id ? editingWo : item)));
      setEditingWo(null);
      showToast(`Work Order ${editingWo.wo} berhasil diperbarui.`, "success");
    }
  };

  const handleCreateNewWo = () => {
    const newWoItem: WorkOrder = {
      id: String(Date.now()),
      wo: `WO-${new Date().getFullYear().toString().slice(-2)}08-0${workOrders.length + 1}`,
      refPo: `PO-2026-0${workOrders.length + 91}`,
      produk: `${newBrandName} Special Formula`,
      klien: newClient.name,
      category: newCategory,
      stage: "Pending Review",
      progressPercent: 0,
      progressColor: "bg-slate-400",
      pic: "Budi Santoso",
      picInitial: "B",
      target: newTarget,
      hpp: newHpp,
      totalNilai: calculatedNilai,
      updatedAt: `${new Date().toLocaleDateString("id-ID")} ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`,
      line: "Line A — Main Packaging",
      notes: newNotes,
    };
    setWorkOrders((prev) => [newWoItem, ...prev]);
    setIsCreateModalOpen(false);
    showToast(`Work Order ${newWoItem.wo} berhasil diterbitkan!`, "success");
  };

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
          { key: "OMSET", title: "TOTAL OMSET", value: "Rp 278,75 Jt", deltaText: "+14% vs minggu lalu", isDeltaPositive: true, icon: "$", iconBg: "bg-blue-50", iconColor: "text-blue-600", isSelected: selectedKpiFilter === "OMSET", onClick: () => setSelectedKpiFilter(selectedKpiFilter === "OMSET" ? null : "OMSET") },
          { key: "APPROVED", title: "SAMPLE APPROVED", value: "148 Batch", deltaText: "+9.2% vs target", isDeltaPositive: true, icon: <CheckCircle2 className="w-4 h-4" />, iconBg: "bg-emerald-50", iconColor: "text-emerald-600", isSelected: selectedKpiFilter === "APPROVED", onClick: () => setSelectedKpiFilter(selectedKpiFilter === "APPROVED" ? null : "APPROVED") },
          { key: "PENDING", title: "PENDING REVIEW", value: "12 Formulasi", deltaText: "3 butuh revisi", isDeltaPositive: false, icon: <AlertTriangle className="w-4 h-4" />, iconBg: "bg-amber-50", iconColor: "text-amber-600", isSelected: selectedKpiFilter === "PENDING", onClick: () => setSelectedKpiFilter(selectedKpiFilter === "PENDING" ? null : "PENDING") },
          { key: "EFFICIENCY", title: "RATA-RATA EFISIENSI", value: "94.2%", deltaText: "+2.1% dari kuartal lalu", isDeltaPositive: true, icon: <Sparkles className="w-4 h-4" />, iconBg: "bg-sky-50", iconColor: "text-sky-600", isSelected: selectedKpiFilter === "EFFICIENCY", onClick: () => setSelectedKpiFilter(selectedKpiFilter === "EFFICIENCY" ? null : "EFFICIENCY") },
        ]}
      />

      <DnaDataTableCard
        toolbarProps={{
          searchQuery,
          onSearchChange: setSearchQuery,
          searchPlaceholder: "Cari WO / Produk / Klien...",
          filterColumns: [
            { key: "stage", label: "Stage (Status)", type: "select", options: ["Finished Goods", "Mixing", "Waiting Material", "Pending Review"] },
            { key: "klien", label: "Klien", type: "select", options: uniqueClients },
            { key: "produk", label: "Produk", type: "sort_alpha" },
            { key: "pic", label: "PIC Produksi", type: "select", options: uniquePics },
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
        <table className="w-full text-left border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider">
              <th className="p-3.5 w-10 text-center"><DnaCheckbox checked={selectedRowIds.length === filteredAndSortedData.length && filteredAndSortedData.length > 0} onChange={toggleSelectAll} /></th>
              <th className="p-3.5 w-10 text-slate-400">#</th>
              <th className="p-3.5 cursor-pointer hover:bg-slate-100/60" onClick={() => handleHeaderSortToggle("wo")}>WO #</th>
              <th className="p-3.5">REF. PO</th>
              <th className="p-3.5 cursor-pointer hover:bg-slate-100/60" onClick={() => handleHeaderSortToggle("produk")}>PRODUK</th>
              <th className="p-3.5 cursor-pointer hover:bg-slate-100/60" onClick={() => handleHeaderSortToggle("klien")}>KLIEN</th>
              <th className="p-3.5">STAGE</th>
              <th className="p-3.5">PROGRESS</th>
              <th className="p-3.5">PIC</th>
              <th className="p-3.5 text-right">TARGET (PCS)</th>
              <th className="p-3.5 text-right">NILAI (RP)</th>
              <th className="p-3.5">CATATAN</th>
              <th className="p-3.5 text-center">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAndSortedData.map((wo, index) => (
              <tr key={wo.id} className="hover:bg-slate-50/80">
                <td className="p-3.5 text-center"><DnaCheckbox checked={selectedRowIds.includes(wo.id)} onChange={() => toggleSelectRow(wo.id)} /></td>
                <td className="p-3.5 text-slate-400 tabular-nums">{index + 1}</td>
                <td className="p-3.5"><DnaCell.Code value={wo.wo} onClick={() => setInspectingWo(wo)} /></td>
                <td className="p-3.5 font-mono text-slate-400">{wo.refPo}</td>
                <td className="p-3.5"><DnaCell.Text primary={wo.produk} /></td>
                <td className="p-3.5"><DnaCell.Text primary={wo.klien} /></td>
                <td className="p-3.5"><DnaCell.Badge status={wo.stage} /></td>
                <td className="p-3.5"><DnaCell.Progress value={wo.progressPercent} colorClass={wo.progressColor} /></td>
                <td className="p-3.5"><DnaCell.Avatar name={wo.pic} initial={wo.picInitial} avatarBg="bg-blue-50 text-blue-700" /></td>
                <td className="p-3.5 text-right"><DnaCell.Number value={wo.target} /></td>
                <td className="p-3.5 text-right"><DnaCell.Currency value={wo.totalNilai} /></td>
                <td className="p-3.5 text-slate-500 break-words max-w-[150px]">{wo.notes}</td>
                <td className="p-3.5 text-center">
                  <div className="flex gap-1 justify-center">
                    <button onClick={() => setInspectingWo(wo)} className="p-1.5 text-slate-400 hover:text-blue-600"><FileText className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleOpenEditModal(wo)} className="p-1.5 text-slate-400 hover:text-amber-600"><Edit3 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => requestDeleteWo(wo)} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
                    <span className="font-mono text-[12px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                      {inspectingWo.wo}
                    </span>
                    <DnaCell.Badge status={inspectingWo.stage} />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Ref. PO: <span className="font-mono text-slate-700 font-semibold">{inspectingWo.refPo}</span> • Lini: {inspectingWo.line}
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
                  <span className="font-bold text-slate-900 text-[15px] font-mono tabular-nums">
                    {inspectingWo.target.toLocaleString("id-ID")} Pcs
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">HPP Satuan</span>
                  <span className="font-bold text-slate-900 text-[15px] font-mono tabular-nums">
                    Rp {inspectingWo.hpp.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <span className="text-[10px] uppercase font-bold text-blue-600 block tracking-wider">Total Nilai WO</span>
                  <span className="font-bold text-blue-700 text-[15px] font-mono tabular-nums">
                    Rp {inspectingWo.totalNilai.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Progres Batch</span>
                  <span className="font-bold text-slate-900 text-[15px] font-mono tabular-nums">
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
                      {inspectingWo.category}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Klien / Brand Owner</span>
                    <span className="font-bold text-slate-900 text-[14px]">{inspectingWo.klien}</span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">PIC: {inspectingWo.pic}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-600" /> Tahapan Produksi & Quality Control
                  </span>
                  <span className="font-semibold text-slate-600 font-mono">{inspectingWo.progressPercent}% Selesai</span>
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
                <div className="pt-2 text-[10px] text-slate-400 font-mono">
                  Timestamp: {inspectingWo.updatedAt} • Operator: {inspectingWo.pic}
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
                  <div className="flex items-center gap-2"><h3 className="font-bold text-slate-900 text-[15px]">Buat Work Order Baru</h3><span className="px-2 py-0.5 rounded-md bg-blue-100/70 text-blue-700 font-mono text-[10px] font-bold">DRAFT</span></div>
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
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Klien <span className="text-rose-500">*</span></label>
                    <div onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)} className="w-full min-h-[38px] px-3 py-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl cursor-pointer flex items-center justify-between">
                      <div><div className="font-bold text-slate-900">{newClient.name}</div></div>
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nama Produk <span className="text-rose-500">*</span></label>
                    <input type="text" value={newBrandName} onChange={(e) => setNewBrandName(e.target.value)} className="w-full h-9.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:border-blue-500" />
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <h4 className="font-bold text-slate-800 text-[12px] uppercase tracking-wider flex items-center gap-1.5"><Boxes className="w-3.5 h-3.5 text-blue-600" /> Parameter Produksi</h4>
                </div>
                <div className={cn("grid gap-3.5", modalSize === "sm" ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3")}>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Target Batch (Pcs)</label>
                    <input type="number" value={newTarget} onChange={(e) => setNewTarget(Number(e.target.value))} className="w-full h-9.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-mono font-bold" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">HPP Satuan (Rp)</label>
                    <input type="number" value={newHpp} onChange={(e) => setNewHpp(Number(e.target.value))} className="w-full h-9.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-mono font-bold" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Total Nilai</label>
                    <div className="h-9.5 px-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center font-mono font-bold text-blue-700">Rp {calculatedNilai.toLocaleString("id-ID")}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0 gap-3">
              <button onClick={() => setIsCreateModalOpen(false)} className="h-9 px-4 bg-white border border-slate-200 rounded-xl text-[12px] font-semibold">Batal</button>
              <button onClick={handleCreateNewWo} className="h-9 px-5 bg-blue-600 text-white rounded-xl text-[12px] font-semibold border-none">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {editingWo && originalWo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-3 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150" style={{ maxHeight: "88vh" }}>
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center"><Edit3 className="w-5 h-5" /></div>
                <div><h3 className="font-bold text-slate-900 text-[15px]">Ubah Data WO</h3><span className="font-mono text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">{editingWo.wo}</span></div>
              </div>
              <button onClick={() => setEditingWo(null)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 text-[12px] custom-scrollbar flex-1">
              <div>
                <label className="text-[11px] font-semibold text-slate-700">Nama Produk Formula</label>
                <input type="text" value={editingWo.produk} onChange={(e) => setEditingWo({ ...editingWo, produk: e.target.value })} className="w-full h-9.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Klien</label>
                  <input type="text" value={editingWo.klien} onChange={(e) => setEditingWo({ ...editingWo, klien: e.target.value })} className="w-full h-9.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px]" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Stage</label>
                  <select
                    value={editingWo.stage}
                    onChange={(e) => setEditingWo({ ...editingWo, stage: e.target.value as any })}
                    className="w-full h-9.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-medium"
                  >
                    <option value="Finished Goods">Finished Goods</option>
                    <option value="Mixing">Mixing</option>
                    <option value="Waiting Material">Waiting Material</option>
                    <option value="Pending Review">Pending Review</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Target (Pcs)</label>
                  <input
                    type="number"
                    value={editingWo.target}
                    onChange={(e) =>
                      setEditingWo({
                        ...editingWo,
                        target: Number(e.target.value),
                        totalNilai: Number(e.target.value) * editingWo.hpp,
                      })
                    }
                    className="w-full h-9.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-mono font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">HPP Satuan (Rp)</label>
                  <input
                    type="number"
                    value={editingWo.hpp}
                    onChange={(e) =>
                      setEditingWo({
                        ...editingWo,
                        hpp: Number(e.target.value),
                        totalNilai: editingWo.target * Number(e.target.value),
                      })
                    }
                    className="w-full h-9.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-mono font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Progres (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingWo.progressPercent}
                    onChange={(e) =>
                      setEditingWo({
                        ...editingWo,
                        progressPercent: Number(e.target.value),
                      })
                    }
                    className="w-full h-9.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-mono font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Total Nilai Preview */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <span className="text-[11px] text-slate-600 font-semibold">Total Nilai WO Hasil Kalkulasi:</span>
                <span className="font-mono font-bold text-blue-700 text-[13px] tabular-nums">
                  Rp {editingWo.totalNilai.toLocaleString("id-ID")}
                </span>
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Catatan Produksi</label>
                <textarea
                  rows={2}
                  value={editingWo.notes}
                  onChange={(e) => setEditingWo({ ...editingWo, notes: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* 3. DOCKED STICKY FOOTER */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-500">
                {dirtyFields.length === 0 ? "Tidak ada perubahan" : `${dirtyFields.length} field akan di-commit`}
              </span>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingWo(null)}
                  className="h-9 px-4 bg-white border border-slate-200 text-slate-700 rounded-xl text-[12px] font-semibold hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedWo}
                  disabled={dirtyFields.length === 0}
                  className={cn(
                    "h-9 px-5 rounded-xl text-[12px] font-semibold border-none transition-all shadow-2xs",
                    dirtyFields.length === 0
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                  )}
                >
                  Simpan Perubahan
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

