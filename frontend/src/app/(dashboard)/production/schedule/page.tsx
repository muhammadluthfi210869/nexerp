"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  useDnaToast,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  MixingSchedulePrintModal,
  PackagingSchedulePrintModal,
} from "@/components/dna";
import { Printer } from "lucide-react";
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

const mapToItem = (s: any, idx: number): ProductionScheduleItem => ({
  id: s.id,
  code: s.scheduleCode || `SCH-${s.stage?.slice(0, 3) || "PRD"}-${String(idx + 1).padStart(3, "0")}`,
  spkCode: s.workOrder?.woNumber || "SPK-PROD",
  batchNumber: s.batchRecord?.batchNo || s.workOrder?.woNumber || `BATCH-${s.id.slice(0, 6)}`,
  customerName: s.workOrder?.lead?.clientName || "Klien Maklon",
  brandName: s.workOrder?.lead?.brandName || "Brand",
  productName: s.workOrder?.productName || "Produk",
  stage: (s.stage === "FILLING" ? "FILLING" : (s.stage === "PACKAGING" || s.stage === "PACKING" ? "PACKAGING" : "MIXING")),
  machineName: s.machine?.name || "Mesin Standar",
  startDate: s.startTime ? s.startTime.slice(0, 10) : "-",
  endDate: s.endTime ? s.endTime.slice(0, 10) : "-",
  targetQty: Number(s.targetQty) || 0,
  unit: s.stage === "MIXING" ? "Kg" : "PCS",
  operator: s.operatorName || "Operator Produksi",
  progressPct: s.status === "COMPLETED" ? 100 : (s.status === "IN_PROGRESS" ? 50 : 0),
  status: s.status || "SCHEDULED",
  notes: s.notes || "",
});

const STAGE_CONFIG: Record<string, { label: string; badge: "info" | "purple" | "warning"; icon: any }> = {
  MIXING: { label: "Mixing", badge: "info", icon: FlaskConical },
  FILLING: { label: "Filling", badge: "purple", icon: Zap },
  PACKAGING: { label: "Packaging", badge: "warning", icon: Package },
};

