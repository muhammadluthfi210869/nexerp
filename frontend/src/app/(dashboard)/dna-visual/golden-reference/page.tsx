"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertCircle,
  X,
  ArrowLeft,
  FileText,
  FlaskConical,
  Droplet,
  Package,
  History,
  BarChart3,
  Sparkles,
  MoreHorizontal,
  Download,
  Trash2,
  Eye,
  Edit3,
  CheckSquare,
  Layers,
  RotateCcw,
  TrendingUp,
  Activity,
  Cpu,
  FolderOpen,
  RefreshCw,
  SlidersHorizontal,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── FULL REAL OPERATIONAL DATASET ──
interface WorkOrder {
  id: string;
  wo: string;
  produk: string;
  klien: string;
  category: string;
  stage: string;
  stageStyle: string;
  progress: string;
  progressPercent: number;
  progressStyle: string;
  target: number;
  hpp: number;
  totalNilai: number;
  updatedAt: string;
  pic: string;
  line: string;
  notes: string;
}

const INITIAL_WORK_ORDERS: WorkOrder[] = [
  { id: "1", wo: "WO-2608-002", produk: "Golden Customer R4G1787709618256", klien: "PT Aurora Beauty", category: "Skincare", stage: "FINISHED_GOODS", stageStyle: "bg-emerald-100 text-emerald-700 border border-emerald-200", progress: "Done", progressPercent: 100, progressStyle: "bg-emerald-50 text-emerald-600 border border-emerald-200", target: 50, hpp: 120000, totalNilai: 6000000, updatedAt: "25/08/2026 10:30", pic: "Budi Santoso", line: "Line A — Main Packaging", notes: "Lulus QC rilis tanpa revisi." },
  { id: "2", wo: "WO-2608-004", produk: "R4G-002 Customer Body Wash", klien: "CV Lumiere Personal Care", category: "Personal Care", stage: "MIXING", stageStyle: "bg-blue-100 text-blue-700 border border-blue-200", progress: "In Progress", progressPercent: 65, progressStyle: "bg-blue-50 text-blue-600 border border-blue-200", target: 50, hpp: 45000, totalNilai: 2250000, updatedAt: "24/08/2026 09:15", pic: "Rian Hidayat", line: "Line B — Tank 02", notes: "Proses homogenisasi kecepatan 1500 RPM." },
  { id: "3", wo: "WO-AUR-001", produk: "Brightening Serum 20 ml", klien: "PT Aurora Beauty", category: "Skincare", stage: "MIXING", stageStyle: "bg-blue-100 text-blue-700 border border-blue-200", progress: "Not Started", progressPercent: 10, progressStyle: "bg-slate-100 text-slate-600 border border-slate-200", target: 1500, hpp: 150000, totalNilai: 225000000, updatedAt: "23/08/2026 14:20", pic: "Siti Aminah", line: "Line B — Tank 01", notes: "Menunggu penimbangan bahan aktif." },
  { id: "4", wo: "WO-AUR-002", produk: "Body Lotion Premium 100ml", klien: "R4G-002 Customer", category: "Personal Care", stage: "WAITING_MATERIAL", stageStyle: "bg-amber-100 text-amber-800 border border-amber-200", progress: "Waiting", progressPercent: 25, progressStyle: "bg-amber-50 text-amber-700 border border-amber-200", target: 500, hpp: 85000, totalNilai: 42500000, updatedAt: "22/08/2026 11:05", pic: "Dewi Kartika", line: "Line C — Filling Semi-Auto", notes: "Bahan pengemas botol dropper tertunda di gudang." },
  { id: "5", wo: "WO-2508-010", produk: "AQUA DM RM-AQUA-100", klien: "PT Sejahtera Abadi", category: "Raw Material", stage: "PENDING_REVIEW", stageStyle: "bg-orange-100 text-orange-800 border border-orange-200", progress: "Waiting", progressPercent: 40, progressStyle: "bg-amber-50 text-amber-700 border border-amber-200", target: 200, hpp: 15000, totalNilai: 3000000, updatedAt: "21/08/2026 16:40", pic: "Agus Pratama", line: "Line D — Purified Water System", notes: "Review CoA mikrobiologi oleh APJ." },
];

