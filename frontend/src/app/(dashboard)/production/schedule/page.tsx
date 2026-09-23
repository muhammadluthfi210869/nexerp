"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Calendar,
  FlaskConical,
  Package,
  Zap,
  Plus,
  Eye,
  ArrowRight,
  Clock,
  CheckCircle2,
  FileSpreadsheet
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaDetailDrawer,
  DnaModal,
  DnaInput,
  useDnaToast
} from "@/components/dna";
import Link from "next/link";

interface ProductionScheduleItem {
  id: string;
  code: string;
  spkCode: string;
  batchNumber: string;
  customerName: string;
  brandName: string;
  productName: string;
  stage: "MIXING" | "FILLING" | "PACKAGING";
  machineName: string;
  startDate: string;
  endDate: string;
  targetQty: number;
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
  }
];

const STAGE_CONFIG: Record<string, { label: string; badge: "info" | "purple" | "warning"; icon: any }> = {
  MIXING: { label: "Mixing", badge: "info", icon: FlaskConical },
  FILLING: { label: "Filling", badge: "purple", icon: Zap },
  PACKAGING: { label: "Packaging", badge: "warning", icon: Package },
};

export default function ProductionSchedulePage() {
  const toast = useDnaToast();
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"GANTT" | "TABLE">("GANTT");

  // Modals & Drawer state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<ProductionScheduleItem | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

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

  const { data: serverSchedules, isLoading } = useQuery({
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
  }, [schedules, activeTab, searchQuery]);

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

    setLocalSchedules([newSch, ...schedules]);
    setIsCreateModalOpen(false);
    toast.success("Jadwal Berhasil Diterbitkan", `Jadwal ${newSch.code} untuk lini ${newSch.stage} telah diagendakan.`);
  };

  return (
    <DnaPageContainer>
      {/* 1. Header Page with Unified Top-Right Tabs */}
      <DnaPageHeader
        title="Jadwal Produksi & Timeline (Gantt)"
        description="Visualisasi timeline alokasi mesin, kapasitas lini, dan urutan tahapan produksi fisik maklon kosmetik."
        badge={<DnaBadge variant="neutral">GANTT-FLOW</DnaBadge>}
        breadcrumbs={[
          { label: "Produksi Pabrik", href: "/production" },
          { label: "Jadwal Produksi", href: "/production/schedule" }
        ]}
        tabs={[
          { id: "ALL", label: `Semua (${schedules.length})` },
          { id: "MIXING", label: `Mixing (${mixingCount})` },
          { id: "FILLING", label: `Filling (${fillingCount})` },
          { id: "PACKAGING", label: `Packaging (${packingCount})` }
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode("GANTT")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  viewMode === "GANTT" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Gantt Timeline
              </button>
              <button
                onClick={() => setViewMode("TABLE")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  viewMode === "TABLE" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Tabel Jadwal
              </button>
            </div>
            <DnaButton variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Buat Jadwal Baru
            </DnaButton>
          </div>
        }
      />

      {/* 2. KPI Grid */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="TOTAL JADWAL AKTIF"
          value={`${totalActive} Slot`}
          icon={<Calendar className="w-5 h-5 text-indigo-600" />}
          subValue="Kapasitas Utilitas 84%"
        />
        <DnaStatCard
          label="LINI MIXING"
          value={`${mixingCount} Bejana`}
          icon={<FlaskConical className="w-5 h-5 text-blue-600" />}
          subValue="Bejana Homogenizer"
        />
        <DnaStatCard
          label="LINI FILLING"
          value={`${fillingCount} Line`}
          icon={<Zap className="w-5 h-5 text-purple-600" />}
          subValue="Rotary & Semi-Auto"
        />
        <DnaStatCard
          label="LINI PACKAGING"
          value={`${packingCount} Line`}
          icon={<Package className="w-5 h-5 text-amber-600" />}
          subValue="Shrink & Sekunder"
        />
      </DnaKpiGrid>

      {/* 3. Main Container Card (Zero redundant title, zero horizontal scroll) */}
      <DnaDataTableCard
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari Jadwal, SPK, Produk, Brand..."
      >
        {viewMode === "GANTT" ? (
          /* GANTT TIMELINE VIEW */
          <div className="space-y-3 p-1">
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
                    className="p-4 bg-white border border-slate-200 rounded-xl hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Left Info */}
                    <div className="min-w-[260px] space-y-1">
                      <div className="flex items-center gap-2">
                        <DnaBadge variant={config.badge}>
                          <Icon className="w-3 h-3 mr-1" />
                          {config.label}
                        </DnaBadge>
                        <span className="font-bold text-xs text-slate-900">{item.code}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({item.spkCode})</span>
                      </div>
                      <div className="font-semibold text-xs text-slate-900">{item.productName}</div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {item.brandName} • <span className="text-indigo-600 font-mono">{item.machineName}</span>
                      </div>
                    </div>

                    {/* Middle Timeline & Progress */}
                    <div className="flex-1 max-w-md space-y-1.5">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {item.startDate} s/d {item.endDate}
                        </span>
                        <span className="font-mono">{item.progressPct}% • {item.targetQty.toLocaleString()} {item.unit}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            item.stage === "MIXING"
                              ? "bg-blue-600"
                              : item.stage === "FILLING"
                              ? "bg-purple-600"
                              : "bg-amber-600"
                          }`}
                          style={{ width: `${Math.max(item.progressPct, 5)}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center justify-between">
                        <span>Operator: {item.operator}</span>
                        <span className="italic truncate max-w-xs">{item.notes}</span>
                      </div>
                    </div>

                    {/* Right Action */}
                    <div className="flex items-center gap-2 shrink-0">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDetailItem(item);
                          setIsDetailDrawerOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4 text-slate-600" />
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
          <div className="w-full">
            <table className="w-full text-left text-xs table-fixed">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-[18%]">No. Jadwal & SPK</th>
                  <th className="py-3 px-4 w-[24%]">Tahap & Mesin</th>
                  <th className="py-3 px-4 w-[26%]">Produk & Brand</th>
                  <th className="py-3 px-4 w-[18%]">Periode & Operator</th>
                  <th className="py-3 px-4 w-[10%]">Target & Output</th>
                  <th className="py-3 px-4 w-[4%] text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSchedules.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 truncate">
                      <p className="font-mono text-xs font-bold text-slate-900 truncate">{item.code}</p>
                      <p className="text-[11px] text-slate-500 font-mono truncate">{item.spkCode}</p>
                    </td>
                    <td className="py-3 px-4 truncate">
                      <DnaBadge variant={STAGE_CONFIG[item.stage]?.badge || "info"}>
                        {STAGE_CONFIG[item.stage]?.label}
                      </DnaBadge>
                      <p className="text-[11px] text-slate-500 font-mono truncate mt-0.5">{item.machineName}</p>
                    </td>
                    <td className="py-3 px-4 truncate">
                      <p className="font-semibold text-slate-900 text-xs truncate">{item.productName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{item.brandName}</p>
                    </td>
                    <td className="py-3 px-4 truncate">
                      <p className="font-mono text-xs text-slate-700 truncate">{item.startDate} s/d {item.endDate}</p>
                      <p className="text-[11px] text-slate-400 truncate">{item.operator}</p>
                    </td>
                    <td className="py-3 px-4 truncate">
                      <p className="font-mono font-bold text-slate-900 text-xs truncate">
                        {item.targetQty.toLocaleString()} {item.unit}
                      </p>
                      <p className="text-[11px] text-indigo-600 font-mono truncate">{item.progressPct}% Selesai</p>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDetailItem(item);
                          setIsDetailDrawerOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4 text-slate-600" />
                      </DnaButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DnaDataTableCard>

      {/* 4. Modal Buat Jadwal Baru */}
      <DnaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Buat Jadwal Produksi Lini"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" onClick={handleCreateSchedule}>
              Simpan Jadwal
            </DnaButton>
          </div>
        }
      >
        <form onSubmit={handleCreateSchedule} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">
                No. SPK Terkait <span className="text-rose-500">*</span>
              </label>
              <DnaInput
                placeholder="SPK-2026-0042"
                value={formSpk}
                onChange={(e) => setFormSpk(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">
                Nama Produk <span className="text-rose-500">*</span>
              </label>
              <DnaInput
                placeholder="Niacinamide Glow Serum"
                value={formProduct}
                onChange={(e) => setFormProduct(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Tahapan Produksi</label>
              <select
                value={formStage}
                onChange={(e) => setFormStage(e.target.value as any)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-800"
              >
                <option value="MIXING">Mixing (Ruahan)</option>
                <option value="FILLING">Filling (Primer)</option>
                <option value="PACKAGING">Packaging (Sekunder)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Mesin / Line</label>
              <DnaInput
                value={formMachine}
                onChange={(e) => setFormMachine(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Tanggal Mulai</label>
              <DnaInput
                type="date"
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Tanggal Selesai</label>
              <DnaInput
                type="date"
                value={formEndDate}
                onChange={(e) => setFormEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Target Qty</label>
              <DnaInput
                type="number"
                value={formTargetQty.toString()}
                onChange={(e) => setFormTargetQty(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">PIC Operator</label>
              <DnaInput
                value={formOperator}
                onChange={(e) => setFormOperator(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">Catatan Khusus</label>
            <DnaInput
              placeholder="Instruksi mesin, kebersihan bejana, dll..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
            />
          </div>
        </form>
      </DnaModal>

      {/* 5. Quick Peek Drawer (Rule 5) */}
      <DnaDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        title={detailItem?.code || "Detail Jadwal Produksi"}
        subtitle={detailItem ? `${detailItem.productName} • ${detailItem.brandName}` : undefined}
        badge={detailItem ? <DnaBadge variant={STAGE_CONFIG[detailItem.stage]?.badge || "info"}>{STAGE_CONFIG[detailItem.stage]?.label}</DnaBadge> : undefined}
        tabs={[
          {
            id: "summary",
            label: "Ringkasan Jadwal",
            content: detailItem ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-slate-900">{detailItem.code}</span>
                    <span className="font-mono text-slate-500">{detailItem.spkCode}</span>
                  </div>
                  <p className="font-bold text-slate-900 text-sm">{detailItem.productName}</p>
                  <p className="text-slate-600">{detailItem.customerName} ({detailItem.brandName})</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 block mb-1">Target Produksi</span>
                    <p className="font-mono font-bold text-slate-900 text-sm">{detailItem.targetQty.toLocaleString()} {detailItem.unit}</p>
                    <span className="text-[10px] text-slate-400">Progress: {detailItem.progressPct}%</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 block mb-1">Alokasi Mesin</span>
                    <p className="font-bold text-indigo-700">{detailItem.machineName}</p>
                    <span className="text-[10px] text-slate-400">Operator: {detailItem.operator}</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                  <span className="text-slate-500 block">Jadwal Pelaksanaan</span>
                  <div className="flex justify-between font-mono text-slate-800">
                    <span>Mulai: {detailItem.startDate}</span>
                    <span>Selesai: {detailItem.endDate}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-700">Catatan Pengerjaan:</span>
                  <p className="text-slate-600">{detailItem.notes || "Tidak ada catatan khusus."}</p>
                </div>
              </div>
            ) : null
          }
        ]}
        footerActions={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton variant="secondary" onClick={() => setIsDetailDrawerOpen(false)}>
              Tutup
            </DnaButton>
            {detailItem && (
              <Link
                href={
                  detailItem.stage === "MIXING"
                    ? "/production/mixing"
                    : detailItem.stage === "FILLING"
                    ? "/production/filling"
                    : "/production/packaging"
                }
              >
                <DnaButton variant="primary">
                  Eksekusi Lini
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </DnaButton>
              </Link>
            )}
          </div>
        }
      />
    </DnaPageContainer>
  );
}