export default function ProductionSchedulePage() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"GANTT" | "TABLE">("GANTT");

  // Modals & Drawer state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<ProductionScheduleItem | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrintScheduleModalOpen, setIsPrintScheduleModalOpen] = useState(false);

  // Form states
  const [formWorkOrderId, setFormWorkOrderId] = useState("");
  const [formMachineId, setFormMachineId] = useState("");
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

  const { data: serverSchedules = [], isLoading } = useQuery({
    queryKey: ["production-schedules"],
    queryFn: async () => {
      try {
        const res = await api.get("/production/schedules");
        const unwrapped = unwrapResponse(res);
        if (Array.isArray(unwrapped)) {
          return unwrapped.map(mapToItem);
        }
        return [];
      } catch (err) {
        return [];
      }
    }
  });

  const { data: machines = [] } = useQuery({
    queryKey: ["production-schedule-machines"],
    queryFn: async () => {
      try {
        const res = await api.get("/production/machines");
        return unwrapResponse(res) || [];
      } catch {
        return [];
      }
    }
  });

  const { data: workOrders = [] } = useQuery({
    queryKey: ["production-schedule-wos"],
    queryFn: async () => {
      try {
        const res = await api.get("/production/work-orders");
        return unwrapResponse(res) || [];
      } catch {
        return [];
      }
    }
  });

  const schedules = serverSchedules;

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

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const wo = workOrders.find((w: any) => w.id === formWorkOrderId || w.woNumber === formSpk);
    const workOrderId = wo?.id || formWorkOrderId || (workOrders[0]?.id || "");
    const machine = machines.find((m: any) => m.id === formMachineId || m.name === formMachine);
    const machineId = machine?.id || formMachineId || (machines[0]?.id || "");

    if (!workOrderId || !machineId) {
      toast.error("Validasi Gagal", "Pilih Work Order / SPK dan Mesin produksi yang valid.");
      return;
    }

    try {
      setIsSubmitting(true);
      const startParsed = new Date(formStartDate);
      const validStart = isNaN(startParsed.getTime()) ? new Date() : startParsed;
      const endParsed = new Date(formEndDate);
      const validEnd = isNaN(endParsed.getTime()) ? new Date(validStart.getTime() + 4 * 3600 * 1000) : endParsed;

      await api.post("/production/schedules", {
        workOrderId,
        machineId,
        stage: formStage,
        startTime: validStart.toISOString(),
        endTime: validEnd.toISOString(),
        targetQty: Number(formTargetQty) || 1000,
        notes: formNotes || undefined,
      });

      queryClient.invalidateQueries({ queryKey: ["production-schedules"] });
      setIsCreateModalOpen(false);
      toast.success("Jadwal Berhasil Diterbitkan", `Jadwal ${formStage} telah diagendakan ke sistem.`);
    } catch (err: any) {
      toast.error("Gagal Menerbitkan Jadwal", err?.response?.data?.message || "Terjadi kesalahan pada server.");
    } finally {
      setIsSubmitting(false);
    }
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
                        <span className="text-[10px] text-slate-400 tabular-nums">({item.spkCode})</span>
                      </div>
                      <div className="font-semibold text-xs text-slate-900">{item.productName}</div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {item.brandName} • <span className="text-indigo-600 tabular-nums">{item.machineName}</span>
                      </div>
                    </div>

                    {/* Middle Timeline & Progress */}
                    <div className="flex-1 max-w-md space-y-1.5">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                        <span className="flex items-center gap-1 tabular-nums">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {item.startDate} s/d {item.endDate}
                        </span>
                        <span className="tabular-nums">{item.progressPct}% • {item.targetQty.toLocaleString()} {item.unit}</span>
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
                    <div className="flex items-center gap-1.5 shrink-0">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDetailItem(item);
                          setIsPrintScheduleModalOpen(true);
                        }}
                        className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600"
                        title="Cetak Jadwal Produksi"
                      >
                        <Printer className="w-4 h-4 text-blue-600" />
                      </DnaButton>

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
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow>
                  <DnaTh className="py-3 px-4 w-[18%]">No. Jadwal & SPK</DnaTh>
                  <DnaTh className="py-3 px-4 w-[24%]">Tahap & Mesin</DnaTh>
                  <DnaTh className="py-3 px-4 w-[26%]">Produk & Brand</DnaTh>
                  <DnaTh className="py-3 px-4 w-[18%]">Periode & Operator</DnaTh>
                  <DnaTh className="py-3 px-4 w-[10%]">Target & Output</DnaTh>
                  <DnaTh className="py-3 px-4 w-[4%] text-right">Aksi</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {filteredSchedules.length === 0 ? (
                  <DnaTableRow>
                    <DnaTd colSpan={6} className="py-12 text-center text-xs text-slate-400">
                      Tidak ada jadwal produksi yang cocok dengan filter.
                    </DnaTd>
                  </DnaTableRow>
                ) : (
                  filteredSchedules.map((item) => (
                    <DnaTableRow key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <DnaTd className="py-3 px-4 truncate">
                        <p className="tabular-nums text-xs font-bold text-slate-900 truncate">{item.code}</p>
                        <p className="text-[11px] text-slate-500 tabular-nums truncate">{item.spkCode}</p>
                      </DnaTd>
                      <DnaTd className="py-3 px-4 truncate">
                        <DnaBadge variant={STAGE_CONFIG[item.stage]?.badge || "info"}>
                          {STAGE_CONFIG[item.stage]?.label}
                        </DnaBadge>
                        <p className="text-[11px] text-slate-500 tabular-nums truncate mt-0.5">{item.machineName}</p>
                      </DnaTd>
                      <DnaTd className="py-3 px-4 truncate">
                        <p className="font-semibold text-slate-900 text-xs truncate">{item.productName}</p>
                        <p className="text-[11px] text-slate-500 truncate">{item.brandName}</p>
                      </DnaTd>
                      <DnaTd className="py-3 px-4 truncate">
                        <p className="tabular-nums text-xs text-slate-700 truncate">{item.startDate} s/d {item.endDate}</p>
                        <p className="text-[11px] text-slate-400 truncate">{item.operator}</p>
                      </DnaTd>
                      <DnaTd className="py-3 px-4 truncate">
                        <p className="tabular-nums font-bold text-slate-900 text-xs truncate">
                          {item.targetQty.toLocaleString()} {item.unit}
                        </p>
                        <p className="text-[11px] text-indigo-600 tabular-nums truncate">{item.progressPct}% Selesai</p>
                      </DnaTd>
                      <DnaTd className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <DnaButton
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDetailItem(item);
                              setIsPrintScheduleModalOpen(true);
                            }}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600"
                            title="Cetak Jadwal Produksi"
                          >
                            <Printer className="w-3.5 h-3.5 text-blue-600" />
                          </DnaButton>
                          <DnaButton
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDetailItem(item);
                              setIsDetailDrawerOpen(true);
                            }}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600"
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4 text-slate-600" />
                          </DnaButton>
                        </div>
                      </DnaTd>
                    </DnaTableRow>
                  ))
                )}
              </DnaTableBody>
            </DnaTable>
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
            <DnaButton variant="primary" onClick={handleCreateSchedule} disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan Jadwal"}
            </DnaButton>
          </div>
        }
      >
        <form onSubmit={handleCreateSchedule} className="space-y-3 text-xs">
          {workOrders.length > 0 && (
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Pilih Work Order / SPK</label>
              <select
                aria-label="Pilih Work Order / SPK"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-800"
                value={formWorkOrderId}
                onChange={(e) => {
                  const wo = workOrders.find((w: any) => w.id === e.target.value);
                  setFormWorkOrderId(e.target.value);
                  if (wo) {
                    setFormSpk(wo.woNumber);
                    setFormProduct(wo.productName || "");
                    if (wo.targetQty) setFormTargetQty(Number(wo.targetQty));
                  }
                }}
              >
                <option value="">-- Pilih Work Order --</option>
                {workOrders.map((wo: any) => (
                  <option key={wo.id} value={wo.id}>
                    {wo.woNumber} - {wo.productName} ({wo.targetQty} Pcs)
                  </option>
                ))}
              </select>
            </div>
          )}

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
                aria-label="Tahapan Produksi"
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
              {machines.length > 0 ? (
                <select
                  aria-label="Mesin / Line"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-800"
                  value={formMachineId}
                  onChange={(e) => {
                    const m = machines.find((item: any) => item.id === e.target.value);
                    setFormMachineId(e.target.value);
                    if (m) setFormMachine(m.name);
                  }}
                >
                  <option value="">-- Pilih Mesin --</option>
                  {machines.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.machineCode})
                    </option>
                  ))}
                </select>
              ) : (
                <DnaInput
                  value={formMachine}
                  onChange={(e) => setFormMachine(e.target.value)}
                />
              )}
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
                    <span className="tabular-nums font-bold text-slate-900">{detailItem.code}</span>
                    <span className="tabular-nums text-slate-500">{detailItem.spkCode}</span>
                  </div>
                  <p className="font-bold text-slate-900 text-sm">{detailItem.productName}</p>
                  <p className="text-slate-600">{detailItem.customerName} ({detailItem.brandName})</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 block mb-1">Target Produksi</span>
                    <p className="tabular-nums font-bold text-slate-900 text-sm">{detailItem.targetQty.toLocaleString()} {detailItem.unit}</p>
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
                  <div className="flex justify-between tabular-nums text-slate-800">
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
            <DnaButton
              variant="outline"
              onClick={() => setIsPrintScheduleModalOpen(true)}
            >
              <Printer className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
              Cetak Jadwal
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

      {/* Modal Cetak Jadwal Mixing (Upscale Formula) */}
      <MixingSchedulePrintModal
        isOpen={isPrintScheduleModalOpen && detailItem?.stage === "MIXING"}
        onClose={() => setIsPrintScheduleModalOpen(false)}
        data={
          detailItem && detailItem.stage === "MIXING"
            ? {
                scheduleCode: detailItem.code,
                date: detailItem.startDate,
                status: detailItem.status,
                batchCode: detailItem.batchNumber,
                soCode: detailItem.spkCode,
                customerName: detailItem.customerName,
                productName: detailItem.productName,
                createdBy: detailItem.operator,
                targetQtyPcs: detailItem.targetQty,
                nettoPerPcs: 30,
                baseResultMl: detailItem.targetQty * 30,
                upscalePercent: 5,
                hasilUpscaleMl: Math.round(detailItem.targetQty * 30 * 1.05),
              }
            : null
        }
      />

      {/* Modal Cetak Jadwal Packaging (Kemasan Sekunder) */}
      <PackagingSchedulePrintModal
        isOpen={isPrintScheduleModalOpen && detailItem?.stage !== "MIXING"}
        onClose={() => setIsPrintScheduleModalOpen(false)}
        data={
          detailItem && detailItem.stage !== "MIXING"
            ? {
                scheduleCode: detailItem.code,
                date: detailItem.startDate,
                status: detailItem.status,
                batchCode: detailItem.batchNumber,
                soCode: detailItem.spkCode,
                customerName: detailItem.customerName,
                productName: detailItem.productName,
                createdBy: detailItem.operator,
                targetQtyPcs: detailItem.targetQty,
                secondaryPackaging: [
                  {
                    code: "BOX-001",
                    name: `Inner Box Primer ${detailItem.productName}`,
                    qty: detailItem.targetQty,
                    unit: "PCS",
                  },
                  {
                    code: "MBOX-001",
                    name: `Master Carton Corrugated (Isi 48 PCS)`,
                    qty: Math.ceil(detailItem.targetQty / 48),
                    unit: "BOX",
                  },
                ],
              }
            : null
        }
      />
    </DnaPageContainer>
  );
}