const TABS_CONFIG = [
  { id: "WORK ORDERS", label: "WORK ORDERS", icon: FileText, filterStage: null },
  { id: "MIXING", label: "MIXING", icon: FlaskConical, filterStage: "MIXING" },
  { id: "FILLING", label: "FILLING", icon: Droplet, filterStage: "WAITING_MATERIAL" },
  { id: "PACKING", label: "PACKING", icon: Package, filterStage: "PENDING_REVIEW" },
  { id: "HISTORY", label: "HISTORY", icon: History, filterStage: "FINISHED_GOODS" },
  { id: "ANALYTICS", label: "ANALYTICS", icon: BarChart3, filterStage: null },
];

export default function GoldenReferencePage() {
  // Alerts State
  const [isAlertOpen, setIsAlertOpen] = useState(true);

  // Tabs & Filter States
  const [activeTab, setActiveTab] = useState("WORK ORDERS");
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("ALL");
  const [selectedKpiFilter, setSelectedKpiFilter] = useState<string | null>(null);

  // Checkbox Selection & Bulk Actions
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  // Create WO Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("PT. Aurora Beauty");
  const [newBrandName, setNewBrandName] = useState("Aurora Glow");
  const [newContact, setNewContact] = useState("08123456789");
  const [newMoq, setNewMoq] = useState<number>(1000);
  const [newHpp, setNewHpp] = useState<number>(150000);
  const calculatedNilai = newMoq * newHpp;

  // Detail Inspection Slide-over Drawer State
  const [inspectingWo, setInspectingWo] = useState<WorkOrder | null>(null);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Spec References Demo States (Below Main Flow)
  const [showStateDemo, setShowStateDemo] = useState<"NONE" | "EMPTY" | "LOADING" | "ERROR">("NONE");

  // Dynamic Dataset Filtering
  const filteredData = useMemo(() => {
    return INITIAL_WORK_ORDERS.filter((item) => {
      // Tab filter
      const currentTabConfig = TABS_CONFIG.find((t) => t.id === activeTab);
      if (currentTabConfig?.filterStage && item.stage !== currentTabConfig.filterStage) {
        return false;
      }
      // KPI filter
      if (selectedKpiFilter === "APPROVED" && item.stage !== "FINISHED_GOODS") return false;
      if (selectedKpiFilter === "PENDING" && item.stage !== "PENDING_REVIEW" && item.stage !== "WAITING_MATERIAL") return false;
      if (selectedKpiFilter === "DISPATCH" && item.stage !== "MIXING") return false;

      // Dropdown filter
      if (stageFilter !== "ALL" && item.stage !== stageFilter) return false;

      // Search query
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        return (
          item.wo.toLowerCase().includes(q) ||
          item.produk.toLowerCase().includes(q) ||
          item.klien.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activeTab, stageFilter, searchQuery, selectedKpiFilter]);

  // Bulk Select Toggle
  const toggleSelectAll = () => {
    if (selectedRowIds.length === filteredData.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(filteredData.map((item) => item.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedRowIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const resetAllFilters = () => {
    setActiveTab("WORK ORDERS");
    setSearchQuery("");
    setStageFilter("ALL");
    setSelectedKpiFilter(null);
  };

  const isFilterActive = searchQuery !== "" || stageFilter !== "ALL" || selectedKpiFilter !== null || activeTab !== "WORK ORDERS";

  return (
    <div className="space-y-6 pb-20 text-slate-900 bg-[#F8FAFC] min-h-screen">
      {/* ── TOP SYSTEM ALERT BANNER ── */}
      {isAlertOpen && (
        <div className="bg-[#FEF9C3] border border-[#FEF08A] rounded-xl px-4 py-3 flex justify-between items-center gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-[#FEF08A] text-[#854D0E] rounded-lg font-bold flex items-center justify-center shrink-0">
              <AlertCircle className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-bold text-[#854D0E] uppercase tracking-wider leading-none">SYSTEM SYNC ALERT</p>
              <p className="text-[12px] text-[#854D0E]/90 leading-tight font-medium mt-0.5">
                Attention: SCM database undergoing indexing sync. Table records might lag up to 5 seconds.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAlertOpen(false)}
            className="p-1 hover:bg-amber-100/50 text-[#854D0E] rounded-lg transition-all border-none bg-transparent cursor-pointer shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── ULTRA-CLEAN OPERATIONAL HEADER (UN-BOXED) ── */}
      <div>
        <Link
          href="/dna-visual"
          className="text-[12px] font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1.5 text-decoration-none mb-1 w-fit transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Visual DNA Specs
        </Link>
        <h1 className="text-[32px] leading-[40px] font-bold text-slate-900 tracking-tight">
          WORK ORDERS & PRODUCTION
        </h1>
      </div>

      {/* ── 05. SIMPLIFIED 3-LAYER KPI METRIC CARDS (Exact Rhythm: 24px Gap from Header) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6">
        {/* Card 1: Omset (1 Label + 1 Value + 1 Supporting Micro-Metric) */}
        <div
          onClick={() => setSelectedKpiFilter(selectedKpiFilter === "OMSET" ? null : "OMSET")}
          className={cn(
            "border rounded-xl p-3.5 bg-blue-50/20 shadow-2xs flex flex-col justify-between h-[104px] cursor-pointer transition-all hover:border-blue-300",
            selectedKpiFilter === "OMSET" ? "ring-2 ring-blue-500 border-blue-400 bg-blue-50/50" : "border-blue-100/80"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-normal text-slate-600">Total Omset</span>
            <div className="w-6.5 h-6.5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[12px] font-bold">
              $
            </div>
          </div>
          <div>
            <p className="text-[24px] leading-[32px] font-bold text-slate-900 tabular-nums">Rp 279 Jt</p>
            <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +14% vs minggu lalu
            </p>
          </div>
        </div>

        {/* Card 2: Sample Approved */}
        <div
          onClick={() => setSelectedKpiFilter(selectedKpiFilter === "APPROVED" ? null : "APPROVED")}
          className={cn(
            "border rounded-xl p-3.5 bg-emerald-50/30 shadow-2xs flex flex-col justify-between h-[104px] cursor-pointer transition-all hover:border-emerald-300",
            selectedKpiFilter === "APPROVED" ? "ring-2 ring-emerald-500 border-emerald-400 bg-emerald-50/60" : "border-emerald-100/80"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-normal text-slate-600">Sample Approved</span>
            <div className="w-6.5 h-6.5 rounded-full bg-emerald-100/70 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-[24px] leading-[32px] font-bold text-slate-900 tabular-nums">1</p>
            <p className="text-[11px] text-slate-500 font-normal">Yield 94% • Rilis APJ</p>
          </div>
        </div>

        {/* Card 3: Pending Review */}
        <div
          onClick={() => setSelectedKpiFilter(selectedKpiFilter === "PENDING" ? null : "PENDING")}
          className={cn(
            "border rounded-xl p-3.5 bg-amber-50/30 shadow-2xs flex flex-col justify-between h-[104px] cursor-pointer transition-all hover:border-amber-300",
            selectedKpiFilter === "PENDING" ? "ring-2 ring-amber-500 border-amber-400 bg-amber-50/60" : "border-amber-100/80"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-normal text-slate-600">Pending Review</span>
            <div className="w-6.5 h-6.5 rounded-full bg-amber-100/70 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-[24px] leading-[32px] font-bold text-slate-900 tabular-nums">2</p>
            <p className="text-[11px] text-slate-500 font-normal">Dalam Antrean Review</p>
          </div>
        </div>

        {/* Card 4: Aktif Mixing */}
        <div
          onClick={() => setSelectedKpiFilter(selectedKpiFilter === "DISPATCH" ? null : "DISPATCH")}
          className={cn(
            "border rounded-xl p-3.5 bg-rose-50/30 shadow-2xs flex flex-col justify-between h-[104px] cursor-pointer transition-all hover:border-rose-300",
            selectedKpiFilter === "DISPATCH" ? "ring-2 ring-rose-500 border-rose-400 bg-rose-50/60" : "border-rose-100/80"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-rose-700">Aktif Mixing</span>
            <div className="w-6.5 h-6.5 rounded-full bg-rose-100/70 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-[24px] leading-[32px] font-bold text-slate-900 tabular-nums">2</p>
            <p className="text-[11px] text-rose-600 font-medium">Lini Tank 01 & 02 Running</p>
          </div>
        </div>
      </div>

      {/* ── 3-LAYER STRUCTURAL HIERARCHY (Exact Rhythm: 22px Gap from KPI) ── */}
      <div className="space-y-[18px] mt-[22px]">
        {/* LAYER 1: BORDERED TAB NAV CONTAINER */}
        <div className="bg-white border border-slate-200 rounded-xl p-1 shadow-2xs h-[46px] flex items-center gap-1 overflow-x-auto">
          {TABS_CONFIG.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "h-[38px] px-4 rounded-lg text-[12px] font-semibold transition-all shrink-0 cursor-pointer border-none flex items-center gap-2",
                  isActive
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <IconComponent className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-400")} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── SPECIAL ANALYTICS DASHBOARD VIEW (WHEN ANALYTICS TAB IS ACTIVE) ── */}
        {activeTab === "ANALYTICS" ? (
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-[18px] font-bold text-slate-900">Production Yield & Operational Analytics</h3>
                <p className="text-[12px] text-slate-500">Real-time batch yield, OEE machine efficiency, and stage distribution</p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-emerald-600" /> LIVE OEE 94.2%
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Yield Line / Bar Chart */}
              <div className="lg:col-span-8 border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-[13px] text-slate-900">Tren Daily Target vs Actual Yield (Pcs x 1000)</p>
                  <span className="text-[11px] text-slate-400 font-mono">Minggu 34 — Agustus 2026</span>
                </div>

                {/* SVG Visual Chart */}
                <div className="h-44 w-full pt-4 relative">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120">
                    <line x1="0" y1="20" x2="500" y2="20" stroke="#E2E8F0" strokeDasharray="3 3" />
                    <line x1="0" y1="60" x2="500" y2="60" stroke="#E2E8F0" strokeDasharray="3 3" />
                    <line x1="0" y1="100" x2="500" y2="100" stroke="#E2E8F0" strokeDasharray="3 3" />

                    <polyline fill="none" stroke="#94A3B8" strokeWidth="2" strokeDasharray="4 4" points="10,40 80,35 150,50 220,30 290,25 360,45 430,30 490,20" />
                    <polyline fill="none" stroke="#2563EB" strokeWidth="3" points="10,45 80,30 150,42 220,25 290,15 360,35 430,22 490,12" />

                    {[[10, 45], [80, 30], [150, 42], [220, 25], [290, 15], [360, 35], [430, 22], [490, 12]].map(([x, y], idx) => (
                      <circle key={idx} cx={x} cy={y} r="4" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
                    ))}
                  </svg>

                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2">
                    <span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span><span>Ming</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-[11px] pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-blue-600 rounded-sm inline-block" />
                    <span className="font-semibold text-slate-800">Actual Output Yield</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-slate-400 inline-block" />
                    <span className="text-slate-500">Target Plan (MOQ)</span>
                  </div>
                </div>
              </div>

              {/* Machine OEE */}
              <div className="lg:col-span-4 space-y-3">
                <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-2.5">
                  <p className="font-bold text-[12px] text-slate-900 uppercase">Machine OEE Gauges</p>
                  <div className="space-y-2 text-[12px]">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-600 font-medium">Overall Availability</span>
                        <span className="font-bold text-slate-900">98.4%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full w-[98.4%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-600 font-medium">Performance Efficiency</span>
                        <span className="font-bold text-slate-900">94.1%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full w-[94.1%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-600 font-medium">Quality Release Rate</span>
                        <span className="font-bold text-slate-900">99.2%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-teal-500 h-full rounded-full w-[99.2%]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-blue-600" />
                    <span className="text-[12px] font-bold text-slate-900">Lini Tank 01 & 02</span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold">OPERATIONAL</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* LAYER 2: TOOLBAR FILTER & SINGLE ACTION BUTTON (Exact Rhythm: 16px Gap from Tabs) */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                <div className="relative min-w-[220px] flex-1 max-w-[280px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari WO / Produk / Klien..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 h-9 text-[12px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                  />
                </div>

                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 h-9 text-[12px] text-slate-700 cursor-pointer focus:outline-none focus:bg-white"
                >
                  <option value="ALL">Semua Stage</option>
                  <option value="FINISHED_GOODS">FINISHED_GOODS</option>
                  <option value="MIXING">MIXING</option>
                  <option value="WAITING_MATERIAL">WAITING_MATERIAL</option>
                  <option value="PENDING_REVIEW">PENDING_REVIEW</option>
                </select>

                <div className="relative">
                  <input
                    type="text"
                    defaultValue="01/08/2026 - 31/08/2026"
                    className="bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 h-9 text-[12px] text-slate-700"
                  />
                  <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>

                {/* RESET FILTER INDICATOR */}
                {isFilterActive && (
                  <button
                    onClick={resetAllFilters}
                    className="h-9 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 border-none cursor-pointer transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset Filter
                  </button>
                )}
              </div>

              {/* SINGLE PRIMARY ACTION BUTTON FOR ENTIRE PAGE */}
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all border-none"
              >
                <Plus className="w-4 h-4" /> Tambah Work Order
              </button>
            </div>

            {/* STICKY BULK ACTIONS BAR */}
            {selectedRowIds.length > 0 && (
              <div className="bg-slate-900 text-white rounded-xl p-3 px-4 flex items-center justify-between shadow-md text-[12px] animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold">{selectedRowIds.length} Work Order terpilih</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="h-8 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium flex items-center gap-1.5 border border-slate-700 cursor-pointer">
                    <Download className="w-3.5 h-3.5" /> Export PDF
                  </button>
                  <button className="h-8 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium flex items-center gap-1.5 border border-slate-700 cursor-pointer">
                    <Layers className="w-3.5 h-3.5" /> Ubah Stage Batch
                  </button>
                  <button className="h-8 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium flex items-center gap-1.5 border-none cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                  </button>
                </div>
              </div>
            )}

            {/* LAYER 3: CANONICAL DATA TABLE WITH VISUAL PROGRESS BARS (Exact Rhythm: 18px Gap from Toolbar) */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 border-b border-slate-200 text-[12px] leading-[16px] font-semibold text-slate-700 h-[40px]">
                      <th className="py-2.5 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedRowIds.length === filteredData.length && filteredData.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </th>
                      <th className="py-2.5 px-3.5">WO</th>
                      <th className="py-2.5 px-3.5">PRODUK</th>
                      <th className="py-2.5 px-3.5">KLIEN</th>
                      <th className="py-2.5 px-3.5">STAGE</th>
                      <th className="py-2.5 px-3.5">PROGRESS BATCH</th>
                      <th className="py-2.5 px-3.5 text-right">TARGET (PCS)</th>
                      <th className="py-2.5 px-3.5 text-right">NILAI (RP)</th>
                      <th className="py-2.5 px-3.5">UPDATED AT</th>
                      <th className="py-2.5 px-3.5 text-center w-12">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[12px] leading-[18px]">
                    {filteredData.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-slate-400">
                          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="font-semibold text-slate-600">Tidak ada Work Order yang sesuai filter</p>
                          <p className="text-[11px] mt-0.5">Coba ubah kata kunci pencarian atau reset filter</p>
                          <button
                            onClick={resetAllFilters}
                            className="mt-3 h-8 px-3 bg-blue-50 text-blue-600 rounded-lg text-[12px] font-semibold border-none cursor-pointer"
                          >
                            Reset Filter
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredData.map((item) => (
                        <tr
                          key={item.id}
                          className={cn(
                            "hover:bg-slate-50/80 transition-colors h-[42px]",
                            selectedRowIds.includes(item.id) && "bg-blue-50/30"
                          )}
                        >
                          <td className="py-2 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={selectedRowIds.includes(item.id)}
                              onChange={() => toggleSelectRow(item.id)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>

                          {/* WO Identifier: Click opens Inspection Drawer */}
                          <td className="py-2 px-3.5">
                            <button
                              onClick={() => setInspectingWo(item)}
                              className="font-semibold text-blue-600 hover:text-blue-800 text-left border-none bg-transparent cursor-pointer"
                            >
                              {item.wo}
                            </button>
                          </td>

                          <td className="py-2 px-3.5 text-slate-800 font-medium">{item.produk}</td>
                          <td className="py-2 px-3.5 text-slate-600 font-normal">{item.klien}</td>
                          <td className="py-2 px-3.5">
                            <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider", item.stageStyle)}>
                              {item.stage}
                            </span>
                          </td>

                          {/* VISUAL PROGRESS METER */}
                          <td className="py-2 px-3.5 min-w-[140px]">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all",
                                    item.progressPercent === 100 ? "bg-emerald-500" : item.progressPercent > 50 ? "bg-blue-600" : "bg-amber-500"
                                  )}
                                  style={{ width: `${item.progressPercent}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-mono text-slate-500 w-8 text-right">{item.progressPercent}%</span>
                            </div>
                          </td>

                          <td className="py-2 px-3.5 text-right font-medium text-slate-900 tabular-nums">
                            {item.target.toLocaleString("id-ID")}
                          </td>
                          <td className="py-2 px-3.5 text-right font-medium text-slate-900 tabular-nums">
                            Rp {item.totalNilai.toLocaleString("id-ID")}
                          </td>
                          <td className="py-2 px-3.5 text-slate-500 font-normal text-[12px]">{item.updatedAt}</td>

                          {/* ROW ACTION MENU */}
                          <td className="py-2 px-3.5 text-center relative">
                            <button
                              onClick={() => setOpenActionMenuId(openActionMenuId === item.id ? null : item.id)}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md border-none bg-transparent cursor-pointer transition-colors"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {/* Action Menu Dropdown */}
                            {openActionMenuId === item.id && (
                              <div className="absolute right-3 top-9 z-30 bg-white border border-slate-200 rounded-xl shadow-lg w-40 p-1 text-left text-[12px] space-y-0.5">
                                <button
                                  onClick={() => {
                                    setInspectingWo(item);
                                    setOpenActionMenuId(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2 border-none bg-transparent cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-400" /> Inspeksi Detail
                                </button>
                                <button
                                  onClick={() => setOpenActionMenuId(null)}
                                  className="w-full px-3 py-1.5 text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2 border-none bg-transparent cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-slate-400" /> Edit Batch
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION FOOTER */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-[12px] text-slate-500 pt-0.5">
                <span>Menampilkan 1–{filteredData.length} dari {INITIAL_WORK_ORDERS.length} data</span>
                <div className="flex items-center gap-3">
                  <select className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[12px] text-slate-700">
                    <option>10 / page</option>
                    <option>25 / page</option>
                    <option>50 / page</option>
                  </select>
                  <div className="flex items-center gap-1">
                    <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 border-none bg-transparent cursor-pointer"><ChevronsLeft className="w-4 h-4" /></button>
                    <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 border-none bg-transparent cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
                    <button className="w-7 h-7 rounded-lg bg-blue-600 text-white font-semibold text-[12px] flex items-center justify-center border-none">1</button>
                    <button className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-700 text-[12px] flex items-center justify-center border-none bg-transparent">2</button>
                    <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 border-none bg-transparent cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
                    <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 border-none bg-transparent cursor-pointer"><ChevronsRight className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── OWNER INSIGHT & OPERATIONAL RELEASE CALLOUT ── */}
      <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-start gap-2.5 text-[12px] text-emerald-950 mt-6">
        <Sparkles className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-emerald-800 text-[11px] uppercase tracking-wider">💡 OWNER INSIGHT & OPERATIONAL RELEASE</p>
          <p className="text-emerald-900 mt-0.5 font-medium">
            Progress finished goods bulan ini mencatatkan efisiensi 94% pada lini produksi utama. Sebanyak 12 batch sample disetujui tanpa revisi teknis oleh APJ.
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          TECHNICAL SPECIFICATIONS REFERENCE SECTIONS (RENDERED BELOW MAIN VIEW)
          For Developers & Designers to benchmark UI Patterns & Complex States
      ════════════════════════════════════════════════════════════════════ */}
      <div className="pt-10 border-t-2 border-slate-200/80 mt-12 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="px-2.5 py-0.5 bg-slate-900 text-white rounded text-[10px] font-bold uppercase tracking-wider">
              TECHNICAL BENCHMARK SPECIFICATIONS
            </span>
            <h2 className="text-[20px] font-bold text-slate-900 mt-1">
              Operational UI Patterns & UI States Reference
            </h2>
            <p className="text-[12px] text-slate-500">
              Interactive reference for developer implementations: Form drawers, empty states, loading skeletons, and error retry patterns.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(["NONE", "EMPTY", "LOADING", "ERROR"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setShowStateDemo(mode)}
                className={cn(
                  "h-8 px-3 rounded-lg text-[11px] font-semibold transition-all border cursor-pointer",
                  showStateDemo === mode
                    ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                {mode === "NONE" ? "Standard View" : `${mode} State`}
              </button>
            ))}
          </div>
        </div>

        {/* DEMO INTERACTIVE STATE CONTAINERS */}
        {showStateDemo === "EMPTY" && (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3 shadow-2xs animate-in fade-in duration-150">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FolderOpen className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-[16px] text-slate-900">Belum Ada Data Work Order</h4>
            <p className="text-[12px] text-slate-500 max-w-sm mx-auto">
              Sistem tidak menemukan catatan Work Order di lini produksi ini. Buat Work Order baru untuk memulai alur kerja.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[12px] font-semibold shadow-2xs border-none cursor-pointer"
            >
              + Tambah Work Order Pertama
            </button>
          </div>
        )}

        {showStateDemo === "LOADING" && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-2xs animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/4 mb-4" />
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-slate-100 rounded-lg w-full" />
              ))}
            </div>
          </div>
        )}

        {showStateDemo === "ERROR" && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 flex items-start justify-between gap-4 text-rose-900 shadow-2xs">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-[14px]">Gagal Memuat Data Production Ledger</h4>
                <p className="text-[12px] text-rose-700 mt-0.5">
                  Koneksi ke node SCM terputus (HTTP 504 Gateway Timeout). Silakan periksa jaringan internal dan coba lagi.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowStateDemo("NONE")}
              className="h-8 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[12px] font-semibold border-none cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Coba Lagi
            </button>
          </div>
        )}

        {/* SPACING & RADIUS DEMONSTRATION WIDGET */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-bold text-[12px] text-slate-900 uppercase tracking-wider">
              Live Spacing & Radius Scale Applied On Page
            </p>
            <span className="text-[11px] font-mono text-slate-400">Canonical Main Radius: 12px | Base Rhythm: 4px</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] text-slate-600">
            <div className="p-2 border border-slate-200 rounded-[12px] bg-slate-50 text-center">
              <span className="font-semibold text-slate-800">12px Main Radius:</span> Cards, Inputs, Tables
            </div>
            <div className="p-2 border border-slate-200 rounded-[8px] bg-slate-50 text-center">
              <span className="font-semibold text-slate-800">8-10px Radius:</span> Inner Active Tabs
            </div>
            <div className="p-2 border border-slate-200 rounded-[6px] bg-slate-50 text-center">
              <span className="font-semibold text-slate-800">6px Radius:</span> Status Badges & Pills
            </div>
            <div className="p-2 border border-slate-200 rounded-[16px] bg-slate-50 text-center">
              <span className="font-semibold text-slate-800">16px Radius:</span> Modal & Drawer Containers
            </div>
          </div>
        </div>
      </div>

      {/* ── 10. DETAIL INSPECTION SLIDE-OVER DRAWER ── */}
      {inspectingWo && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-end animate-in fade-in duration-150">
          <div className="bg-white border-l border-slate-200 w-full max-w-md h-full p-6 shadow-2xl overflow-y-auto space-y-5 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase">
                  WORK ORDER INSPECTION
                </span>
                <h3 className="text-[20px] font-bold text-slate-900 mt-1">{inspectingWo.wo}</h3>
              </div>
              <button
                onClick={() => setInspectingWo(null)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg border-none bg-transparent cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-[12px]">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <p className="text-[11px] font-semibold text-slate-400 uppercase">Informasi Produk</p>
                <p className="text-[14px] font-bold text-slate-900">{inspectingWo.produk}</p>
                <p className="text-slate-600">Klien: <span className="font-medium text-slate-800">{inspectingWo.klien}</span></p>
                <p className="text-slate-600">Kategori: <span className="font-medium text-slate-800">{inspectingWo.category}</span></p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border border-slate-200 rounded-xl">
                  <p className="text-[11px] font-medium text-slate-500">Stage</p>
                  <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-1 inline-block", inspectingWo.stageStyle)}>
                    {inspectingWo.stage}
                  </span>
                </div>
                <div className="p-3 border border-slate-200 rounded-xl">
                  <p className="text-[11px] font-medium text-slate-500">Status Progress</p>
                  <p className="font-bold text-slate-900 mt-1">{inspectingWo.progress} ({inspectingWo.progressPercent}%)</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border border-slate-200 rounded-xl">
                  <p className="text-[11px] font-medium text-slate-500">Target Produksi</p>
                  <p className="text-[16px] font-bold text-slate-900 mt-0.5">{inspectingWo.target.toLocaleString("id-ID")} Pcs</p>
                </div>
                <div className="p-3 border border-slate-200 rounded-xl">
                  <p className="text-[11px] font-medium text-slate-500">Nilai Estimasi</p>
                  <p className="text-[16px] font-bold text-blue-600 mt-0.5">Rp {inspectingWo.totalNilai.toLocaleString("id-ID")}</p>
                </div>
              </div>

              <div className="p-3 border border-slate-200 rounded-xl space-y-1">
                <p className="text-[11px] font-medium text-slate-500">Lini & PIC Produksi</p>
                <p className="font-semibold text-slate-800">{inspectingWo.line}</p>
                <p className="text-slate-600">PIC: {inspectingWo.pic}</p>
              </div>

              <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl space-y-1">
                <p className="text-[11px] font-bold text-amber-800 uppercase">Catatan Technical QC</p>
                <p className="text-amber-900 font-medium">{inspectingWo.notes}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setInspectingWo(null)}
                className="h-9 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[12px] font-semibold border-none cursor-pointer"
              >
                Tutup Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 08. WORK ORDER INTAKE MODAL / DRAWER WITH REAL INPUTS & LIVE MATH ── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-lg w-full p-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5">
              <div>
                <h3 className="font-bold text-[16px] text-slate-900">Tambah Work Order Baru</h3>
                <p className="text-[12px] text-slate-500">Standard form component dengan kalkulasi nilai estimasi otomatis</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer border-none bg-transparent"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-[12px]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Nama Klien <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-9 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Identitas Brand</label>
                  <input
                    type="text"
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-9 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Kontak <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={newContact}
                    onChange={(e) => setNewContact(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-9 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">PIC Produksi</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-9 text-slate-700">
                    <option>Budi Santoso (Production)</option>
                    <option>Rian Hidayat (QC Lead)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Kategori Produk</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-9 text-slate-700">
                    <option>Skincare / Serum</option>
                    <option>Personal Care</option>
                    <option>Raw Material</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Target Line</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-9 text-slate-700">
                    <option>Line A — Mixing & Filling</option>
                    <option>Line B — Tank 02</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Estimasi Target (Pcs) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    value={newMoq}
                    onChange={(e) => setNewMoq(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 h-9 text-slate-900 font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">HPP / Satuan (Rp) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    value={newHpp}
                    onChange={(e) => setNewHpp(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 h-9 text-slate-900 font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Nilai Estimasi Production (Target x HPP)</label>
                <input
                  type="text"
                  disabled
                  value={`Rp ${calculatedNilai.toLocaleString("id-ID")}`}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 h-9 text-slate-900 font-bold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Catatan Produksi / Brief</label>
                <textarea
                  rows={2}
                  defaultValue="Serum brightening 20ml kemasan botol dropper bening..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="h-9 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-[12px] font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[12px] font-semibold shadow-2xs cursor-pointer border-none"
              >
                Simpan Work Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
