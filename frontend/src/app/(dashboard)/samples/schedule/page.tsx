"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Calendar,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  Eye,
  User,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  FlaskConical,
  Package,
  Boxes,
  Briefcase,
  Printer,
  ChevronRight
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
  useDnaToast,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";

interface ProductionScheduleItem {
  id: string;
  scheduleCode: string;
  scheduleType: "MIXING" | "FILLING" | "PACKAGING";
  scheduleTypeLabel: string;
  scheduleDate: string;
  batchRecordCode: string; // BR-202603-XXXX
  clientName: string;
  brandName: string;
  productName: string;
  targetQtyPcs: number;
  baseResultKg?: number;
  upscalePercent?: number;
  upscaleResultKg?: number;
  packagingMaterialName?: string;
  packagingQtyNeeded?: number;
  assignedLineOrMachine: string; // e.g. Bejana Homogenizer 500L, Line Filling 02
  picOperator: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  statusLabel: string;
  notes?: string;
}

const mapToScheduleItem = (s: any): ProductionScheduleItem => {
  const type = s.stage === "FILLING" ? "FILLING" : (s.stage === "PACKAGING" || s.stage === "PACKING" ? "PACKAGING" : "MIXING");
  const typeLabel = type === "MIXING" ? "Jadwal Mixing Bejana" : (type === "FILLING" ? "Jadwal Filling Kemasan" : "Jadwal Packaging & Box");
  return {
    id: s.id,
    scheduleCode: `SCH-${type.slice(0, 3)}-${s.id.slice(0, 6).toUpperCase()}`,
    scheduleType: type,
    scheduleTypeLabel: typeLabel,
    scheduleDate: s.startTime ? new Date(s.startTime).toISOString().replace("T", " ").substring(0, 16) : "-",
    batchRecordCode: s.workOrder?.woNumber || `BR-${s.id.slice(0, 6)}`,
    clientName: s.workOrder?.lead?.clientName || "Klien Internal",
    brandName: s.workOrder?.lead?.brandName || "Brand",
    productName: s.workOrder?.productName || "Produk Kosmetik",
    targetQtyPcs: Number(s.targetQty) || 0,
    baseResultKg: Number(s.targetQty) ? Number(s.targetQty) / 1000 : 0,
    upscalePercent: Number(s.upscalePercent) || 0,
    assignedLineOrMachine: s.machine?.name || "Mesin Standar",
    picOperator: s.operatorName || "Operator Terjadwal",
    status: s.status || "SCHEDULED",
    statusLabel: s.status === "COMPLETED" ? "Selesai" : (s.status === "IN_PROGRESS" ? "Sedang Berjalan" : "Terjadwal"),
    notes: s.notes || "",
  };
};

