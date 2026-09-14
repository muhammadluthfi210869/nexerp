"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Calendar,
  Clock,
  FlaskConical,
  Package,
  Layers,
  Zap,
  Plus,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Factory,
  Eye,
  SlidersHorizontal,
  ArrowRight
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaModal,
  DnaTabNav,
  useDnaToast
} from "@/components/dna";
import Link from "next/link";

interface ProductionScheduleItem {
  id: string;
  code: string; // e.g. SCH-MIX-089
  spkCode: string;
  batchNumber: string;
  customerName: string;
  brandName: string;
  productName: string;
  stage: "MIXING" | "FILLING" | "PACKAGING";
  machineName: string; // e.g. Bejana Homogenizer 500L (MIX-01)
  startDate: string;
  endDate: string;
  targetQty: number; // PCS or Kg
  unit: string;
  operator: string;
  progressPct: number;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "DELAYED";
  notes: string;
}

const FALLBACK_SCHEDULES: ProductionScheduleItem[] = [
  {
    id: "sch-1",
    code: "SCH-MIX-089",
    spkCode: "SPK-2026-0043",
    batchNumber: "BATCH-AURA-0910",
    customerName: "CV Aura Skin Estetika",
    brandName: "AuraGlow",
    productName: "Centella Asiatica Soothing Gel Cream",
    stage: "MIXING",
    machineName: "Homogenizer Vessel 500L (MIX-01)",
    startDate: "2026-09-09",
    endDate: "2026-09-10",
    targetQty: 157.5,
    unit: "Kg",
    operator: "Hendra Wijaya",
    progressPct: 45,
    status: "IN_PROGRESS",
    notes: "Tahap pemanasan fase minyak 75°C sebelum emulsi."
  },
  {
    id: "sch-2",
    code: "SCH-FIL-104",
    spkCode: "SPK-2026-0042",
    batchNumber: "BATCH-GLW-0909",
    customerName: "PT Cantika Jelita Nusantara",
    brandName: "GlowGoddess",
    productName: "Niacinamide 10% Brightening Serum",
    stage: "FILLING",
    machineName: "Rotary Auto Filling Line 2 (FIL-02)",
    startDate: "2026-09-09",
    endDate: "2026-09-11",
    targetQty: 5000,
    unit: "PCS",
    operator: "Budi Santoso",
    progressPct: 60,
    status: "IN_PROGRESS",
    notes: "Pengisian botol pipet 30ml, cek bobot berkala tiap 30 menit."
  },
  {
    id: "sch-3",
    code: "SCH-PCK-077",
    spkCode: "SPK-2026-0040",
    batchNumber: "BATCH-ELX-0905",
    customerName: "PT Elixir Botanika Internasional",
    brandName: "ElixirHerb",
    productName: "Rosemary Purifying Hair Tonic",
    stage: "PACKAGING",
    machineName: "Conveyor Line 1 + Shrink Tunnel (PCK-01)",
    startDate: "2026-09-08",
    endDate: "2026-09-09",
    targetQty: 10000,
    unit: "PCS",
    operator: "Rina Marlina",
    progressPct: 90,
    status: "IN_PROGRESS",
    notes: "Packing sekunder box + hologram segel ke master box 48 pcs."
  },
  {
    id: "sch-4",
    code: "SCH-MIX-090",
    spkCode: "SPK-2026-0044",
    batchNumber: "BATCH-VELV-0912",
    customerName: "PT Velvet Beauty Kreasi",
    brandName: "VelvetLips",
    productName: "Matte Velvet Lip Cream Shade 04",
    stage: "MIXING",
    machineName: "High Shear Mixer 200L (MIX-03)",
    startDate: "2026-09-11",
    endDate: "2026-09-12",
    targetQty: 29.7,
    unit: "Kg",
    operator: "Hendra Wijaya",
    progressPct: 0,
    status: "SCHEDULED",
    notes: "Menunggu rilis bahan baku pigmen warna dari gudang."
  },
  {
    id: "sch-5",
    code: "SCH-FIL-105",
    spkCode: "SPK-2026-0043",
    batchNumber: "BATCH-AURA-0910",
    customerName: "CV Aura Skin Estetika",
    brandName: "AuraGlow",
    productName: "Centella Asiatica Soothing Gel Cream",
    stage: "FILLING",
    machineName: "Semi-Auto Jar Filling Line (FIL-01)",
    startDate: "2026-09-11",
    endDate: "2026-09-12",
    targetQty: 3000,
    unit: "PCS",
    operator: "Budi Santoso",
    progressPct: 0,
    status: "SCHEDULED",
    notes: "Filling pot jar 50gr setelah ruahan lolos QC bulk."
  },
  {
    id: "sch-6",
    code: "SCH-PCK-078",
    spkCode: "SPK-2026-0042",
    batchNumber: "BATCH-GLW-0909",
    customerName: "PT Cantika Jelita Nusantara",
    brandName: "GlowGoddess",
    productName: "Niacinamide 10% Brightening Serum",
    stage: "PACKAGING",
    machineName: "Manual Assembly + Shrink Line (PCK-02)",
    startDate: "2026-09-12",
    endDate: "2026-09-13",
    targetQty: 5000,
    unit: "PCS",
    operator: "Rina Marlina",
    progressPct: 0,
    status: "SCHEDULED",
    notes: "Pemasangan inner leaflet instruksi & label barcode NA BPOM."
  }
];

