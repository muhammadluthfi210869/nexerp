"use client";

import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaDateMode,
  DnaCell,
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

export default function GoldenReferencePage() {
  // Main Data State
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(INITIAL_WORK_ORDERS);

  // Tabs & Global Search States
  const [activeTab, setActiveTab] = useState<"WORK_ORDERS" | "ANALYTICS">("WORK_ORDERS");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKpiFilter, setSelectedKpiFilter] = useState<string | null>(null);

  // 2-Level Filter Toolbar States
  const [selectedFilterColumn, setSelectedFilterColumn] = useState<FilterColumnType>("stage");
  const [filterColumnValue, setFilterColumnValue] = useState<string>("ALL");

  // Date Range Mode & Custom Range (From Date to Date) States
  const [dateMode, setDateMode] = useState<DnaDateMode>("1_MONTH");
  const [startDate, setStartDate] = useState<string>("2026-08-02");
  const [endDate, setEndDate] = useState<string>("2026-09-10");

  // Table Sorter States
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Checkbox Selection
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  // Interactive UI State Demo State
  const [showStateDemo, setShowStateDemo] = useState<"NONE" | "EMPTY" | "LOADING" | "ERROR">("NONE");

  // Inspection Drawer State
  const [inspectingWo, setInspectingWo] = useState<WorkOrder | null>(null);

  // Create WO Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("PT Aurora Beauty");
  const [newBrandName, setNewBrandName] = useState("Aurora Glow");
  const [newContact, setNewContact] = useState("08123456789");
  const [newMoq, setNewMoq] = useState<number>(1000);
  const [newHpp, setNewHpp] = useState<number>(150000);
  const calculatedNilai = newMoq * newHpp;

  // Edit WO Modal State (CRUD)
  const [editingWo, setEditingWo] = useState<WorkOrder | null>(null);

  // Unique lists for categorization
  const uniqueClients = useMemo(() => {
    return Array.from(new Set(workOrders.map((item) => item.klien)));
  }, [workOrders]);

  const uniquePics = useMemo(() => {
    return Array.from(new Set(workOrders.map((item) => item.pic)));
  }, [workOrders]);

  // Helper date parser
  const parseItemDate = (dateStr: string): Date | null => {
    try {
      const parts = dateStr.split(" ");
      const dmy = parts[0].split("/");
      if (dmy.length === 3) {
        return new Date(Number(dmy[2]), Number(dmy[1]) - 1, Number(dmy[0]));
      }
    } catch {
      return null;
    }
    return null;
  };

  // Filter & Sorter Pipeline
  const filteredAndSortedData = useMemo(() => {
    return workOrders
      .filter((item) => {
        // 1. KPI Card Filter
        if (selectedKpiFilter === "OMSET") {
          if (item.stage !== "Finished Goods") return false;
        } else if (selectedKpiFilter === "APPROVED") {
          if (item.stage !== "Finished Goods") return false;
        } else if (selectedKpiFilter === "PENDING") {
          if (item.stage !== "Pending Review") return false;
        } else if (selectedKpiFilter === "EFFICIENCY") {
          if (item.progressPercent < 50) return false;
        }

        // 2. Global Search
        if (searchQuery.trim() !== "") {
          const q = searchQuery.toLowerCase();
          const matchWo = item.wo.toLowerCase().includes(q);
          const matchProduk = item.produk.toLowerCase().includes(q);
          const matchKlien = item.klien.toLowerCase().includes(q);
          const matchPic = item.pic.toLowerCase().includes(q);
          if (!matchWo && !matchProduk && !matchKlien && !matchPic) return false;
        }

        // 3. 2-Level Column & Value Filter
        if (filterColumnValue !== "ALL") {
          if (selectedFilterColumn === "stage" && item.stage !== filterColumnValue) return false;
          if (selectedFilterColumn === "klien" && item.klien !== filterColumnValue) return false;
          if (selectedFilterColumn === "pic" && item.pic !== filterColumnValue) return false;
        }

        // 4. Date Filter
        if (dateMode !== "ALL") {
          const itemDate = parseItemDate(item.updatedAt);
          if (itemDate) {
            if (dateMode === "CUSTOM" && startDate && endDate) {
              const start = new Date(startDate);
              const end = new Date(endDate);
              end.setHours(23, 59, 59, 999);
              if (itemDate < start || itemDate > end) return false;
            } else {
              const anchorDate = new Date(2026, 7, 25); // 25 Aug 2026
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
        // Handle sorting from 2-Level Filter Pill
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

        // Handle Header Click Sorting
        if (!sortColumn) return 0;
        const dir = sortDirection === "asc" ? 1 : -1;

        switch (sortColumn) {
          case "wo":
            return dir * a.wo.localeCompare(b.wo);
          case "produk":
            return dir * a.produk.localeCompare(b.produk);
          case "klien":
            return dir * a.klien.localeCompare(b.klien);
          case "stage":
            return dir * a.stage.localeCompare(b.stage);
          case "pic":
            return dir * a.pic.localeCompare(b.pic);
          case "target":
            return dir * (a.target - b.target);
          case "totalNilai":
            return dir * (a.totalNilai - b.totalNilai);
          case "updatedAt":
            return dir * a.updatedAt.localeCompare(b.updatedAt);
          default:
            return 0;
        }
      });
  }, [
    workOrders,
    selectedKpiFilter,
    searchQuery,
    selectedFilterColumn,
    filterColumnValue,
    dateMode,
    startDate,
    endDate,
    sortColumn,
    sortDirection,
  ]);

  // Header sort toggle handler
  const handleHeaderSortToggle = (colKey: string) => {
    if (sortColumn === colKey) {
      if (sortDirection === "asc") setSortDirection("desc");
      else {
        setSortColumn(null);
        setSortDirection("asc");
      }
    } else {
      setSortColumn(colKey);
      setSortDirection("asc");
    }
  };

  // Row selection handler
  const toggleSelectAll = () => {
    if (selectedRowIds.length === filteredAndSortedData.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(filteredAndSortedData.map((item) => item.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedRowIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // CRUD Operations
  const handleDeleteWo = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus Work Order ini?")) {
      setWorkOrders((prev) => prev.filter((item) => item.id !== id));
      if (inspectingWo?.id === id) setInspectingWo(null);
    }
  };

  const handleOpenEditModal = (wo: WorkOrder) => {
    setEditingWo({ ...wo });
  };

  const handleSaveEditedWo = () => {
    if (!editingWo) return;
    setWorkOrders((prev) =>
      prev.map((item) => (item.id === editingWo.id ? editingWo : item))
    );
    setEditingWo(null);
  };

  const handleCreateNewWo = () => {
    const newWoItem: WorkOrder = {
      id: String(Date.now()),
      wo: `WO-${new Date().getFullYear().toString().slice(-2)}08-0${workOrders.length + 1}`,
      refPo: "-",
      produk: `${newBrandName} Special Formula`,
      klien: newClientName,
      category: "Skincare",
      stage: "Pending Review",
      progressPercent: 0,
      progressColor: "bg-slate-400",
      pic: "Budi Santoso",
      picInitial: "B",
      target: newMoq,
      hpp: newHpp,
      totalNilai: calculatedNilai,
      updatedAt: `${new Date().toLocaleDateString("id-ID")} ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`,
      line: "Line A — Main Packaging",
      notes: "Work order baru terdaftar.",
    };
    setWorkOrders((prev) => [newWoItem, ...prev]);
    setIsCreateModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-20 text-slate-900 bg-[#F8FAFC] min-h-screen">
      {/* ── 01. MODULAR PAGE HEADER ── */}
      <DnaPageHeader
        backLink={{ href: "/dna-visual", label: "Kembali ke Visual DNA Specs" }}
        title="WORK ORDERS & PRODUCTION"
        tabs={[
          {
            key: "WORK_ORDERS",
            label: "Work Orders",
            count: workOrders.length,
            icon: <FileText className="w-3.5 h-3.5" />,
          },
          {
            key: "ANALYTICS",
            label: "Analytics",
            icon: <BarChart3 className="w-3.5 h-3.5" />,
          },
        ]}
        activeTab={activeTab}
        onTabChange={(k) => setActiveTab(k as "WORK_ORDERS" | "ANALYTICS")}
      />

      {/* ── 02. MODULAR 4 KPI METRIC CARDS ── */}
      <DnaKpiGrid
        cards={[
          {
            key: "OMSET",
            title: "TOTAL OMSET",
            value: "Rp 278,75 Jt",
            deltaText: "+14% vs minggu lalu",
            isDeltaPositive: true,
            icon: "$",
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
            isSelected: selectedKpiFilter === "OMSET",
            onClick: () => setSelectedKpiFilter(selectedKpiFilter === "OMSET" ? null : "OMSET"),
          },
          {
            key: "APPROVED",
            title: "SAMPLE APPROVED",
            value: "148 Batch",
            deltaText: "+9.2% vs target",
            isDeltaPositive: true,
            icon: <CheckCircle2 className="w-4 h-4" />,
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-600",
            isSelected: selectedKpiFilter === "APPROVED",
            onClick: () => setSelectedKpiFilter(selectedKpiFilter === "APPROVED" ? null : "APPROVED"),
          },
          {
            key: "PENDING",
            title: "PENDING REVIEW",
            value: "12 Formulasi",
            deltaText: "3 butuh revisi",
            isDeltaPositive: false,
            icon: <AlertTriangle className="w-4 h-4" />,
            iconBg: "bg-amber-50",
            iconColor: "text-amber-600",
            isSelected: selectedKpiFilter === "PENDING",
            onClick: () => setSelectedKpiFilter(selectedKpiFilter === "PENDING" ? null : "PENDING"),
          },
          {
            key: "EFFICIENCY",
            title: "RATA-RATA EFISIENSI",
            value: "94.2%",
            deltaText: "+2.1% dari kuartal lalu",
            isDeltaPositive: true,
            icon: <Sparkles className="w-4 h-4" />,
            iconBg: "bg-sky-50",
            iconColor: "text-sky-600",
            isSelected: selectedKpiFilter === "EFFICIENCY",
            onClick: () => setSelectedKpiFilter(selectedKpiFilter === "EFFICIENCY" ? null : "EFFICIENCY"),
          },
        ]}
      />

      {/* ── 03. INTERACTIVE STATE DEMO SELECTOR (Preview states) ── */}
      <div className="flex items-center gap-2 text-[12px] text-slate-500 bg-white border border-slate-200/90 rounded-xl p-2.5 shadow-2xs">
        <SlidersHorizontal className="w-4 h-4 text-blue-600 shrink-0" />
        <span className="font-semibold text-slate-700">Preview State Tabel:</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(["NONE", "EMPTY", "LOADING", "ERROR"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setShowStateDemo(mode)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer",
                showStateDemo === mode
                  ? "bg-blue-50 text-blue-700 border-blue-300"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              )}
            >
              {mode === "NONE" && "Normal (Live Data)"}
              {mode === "EMPTY" && "Empty State"}
              {mode === "LOADING" && "Loading State"}
              {mode === "ERROR" && "Error State"}
            </button>
          ))}
        </div>
      </div>

      {/* ── 04. MODULAR DATA TABLE CARD (Toolbar + Table + Pagination) ── */}
      <DnaDataTableCard
        toolbarProps={{
          searchQuery,
          onSearchChange: setSearchQuery,
          searchPlaceholder: "Cari WO / Produk / Klien...",
          filterColumns: [
            {
              key: "stage",
              label: "Stage (Status)",
              type: "select",
              options: ["Finished Goods", "Mixing", "Waiting Material", "Pending Review"],
            },
            {
              key: "klien",
              label: "Klien",
              type: "select",
              options: uniqueClients,
            },
            {
              key: "produk",
              label: "Produk",
              type: "sort_alpha",
            },
            {
              key: "pic",
              label: "PIC Produksi",
              type: "select",
              options: uniquePics,
            },
            {
              key: "target",
              label: "Target (Pcs)",
              type: "sort_numeric",
            },
            {
              key: "totalNilai",
              label: "Nilai (Rp)",
              type: "sort_numeric",
            },
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
          actionButton: {
            label: "Tambah Work Order",
            onClick: () => setIsCreateModalOpen(true),
          },
        }}
        paginationProps={{
          currentPage: 1,
          totalPages: 1,
          totalEntries: filteredAndSortedData.length,
          pageSize: 10,
          onPageChange: () => {},
        }}
      >
        {showStateDemo === "LOADING" ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div key={idx} className="h-10 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : showStateDemo === "ERROR" ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <p className="font-bold text-slate-800 text-[14px]">Gagal Memuat Data Work Order</p>
            <p className="text-slate-500 text-[12px] max-w-md mx-auto">
              Terjadi kendala saat menyinkronkan data dengan ERP Core. Silakan coba muat ulang.
            </p>
            <button
              onClick={() => setShowStateDemo("NONE")}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[12px] font-semibold border-none cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider select-none">
                {/* Select All Checkbox */}
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredAndSortedData.length > 0 &&
                      selectedRowIds.length === filteredAndSortedData.length
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>

                {/* # */}
                <th className="p-3.5 w-10 text-slate-400">#</th>

                {/* WO ↕ */}
                <th
                  className="p-3.5 cursor-pointer hover:bg-slate-100/60 min-w-[120px]"
                  onClick={() => handleHeaderSortToggle("wo")}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>WO #</span>
                    {sortColumn === "wo" ? (
                      sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>

                {/* REF. PO */}
                <th className="p-3.5 min-w-[110px]">REF. PO</th>

                {/* PRODUK ↕ */}
                <th
                  className="p-3.5 cursor-pointer hover:bg-slate-100/60 min-w-[190px]"
                  onClick={() => handleHeaderSortToggle("produk")}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>PRODUK</span>
                    {sortColumn === "produk" ? (
                      sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>

                {/* KLIEN ↕ */}
                <th
                  className="p-3.5 cursor-pointer hover:bg-slate-100/60 min-w-[130px]"
                  onClick={() => handleHeaderSortToggle("klien")}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>KLIEN</span>
                    {sortColumn === "klien" ? (
                      sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>

                {/* STAGE ↕ */}
                <th
                  className="p-3.5 cursor-pointer hover:bg-slate-100/60 min-w-[110px]"
                  onClick={() => handleHeaderSortToggle("stage")}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>STAGE</span>
                    {sortColumn === "stage" ? (
                      sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>

                {/* PROGRESS BATCH */}
                <th className="p-3.5 min-w-[120px]">PROGRESS BATCH</th>

                {/* PIC ↕ */}
                <th
                  className="p-3.5 cursor-pointer hover:bg-slate-100/60 min-w-[120px]"
                  onClick={() => handleHeaderSortToggle("pic")}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>PIC</span>
                    {sortColumn === "pic" ? (
                      sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>

                {/* TARGET (PCS) */}
                <th
                  className="p-3.5 text-right cursor-pointer hover:bg-slate-100/60 whitespace-nowrap"
                  onClick={() => handleHeaderSortToggle("target")}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>TARGET (PCS)</span>
                    {sortColumn === "target" ? (
                      sortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                </th>

                {/* NILAI (RP) */}
                <th
                  className="p-3.5 text-right cursor-pointer hover:bg-slate-100/60 whitespace-nowrap min-w-[130px]"
                  onClick={() => handleHeaderSortToggle("totalNilai")}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>NILAI (RP)</span>
                    {sortColumn === "totalNilai" ? (
                      sortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                </th>

                {/* UPDATED AT */}
                <th
                  className="p-3.5 cursor-pointer hover:bg-slate-100/60 whitespace-nowrap"
                  onClick={() => handleHeaderSortToggle("updatedAt")}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span>UPDATED AT</span>
                    {sortColumn === "updatedAt" ? (
                      sortDirection === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                </th>

                {/* CATATAN */}
                <th className="p-3.5 font-bold min-w-[140px]">CATATAN</th>

                {/* AKSI */}
                <th className="p-3.5 text-center font-bold w-20 whitespace-nowrap">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {showStateDemo === "EMPTY" || filteredAndSortedData.length === 0 ? (
                <tr>
                  <td colSpan={14} className="p-10 text-center text-slate-400">
                    Tidak ada Work Order yang sesuai dengan kriteria filter saat ini.
                  </td>
                </tr>
              ) : (
                filteredAndSortedData.map((wo, index) => {
                  const isSelected = selectedRowIds.includes(wo.id);
                  return (
                    <tr
                      key={wo.id}
                      className={cn(
                        "hover:bg-slate-50/80 transition-colors group",
                        isSelected && "bg-blue-50/30"
                      )}
                    >
                      {/* Checkbox */}
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(wo.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* # */}
                      <td className="p-3.5 text-slate-400 tabular-nums">{index + 1}</td>

                      {/* WO # (DnaCell.Code) */}
                      <td className="p-3.5 whitespace-nowrap">
                        <DnaCell.Code
                          value={wo.wo}
                          onClick={() => setInspectingWo(wo)}
                        />
                      </td>

                      {/* REF. PO */}
                      <td className="p-3.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {wo.refPo}
                      </td>

                      {/* PRODUK (DnaCell.Text - wraps downwards naturally, no dots) */}
                      <td className="p-3.5">
                        <DnaCell.Text primary={wo.produk} />
                      </td>

                      {/* KLIEN (DnaCell.Text - wraps downwards naturally) */}
                      <td className="p-3.5">
                        <DnaCell.Text primary={wo.klien} />
                      </td>

                      {/* STAGE (DnaCell.Badge - Soft Pill, Title Case, No Underscore) */}
                      <td className="p-3.5 whitespace-nowrap">
                        <DnaCell.Badge status={wo.stage} />
                      </td>

                      {/* PROGRESS BATCH (DnaCell.Progress - Bar and % only) */}
                      <td className="p-3.5 whitespace-nowrap">
                        <DnaCell.Progress
                          value={wo.progressPercent}
                          colorClass={wo.progressColor}
                        />
                      </td>

                      {/* PIC (DnaCell.Avatar) */}
                      <td className="p-3.5 whitespace-nowrap">
                        <DnaCell.Avatar
                          name={wo.pic}
                          initial={wo.picInitial}
                          avatarBg="bg-blue-50 text-blue-700"
                        />
                      </td>

                      {/* TARGET (DnaCell.Number - tabular-nums text-right) */}
                      <td className="p-3.5">
                        <DnaCell.Number value={wo.target} />
                      </td>

                      {/* NILAI (DnaCell.Currency - Guaranteed 1 single line) */}
                      <td className="p-3.5">
                        <DnaCell.Currency value={wo.totalNilai} />
                      </td>

                      {/* UPDATED AT (DnaCell.Date) */}
                      <td className="p-3.5">
                        <DnaCell.Date value={wo.updatedAt} />
                      </td>

                      {/* CATATAN */}
                      <td className="p-3.5 text-slate-500 break-words whitespace-normal max-w-[180px] text-[11px] leading-snug">
                        {wo.notes}
                      </td>

                      {/* AKSI (DnaCell.Actions - CRUD View, Edit, Delete) */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <DnaCell.Actions
                          onView={() => setInspectingWo(wo)}
                          onEdit={() => handleOpenEditModal(wo)}
                          onDelete={() => handleDeleteWo(wo.id)}
                          viewTitle="Lihat Detail Inspeksi"
                          editTitle="Edit Work Order"
                          deleteTitle="Hapus Work Order"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </DnaDataTableCard>

      {/* ── 05. INSPECTION DRAWER (VIEW) ── */}
      {inspectingWo && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-2xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-600 text-[14px]">
                    {inspectingWo.wo}
                  </span>
                  <DnaCell.Badge status={inspectingWo.stage} />
                </div>
                <button
                  onClick={() => setInspectingWo(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 border-none bg-transparent cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-5 space-y-4 text-[12px]">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Produk & Klien
                  </label>
                  <p className="font-bold text-slate-900 text-[14px] mt-0.5">
                    {inspectingWo.produk}
                  </p>
                  <p className="text-slate-600">{inspectingWo.klien}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Target Produksi</span>
                    <span className="font-bold text-slate-800 text-[13px] tabular-nums">
                      {inspectingWo.target.toLocaleString("id-ID")} Pcs
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Total Nilai WO</span>
                    <span className="font-bold text-blue-600 text-[13px] tabular-nums">
                      Rp {inspectingWo.totalNilai.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Progres Produksi
                  </label>
                  <div className="mt-1.5">
                    <DnaCell.Progress
                      value={inspectingWo.progressPercent}
                      colorClass={inspectingWo.progressColor}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    PIC Penanggung Jawab
                  </label>
                  <div className="mt-1.5">
                    <DnaCell.Avatar
                      name={inspectingWo.pic}
                      initial={inspectingWo.picInitial}
                      avatarBg="bg-blue-50 text-blue-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Catatan Produksi
                  </label>
                  <p className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 mt-1 leading-relaxed">
                    {inspectingWo.notes}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  handleOpenEditModal(inspectingWo);
                }}
                className="flex-1 h-9 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-xl text-[12px] border-none cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" /> Ubah Data
              </button>
              <button
                onClick={() => setInspectingWo(null)}
                className="h-9 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-[12px] border-none cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 06. EDIT WO MODAL (CRUD EDIT) ── */}
      {editingWo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-[15px]">Ubah Data Work Order</h3>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">{editingWo.wo}</p>
              </div>
              <button
                onClick={() => setEditingWo(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 border-none bg-transparent cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-[12px]">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nama Produk</label>
                <input
                  type="text"
                  value={editingWo.produk}
                  onChange={(e) => setEditingWo({ ...editingWo, produk: e.target.value })}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Klien</label>
                  <input
                    type="text"
                    value={editingWo.klien}
                    onChange={(e) => setEditingWo({ ...editingWo, klien: e.target.value })}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Stage</label>
                  <select
                    value={editingWo.stage}
                    onChange={(e) => setEditingWo({ ...editingWo, stage: e.target.value as any })}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="Finished Goods">Finished Goods</option>
                    <option value="Mixing">Mixing</option>
                    <option value="Waiting Material">Waiting Material</option>
                    <option value="Pending Review">Pending Review</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Target (Pcs)</label>
                  <input
                    type="number"
                    value={editingWo.target}
                    onChange={(e) => {
                      const t = Number(e.target.value);
                      setEditingWo({
                        ...editingWo,
                        target: t,
                        totalNilai: t * editingWo.hpp,
                      });
                    }}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:border-blue-500 focus:bg-white"
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
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Catatan</label>
                <textarea
                  rows={2}
                  value={editingWo.notes}
                  onChange={(e) => setEditingWo({ ...editingWo, notes: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingWo(null)}
                className="h-9 px-4 bg-white border border-slate-200 text-slate-700 rounded-xl text-[12px] font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEditedWo}
                className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[12px] font-semibold border-none cursor-pointer shadow-2xs"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 07. CREATE WO MODAL ── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-[15px]">Buat Work Order Baru</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Daftarkan batch produksi baru ke sistem</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 border-none bg-transparent cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-[12px]">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nama Brand / Produk</label>
                <input
                  type="text"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nama Perusahaan / Klien</label>
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Target MOQ (Pcs)</label>
                  <input
                    type="number"
                    value={newMoq}
                    onChange={(e) => setNewMoq(Number(e.target.value))}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">HPP per Unit (Rp)</label>
                  <input
                    type="number"
                    value={newHpp}
                    onChange={(e) => setNewHpp(Number(e.target.value))}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between">
                <span className="font-semibold text-blue-900 text-[11px]">Total Nilai Estimasi:</span>
                <span className="font-black text-blue-700 text-[13px] tabular-nums">
                  Rp {calculatedNilai.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="h-9 px-4 bg-white border border-slate-200 text-slate-700 rounded-xl text-[12px] font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCreateNewWo}
                className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[12px] font-semibold border-none cursor-pointer shadow-2xs"
              >
                Simpan & Terbitkan WO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