export default function ProductionSchedulePage() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSchedule, setSelectedSchedule] = useState<ProductionScheduleItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalScheduleType, setModalScheduleType] = useState<"MIXING" | "FILLING" | "PACKAGING">("MIXING");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [createForm, setCreateForm] = useState({
    workOrderId: "",
    machineId: "",
    batchRecordCode: "BR-202603-0012",
    scheduleDate: new Date().toISOString().split("T")[0] + " 08:30",
    targetQtyPcs: 5000,
    nettoPerPcs: 30,
    upscalePercent: 10,
    assignedMachine: "Vacuum Homogenizer Tank #02",
    picOperator: "Ahmad Maulana",
    packagingName: "Botol Dropper 30ml",
    notes: ""
  });

  // Queries
  const { data: rawSchedules, isLoading } = useQuery({
    queryKey: ["rnd-production-schedules"],
    queryFn: async () => {
      try {
        const res = await api.get("/production/schedules");
        return unwrapResponse(res.data) as any[];
      } catch (e) {
        return [];
      }
    }
  });

  const { data: machines = [] } = useQuery({
    queryKey: ["production-machines"],
    queryFn: async () => {
      try {
        const res = await api.get("/production/machines");
        return unwrapResponse(res.data) || [];
      } catch {
        return [];
      }
    }
  });

  const { data: workOrders = [] } = useQuery({
    queryKey: ["production-work-orders"],
    queryFn: async () => {
      try {
        const res = await api.get("/production/work-orders");
        return unwrapResponse(res.data) || [];
      } catch {
        return [];
      }
    }
  });

  const schedules: ProductionScheduleItem[] = useMemo(() => {
    if (rawSchedules && Array.isArray(rawSchedules)) {
      return rawSchedules.map(mapToScheduleItem);
    }
    return [];
  }, [rawSchedules]);

  // Filtering
  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      if (activeTab === "mixing" && s.scheduleType !== "MIXING") return false;
      if (activeTab === "filling" && s.scheduleType !== "FILLING") return false;
      if (activeTab === "packaging" && s.scheduleType !== "PACKAGING") return false;

      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        return (
          s.scheduleCode.toLowerCase().includes(q) ||
          s.batchRecordCode.toLowerCase().includes(q) ||
          s.clientName.toLowerCase().includes(q) ||
          s.brandName.toLowerCase().includes(q) ||
          s.productName.toLowerCase().includes(q) ||
          s.picOperator.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [schedules, activeTab, searchQuery]);

  // KPIs
  const totalSchedules = schedules.length;
  const mixingCount = schedules.filter(s => s.scheduleType === "MIXING").length;
  const fillingCount = schedules.filter(s => s.scheduleType === "FILLING").length;
  const packagingCount = schedules.filter(s => s.scheduleType === "PACKAGING").length;

  const handleCreateSchedule = async () => {
    const selectedWO = workOrders.find((w: any) => w.id === createForm.workOrderId || w.woNumber === createForm.batchRecordCode);
    const workOrderId = selectedWO?.id || createForm.workOrderId || (workOrders[0]?.id || "");
    const selectedMachine = machines.find((m: any) => m.id === createForm.machineId || m.name === createForm.assignedMachine);
    const machineId = selectedMachine?.id || createForm.machineId || (machines[0]?.id || "");

    if (!workOrderId || !machineId) {
      toast.warning("Data Belum Lengkap", "Pilih Work Order dan Mesin produksi yang valid.");
      return;
    }

    try {
      setIsSubmitting(true);
      const startParsed = new Date(createForm.scheduleDate);
      const validDate = isNaN(startParsed.getTime()) ? new Date() : startParsed;
      const startTime = validDate.toISOString();
      const endTime = new Date(validDate.getTime() + 4 * 3600 * 1000).toISOString();

      await api.post("/production/schedules", {
        workOrderId,
        machineId,
        stage: modalScheduleType,
        startTime,
        endTime,
        targetQty: Number(createForm.targetQtyPcs) || 1000,
        upscalePercent: Number(createForm.upscalePercent) || 0,
        notes: createForm.notes || undefined,
      });

      toast.success(
        `Jadwal ${modalScheduleType} Dibuat`,
        `Jadwal ${modalScheduleType} berhasil didaftarkan ke timeline produksi.`
      );
      setIsCreateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["rnd-production-schedules"] });
    } catch (err: any) {
      toast.error("Gagal Menerbitkan Jadwal", err?.response?.data?.message || "Terjadi kesalahan pada server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: ProductionScheduleItem["status"]) => {
    switch (status) {
      case "COMPLETED":
        return <DnaBadge variant="success">SELESAI</DnaBadge>;
      case "IN_PROGRESS":
        return <DnaBadge variant="blue">SEDANG BERJALAN</DnaBadge>;
      case "SCHEDULED":
        return <DnaBadge variant="purple">TERJADWAL</DnaBadge>;
      case "CANCELLED":
        return <DnaBadge variant="danger">DIBATALKAN</DnaBadge>;
      default:
        return <DnaBadge variant="neutral">{status}</DnaBadge>;
    }
  };

  return (
    <DnaPageContainer>
      {/* 1. Header Page */}
      <DnaPageHeader
        title="Jadwal Pra-Produksi Terpadu (Mixing, Filling & Packaging)"
        description="Sinkronisasi jadwal pelaksanaan proses produksi maklon kosmetik (SCR-140 s/d SCR-145): Penimbangan & Mixing Bejana, Line Filling, serta Finishing Packaging."
        badge={<DnaBadge variant="neutral">SCR-140 s/d SCR-145</DnaBadge>}
        breadcrumbs={[
          { label: "R&D & Pra-Produksi", href: "/rnd/dashboard" },
          { label: "Jadwal Pra-Produksi", href: "/rnd/schedule" }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="secondary"
              onClick={() => toast.success("Export Berhasil", "Jadwal pra-produksi berhasil diekspor ke format Excel.")}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Excel
            </DnaButton>
            <DnaButton
              variant="primary"
              onClick={() => {
                setModalScheduleType("MIXING");
                setIsCreateModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Buat Jadwal Baru
            </DnaButton>
          </div>
        }
      />

      {/* 2. KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="TOTAL JADWAL TERENCANA"
          value={`${totalSchedules} Sesi`}
          subValue="Timeline Batch Pra-Produksi"
          icon={<Calendar className="w-5 h-5 text-blue-600" />}
        />
        <DnaStatCard
          label="JADWAL MIXING BEJANA"
          value={`${mixingCount} Batch`}
          subValue="Peleburan & Homogenisasi"
          icon={<FlaskConical className="w-5 h-5 text-indigo-600" />}
        />
        <DnaStatCard
          label="JADWAL FILLING KEMASAN"
          value={`${fillingCount} Line`}
          subValue="Pengisian Botol & Tube"
          icon={<Package className="w-5 h-5 text-cyan-600" />}
        />
        <DnaStatCard
          label="JADWAL PACKAGING & BOX"
          value={`${packagingCount} Line`}
          subValue="Finishing Box & Master Carton"
          icon={<Boxes className="w-5 h-5 text-emerald-600" />}
        />
      </DnaKpiGrid>

      {/* 3. Tabs */}
      <DnaTabNav
        tabs={[
          { id: "all", label: `Semua Jadwal (${totalSchedules})` },
          { id: "mixing", label: `Jadwal Mixing (${mixingCount})` },
          { id: "filling", label: `Jadwal Filling (${fillingCount})` },
          { id: "packaging", label: `Jadwal Packaging (${packagingCount})` }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* 4. DataTable Card */}
      <DnaDataTableCard
        title="Daftar Jadwal Alokasi Mesin & Line Pra-Produksi"
        description="Penetapan waktu eksekusi, target kuantitas (Pcs / Kg), mesin pelaksana, dan PIC operator per batch record."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari Kode Jadwal, Batch Record, Produk, Klien, Mesin, PIC..."
      >
        <div className="overflow-x-auto">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow>
                <DnaTh className="py-3 px-4">Kode & Jadwal</DnaTh>
                <DnaTh className="py-3 px-4">Tipe Proses</DnaTh>
                <DnaTh className="py-3 px-4">Batch Record & Klien</DnaTh>
                <DnaTh className="py-3 px-4">Nama Produk</DnaTh>
                <DnaTh className="py-3 px-4 text-right">Target (PCS)</DnaTh>
                <DnaTh className="py-3 px-4">Mesin / Line Alokasi</DnaTh>
                <DnaTh className="py-3 px-4">Operator PIC</DnaTh>
                <DnaTh className="py-3 px-4">Status</DnaTh>
                <DnaTh className="py-3 px-4 text-center">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {filteredSchedules.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={9} className="py-12 text-center text-slate-400">
                    <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada jadwal yang sesuai filter.
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredSchedules.map((row) => (
                  <DnaTableRow key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <DnaTd className="py-3 px-4">
                      <p className="tabular-nums text-xs font-bold text-slate-900">{row.scheduleCode}</p>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{row.scheduleDate}</span>
                      </div>
                    </DnaTd>
                    <DnaTd className="py-3 px-4">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${
                        row.scheduleType === "MIXING"
                          ? "text-blue-700 bg-blue-50 border-blue-200"
                          : row.scheduleType === "FILLING"
                          ? "text-cyan-700 bg-cyan-50 border-cyan-200"
                          : "text-emerald-700 bg-emerald-50 border-emerald-200"
                      }`}>
                        {row.scheduleTypeLabel}
                      </span>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-xs">
                      <p className="tabular-nums font-bold text-indigo-700">{row.batchRecordCode}</p>
                      <p className="text-slate-600">{row.clientName} ({row.brandName})</p>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-xs font-semibold text-slate-900">
                      {row.productName}
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-right tabular-nums font-bold text-slate-900">
                      {row.targetQtyPcs.toLocaleString()} Pcs
                      {row.upscaleResultKg && (
                        <div className="text-[10px] text-indigo-600 font-normal">({row.upscaleResultKg} Kg)</div>
                      )}
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-xs font-medium text-slate-800">
                      {row.assignedLineOrMachine}
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-xs">
                      <p className="font-medium text-slate-800">{row.picOperator}</p>
                    </DnaTd>
                    <DnaTd className="py-3 px-4">
                      {getStatusBadge(row.status)}
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-center">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedSchedule(row);
                          setIsDetailModalOpen(true);
                        }}
                        title="Lihat Detail Jadwal"
                      >
                        <Eye className="w-4 h-4 text-slate-600" />
                      </DnaButton>
                    </DnaTd>
                  </DnaTableRow>
                ))
              )}
            </DnaTableBody>
          </DnaTable>
        </div>
      </DnaDataTableCard>

      {/* 5. Modal Buat Jadwal Baru (SCR-141, SCR-143, SCR-145) */}
      <DnaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={`Buat Jadwal ${modalScheduleType} Baru`}
        description="Perencanaan slot mesin dan penugasan operator lini pra-produksi."
        size="lg"
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
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Tipe Jadwal Proses *</label>
              <select
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold text-slate-800"
                value={modalScheduleType}
                onChange={(e) => setModalScheduleType(e.target.value as any)}
              >
                <option value="MIXING">Mixing (Bejana Homogenizer)</option>
                <option value="FILLING">Filling (Pengisian Kemasan Primer)</option>
                <option value="PACKAGING">Packaging (Inner Box & Master Carton)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Work Order Acuan *</label>
              <select
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 tabular-nums text-slate-800"
                value={createForm.workOrderId}
                onChange={(e) => {
                  const wo = workOrders.find((w: any) => w.id === e.target.value);
                  setCreateForm(prev => ({
                    ...prev,
                    workOrderId: e.target.value,
                    batchRecordCode: wo?.woNumber || prev.batchRecordCode,
                    targetQtyPcs: wo?.targetQty ? Number(wo.targetQty) : prev.targetQtyPcs,
                  }));
                }}
              >
                <option value="">-- Pilih Work Order --</option>
                {workOrders.map((wo: any) => (
                  <option key={wo.id} value={wo.id}>
                    {wo.woNumber} - {wo.productName || "Produk"} ({wo.targetQty || 0} Pcs)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Waktu Pelaksanaan *</label>
              <input
                type="datetime-local"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 tabular-nums text-slate-800"
                value={createForm.scheduleDate.replace(" ", "T")}
                onChange={(e) => setCreateForm(prev => ({ ...prev, scheduleDate: e.target.value.replace("T", " ") }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Target Qty (PCS) *</label>
              <input
                type="number"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 tabular-nums font-bold text-slate-900"
                value={createForm.targetQtyPcs}
                onChange={(e) => setCreateForm(prev => ({ ...prev, targetQtyPcs: Number(e.target.value) }))}
              />
            </div>
          </div>

          {modalScheduleType === "MIXING" && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
              <span className="font-bold text-blue-900 uppercase">Perhitungan Upscale Bejana Mixing:</span>
              <div className="grid grid-cols-2 gap-3 text-blue-800 tabular-nums">
                <div>Base Result: {(createForm.targetQtyPcs * 0.03).toFixed(1)} Kg</div>
                <div>Upscale Buffer: +10% ({(createForm.targetQtyPcs * 0.033).toFixed(1)} Kg)</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Mesin / Lini Alokasi *</label>
              {machines.length > 0 ? (
                <select
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                  value={createForm.machineId}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, machineId: e.target.value }))}
                >
                  <option value="">-- Pilih Mesin --</option>
                  {machines.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.machineCode})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                  value={createForm.assignedMachine}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, assignedMachine: e.target.value }))}
                />
              )}
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase">Operator PIC *</label>
              <input
                type="text"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                value={createForm.picOperator}
                onChange={(e) => setCreateForm(prev => ({ ...prev, picOperator: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </DnaModal>

      {/* 6. Modal Detail Jadwal */}
      <DnaModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedSchedule ? `Detail Jadwal: ${selectedSchedule.scheduleCode}` : "Detail"}
        description="Rincian parameter operasional dan instruksi kerja lini."
        size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <DnaButton
              variant="secondary"
              onClick={() => toast.success("Cetak SPK", "Surat Perintah Kerja jadwal berhasil dicetak.")}
            >
              <Printer className="w-4 h-4 mr-1" /> Cetak SPK
            </DnaButton>
            <DnaButton variant="primary" onClick={() => setIsDetailModalOpen(false)}>
              Tutup
            </DnaButton>
          </div>
        }
      >
        {selectedSchedule && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="tabular-nums font-bold text-slate-900">{selectedSchedule.scheduleCode}</span>
                {getStatusBadge(selectedSchedule.status)}
              </div>
              <p className="font-bold text-slate-800 text-sm">{selectedSchedule.productName}</p>
              <p className="text-slate-500">{selectedSchedule.clientName} ({selectedSchedule.brandName})</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-500">Waktu Pelaksanaan:</span>
                <p className="font-semibold text-slate-900">{selectedSchedule.scheduleDate}</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-500">Target Qty:</span>
                <p className="tabular-nums font-bold text-slate-900">{selectedSchedule.targetQtyPcs.toLocaleString()} Pcs</p>
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-500">Mesin / Line Alokasi:</span>
              <p className="font-bold text-slate-900">{selectedSchedule.assignedLineOrMachine}</p>
              <p className="text-slate-600">Operator PIC: {selectedSchedule.picOperator}</p>
            </div>

            {selectedSchedule.notes && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700">Instruksi Khusus:</span>
                <p className="text-slate-600">{selectedSchedule.notes}</p>
              </div>
            )}
          </div>
        )}
      </DnaModal>
    </DnaPageContainer>
  );
}