const STAGE_CONFIG: Record<string, { label: string; badge: "info" | "purple" | "warning"; icon: any; color: string; border: string }> = {
  MIXING: { label: "Mixing (Ruahan)", badge: "info", icon: FlaskConical, color: "bg-blue-50 text-blue-700", border: "border-blue-200" },
  FILLING: { label: "Filling (Primer)", badge: "purple", icon: Zap, color: "bg-purple-50 text-purple-700", border: "border-purple-200" },
  PACKAGING: { label: "Packaging (Sekunder)", badge: "warning", icon: Package, color: "bg-amber-50 text-amber-700", border: "border-amber-200" },
};

export default function ProductionSchedulePage() {
  const toast = useDnaToast();
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMachine, setSelectedMachine] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"GANTT" | "TABLE">("GANTT");

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<ProductionScheduleItem | null>(null);

  // Form states
  const [formSpk, setFormSpk] = useState("");
  const [formProduct, setFormProduct] = useState("");
  const [formStage, setFormStage] = useState<"MIXING" | "FILLING" | "PACKAGING">("MIXING");
  const [formMachine, setFormMachine] = useState("Homogenizer Vessel 500L (MIX-01)");
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [formEndDate, setFormEndDate] = useState(
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [formTargetQty, setFormTargetQty] = useState<number>(5000);
  const [formOperator, setFormOperator] = useState("Hendra Wijaya");
  const [formNotes, setFormNotes] = useState("");
  const [localSchedules, setLocalSchedules] = useState<ProductionScheduleItem[]>(FALLBACK_SCHEDULES);

  const { data: serverSchedules } = useQuery({
    queryKey: ["production-schedules"],
    queryFn: async () => {
      try {
        const res = await api.get("/production/step-logs");
        const unwrapped = unwrapResponse(res);
        if (Array.isArray(unwrapped) && unwrapped.length > 0) {
          const mapped: ProductionScheduleItem[] = unwrapped.map((item, idx) => ({
            id: item.id || `sch-${idx}`,
            code: item.code || `SCH-MIX-${String(idx + 80).padStart(3, "0")}`,
            spkCode: item.spkCode || item.woCode || "SPK-2026-0042",
            batchNumber: item.batchNumber || `BATCH-${idx}`,
            customerName: item.customerName || "PT Cantika Jelita",
            brandName: item.brandName || "GlowGoddess",
            productName: item.productName || "Brightening Serum",
            stage: (item.stage || "MIXING") as any,
            machineName: item.machineName || "Homogenizer 500L",
            startDate: item.startDate ? item.startDate.slice(0, 10) : "2026-09-09",
            endDate: item.endDate ? item.endDate.slice(0, 10) : "2026-09-11",
            targetQty: Number(item.targetQty) || 5000,
            unit: item.unit || "PCS",
            operator: item.operator || "Operator Produksi",
            progressPct: Number(item.progressPct) || 50,
            status: (item.status || "IN_PROGRESS") as any,
            notes: item.notes || ""
          }));
          setLocalSchedules(mapped);
          return mapped;
        }
      } catch (err) {
        console.warn("Using fallback schedules", err);
      }
      return FALLBACK_SCHEDULES;
    }
  });

  const schedules = localSchedules;

  const filteredSchedules = useMemo(() => {
    return schedules.filter((sch) => {
      if (activeTab !== "ALL" && sch.stage !== activeTab) return false;
      if (selectedMachine !== "ALL" && !sch.machineName.includes(selectedMachine)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = sch.code.toLowerCase().includes(q);
        const matchSpk = sch.spkCode.toLowerCase().includes(q);
        const matchBatch = sch.batchNumber.toLowerCase().includes(q);
        const matchProduct = sch.productName.toLowerCase().includes(q);
        const matchBrand = sch.brandName.toLowerCase().includes(q);
        if (!matchCode && !matchSpk && !matchBatch && !matchProduct && !matchBrand) return false;
      }
      return true;
    });
  }, [schedules, activeTab, selectedMachine, searchQuery]);

  // KPI Calculations
  const totalActive = schedules.filter((s) => s.status === "IN_PROGRESS" || s.status === "SCHEDULED").length;
  const mixingCount = schedules.filter((s) => s.stage === "MIXING").length;
  const fillingCount = schedules.filter((s) => s.stage === "FILLING").length;
  const packingCount = schedules.filter((s) => s.stage === "PACKAGING").length;

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSpk || !formProduct) {
      toast.error("Validasi Gagal", "Harap lengkapi No. SPK dan nama produk.");
      return;
    }

    const prefix = formStage === "MIXING" ? "MIX" : formStage === "FILLING" ? "FIL" : "PCK";
    const newSch: ProductionScheduleItem = {
      id: `sch-${Date.now()}`,
      code: `SCH-${prefix}-${String(schedules.length + 110).padStart(3, "0")}`,
      spkCode: formSpk,
      batchNumber: `BATCH-${String(Date.now()).slice(-6)}`,
      customerName: "Klien Maklon Terdaftar",
      brandName: "Brand Kosmetik",
      productName: formProduct,
      stage: formStage,
      machineName: formMachine,
      startDate: formStartDate,
      endDate: formEndDate,
      targetQty: Number(formTargetQty),
      unit: formStage === "MIXING" ? "Kg" : "PCS",
      operator: formOperator,
      progressPct: 0,
      status: "SCHEDULED",
      notes: formNotes || ""
    };

    schedules.unshift(newSch);
    setIsCreateModalOpen(false);
    toast.success("Jadwal Berhasil Diterbitkan", `Jadwal ${newSch.code} untuk lini ${newSch.stage} telah diagendakan.`);
  };

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Jadwal Produksi & Timeline (Gantt)"
        subtitle="Visualisasi timeline alokasi mesin, kapasitas lini, dan urutan tahapan produksi fisik maklon kosmetik"
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5" />
            <span>Multi-Stage Gantt View</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode("GANTT")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  viewMode === "GANTT" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Gantt Timeline
              </button>
              <button
                onClick={() => setViewMode("TABLE")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  viewMode === "TABLE" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Tabel Jadwal
              </button>
            </div>
            <DnaButton variant="primary" size="md" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Buat Jadwal Baru
            </DnaButton>
          </div>
        }
      />

      {/* KPI Grid */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Jadwal Aktif"
          value={`${totalActive} Slot`}
          icon={<Calendar className="w-5 h-5 text-indigo-600" />}
          delta={{ value: "Kapasitas 84%", isPositive: true }}
          variant="blue"
        />
        <DnaStatCard
          label="Lini Mixing"
          value={`${mixingCount} Bejana`}
          icon={<FlaskConical className="w-5 h-5 text-blue-600" />}
          subtext="Bejana Homogenizer"
          variant="info"
        />
        <DnaStatCard
          label="Lini Filling"
          value={`${fillingCount} Line`}
          icon={<Zap className="w-5 h-5 text-purple-600" />}
          subtext="Rotary & Semi-Auto"
          variant="purple"
        />
        <DnaStatCard
          label="Lini Packaging"
          value={`${packingCount} Line`}
          icon={<Package className="w-5 h-5 text-amber-600" />}
          subtext="Shrink & Carton"
          variant="warning"
        />
      </DnaKpiGrid>

      {/* Main Container Card */}
      <DnaDataTableCard
        title="Jadwal Produksi Lini Pabrik"
        badge={
          <DnaBadge variant="default">
            {filteredSchedules.length} Item Jadwal
          </DnaBadge>
        }
        customToolbar={
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 w-full">
            <DnaTabNav
              tabs={[
                { id: "ALL", label: "Semua Tahap", badge: schedules.length },
                { id: "MIXING", label: "Mixing (Ruahan)", badge: mixingCount },
                { id: "FILLING", label: "Filling (Primer)", badge: fillingCount },
                { id: "PACKAGING", label: "Packaging (Sekunder)", badge: packingCount }
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
            />

            <div className="flex items-center gap-2">
              <div className="relative min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari Jadwal, SPK, Produk..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <select
                value={selectedMachine}
                onChange={(e) => setSelectedMachine(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
              >
                <option value="ALL">Semua Mesin</option>
                <option value="Homogenizer">Homogenizer</option>
                <option value="Filling Line">Filling Line</option>
                <option value="Conveyor">Packaging Line</option>
              </select>
            </div>
          </div>
        }
      >
        {viewMode === "GANTT" ? (
          /* GANTT TIMELINE VIEW */
          <div className="space-y-3 p-2">
            {filteredSchedules.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Tidak ada jadwal produksi yang cocok dengan filter.
              </div>
            ) : (
              filteredSchedules.map((item) => {
                const config = STAGE_CONFIG[item.stage] || STAGE_CONFIG.MIXING;
                const Icon = config.icon;
                return (
                  <div
                    key={item.id}
                    className="p-3.5 bg-white border border-slate-200 rounded-xl hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Left Info */}
                    <div className="min-w-[260px] space-y-1">
                      <div className="flex items-center gap-2">
                        <DnaBadge variant={config.badge}>
                          <Icon className="w-3 h-3 mr-1" />
                          {config.label}
                        </DnaBadge>
                        <span className="font-bold text-xs text-slate-900">{item.code}</span>
                        <span className="text-[10px] text-slate-400">({item.spkCode})</span>
                      </div>
                      <div className="font-semibold text-xs text-slate-800">{item.productName}</div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {item.brandName} • <span className="text-indigo-600">{item.machineName}</span>
                      </div>
                    </div>

                    {/* Middle Timeline & Progress */}
                    <div className="flex-1 max-w-md space-y-1.5">
                      <div className="flex justify-between text-[10px] font-semibold text-slate-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {item.startDate} s/d {item.endDate}
                        </span>
                        <span>{item.progressPct}% • {item.targetQty.toLocaleString()} {item.unit}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.stage === "MIXING"
                              ? "bg-blue-600"
                              : item.stage === "FILLING"
                              ? "bg-purple-600"
                              : "bg-amber-600"
                          }`}
                          style={{ width: `${Math.max(item.progressPct, 5)}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center justify-between">
                        <span>PIC: {item.operator}</span>
                        <span className="italic">{item.notes}</span>
                      </div>
                    </div>

                    {/* Right Action */}
                    <div className="flex items-center gap-2 shrink-0">
                      <DnaButton
                        variant="secondary"
                        size="sm"
                        onClick={() => setDetailItem(item)}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Detail
                      </DnaButton>

                      <Link
                        href={
                          item.stage === "MIXING"
                            ? "/production/mixing"
                            : item.stage === "FILLING"
                            ? "/production/filling"
                            : "/production/packaging"
                        }
                      >
                        <DnaButton variant="primary" size="sm">
                          Eksekusi
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </DnaButton>
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* TABLE VIEW */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="px-3.5 py-3">No. Jadwal & SPK</th>
                  <th className="px-3.5 py-3">Tahap</th>
                  <th className="px-3.5 py-3">Produk & Brand</th>
                  <th className="px-3.5 py-3">Mesin / Line</th>
                  <th className="px-3.5 py-3 text-right">Target</th>
                  <th className="px-3.5 py-3">Periode</th>
                  <th className="px-3.5 py-3">Operator</th>
                  <th className="px-3.5 py-3">Progress</th>
                  <th className="px-3.5 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSchedules.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-3.5 py-3">
                      <div className="font-semibold text-slate-800">{item.code}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{item.spkCode}</div>
                    </td>
                    <td className="px-3.5 py-3">
                      <DnaBadge variant={STAGE_CONFIG[item.stage]?.badge || "info"}>
                        {STAGE_CONFIG[item.stage]?.label}
                      </DnaBadge>
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="font-medium text-slate-900">{item.productName}</div>
                      <div className="text-[10px] text-slate-500">{item.brandName}</div>
                    </td>
                    <td className="px-3.5 py-3 font-medium text-slate-700">{item.machineName}</td>
                    <td className="px-3.5 py-3 text-right font-semibold text-slate-800">
                      {item.targetQty.toLocaleString()} {item.unit}
                    </td>
                    <td className="px-3.5 py-3 text-[11px] text-slate-600">
                      {item.startDate} s/d {item.endDate}
                    </td>
                    <td className="px-3.5 py-3 text-slate-700">{item.operator}</td>
                    <td className="px-3.5 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 bg-slate-100 rounded-full h-1.5">
                          <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${item.progressPct}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-700">{item.progressPct}%</span>
                      </div>
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <DnaButton variant="secondary" size="sm" onClick={() => setDetailItem(item)}>
                        <Eye className="w-3.5 h-3.5" />
                      </DnaButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DnaDataTableCard>

      {/* MODAL BUAT JADWAL BARU */}
      <DnaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Buat Jadwal Produksi Lini"
        size="lg"
      >
        <form onSubmit={handleCreateSchedule} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                No. SPK Terkait <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: SPK-2026-0042"
                value={formSpk}
                onChange={(e) => setFormSpk(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Produk <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Niacinamide Serum"
                value={formProduct}
                onChange={(e) => setFormProduct(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tahap Produksi</label>
              <select
                value={formStage}
                onChange={(e) => setFormStage(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="MIXING">1. Mixing (Ruahan)</option>
                <option value="FILLING">2. Filling (Primer)</option>
                <option value="PACKAGING">3. Packaging (Sekunder)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mesin / Lini Alokasi</label>
              <select
                value={formMachine}
                onChange={(e) => setFormMachine(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Homogenizer Vessel 500L (MIX-01)">Homogenizer Vessel 500L (MIX-01)</option>
                <option value="High Shear Mixer 1000L (MIX-02)">High Shear Mixer 1000L (MIX-02)</option>
                <option value="Rotary Auto Filling Line 2 (FIL-02)">Rotary Auto Filling Line 2 (FIL-02)</option>
                <option value="Semi-Auto Jar Filling Line (FIL-01)">Semi-Auto Jar Filling Line (FIL-01)</option>
                <option value="Conveyor Line 1 + Shrink Tunnel (PCK-01)">Conveyor Line 1 + Shrink Tunnel (PCK-01)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Qty</label>
              <input
                type="number"
                min="1"
                required
                value={formTargetQty}
                onChange={(e) => setFormTargetQty(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Operator Penanggung Jawab</label>
              <input
                type="text"
                value={formOperator}
                onChange={(e) => setFormOperator(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Mulai</label>
              <input
                type="date"
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Selesai</label>
              <input
                type="date"
                value={formEndDate}
                onChange={(e) => setFormEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Instruksi Khusus Jadwal</label>
            <textarea
              rows={2}
              placeholder="Catatan setup mesin, sanitasi bejana, atau pergantian tooling..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <DnaButton type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton type="submit" variant="primary">
              Simpan Jadwal
            </DnaButton>
          </div>
        </form>
      </DnaModal>

      {/* MODAL DETAIL JADWAL */}
      <DnaModal
        isOpen={!!detailItem}
        onClose={() => setDetailItem(null)}
        title={`Detail Jadwal: ${detailItem?.code}`}
        size="md"
      >
        {detailItem && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900">{detailItem.code}</span>
                <DnaBadge variant={STAGE_CONFIG[detailItem.stage]?.badge || "info"}>
                  {STAGE_CONFIG[detailItem.stage]?.label}
                </DnaBadge>
              </div>
              <div className="font-semibold text-slate-800">{detailItem.productName} ({detailItem.brandName})</div>
              <div className="text-slate-500">No. SPK: <span className="font-mono font-medium text-slate-700">{detailItem.spkCode}</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-white border border-slate-100 rounded-lg">
              <div>
                <div className="text-slate-400 text-[10px] uppercase font-semibold">Mesin / Line</div>
                <div className="font-semibold text-slate-800">{detailItem.machineName}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px] uppercase font-semibold">Target Produksi</div>
                <div className="font-bold text-indigo-700">{detailItem.targetQty.toLocaleString()} {detailItem.unit}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px] uppercase font-semibold">Periode Pelaksanaan</div>
                <div className="font-medium text-slate-700">{detailItem.startDate} s/d {detailItem.endDate}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px] uppercase font-semibold">Operator PIC</div>
                <div className="font-medium text-slate-700">{detailItem.operator}</div>
              </div>
            </div>

            {detailItem.notes && (
              <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-900">
                <div className="font-semibold text-[11px] mb-0.5">Catatan Instruksi:</div>
                <div>{detailItem.notes}</div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <DnaButton variant="primary" size="sm" onClick={() => setDetailItem(null)}>
                Tutup
              </DnaButton>
            </div>
          </div>
        )}
      </DnaModal>
    </DnaPageContainer>
  );
}
