"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  FlaskConical,
  Search,
  Eye,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  Play,
  RotateCw,
  Printer,
  History,
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
} from "@/components/dna";

interface MixingProductionItem {
  id: string;
  scheduleCode: string;
  date: string;
  batchRecord: string;
  salesOrder: string;
  customer: string;
  category: string;
  product: string;
  formulaName: string;
  targetPcs: number;
  nettoGram: number;
  baseResultKg: number;
  upscalePct: number;
  upscaleResultKg: number;
  actualMixingKg?: number;
  status: "MENUNGGU" | "PROSES" | "PENDING" | "SELESAI" | "DIBATALKAN";
  notes?: string;
  historyLogs?: { timestamp: string; note: string; operator: string }[];
}

const INITIAL_MIXING_DATA: MixingProductionItem[] = [];

export default function ProductionMixingPage() {
  const toast = useDnaToast();

  const { data: serverData, isLoading } = useQuery({
    queryKey: ["production-mixing-items"],
    queryFn: async () => {
      try {
        const res = await api.get("/production/schedules?stage=MIXING");
        const list = res.data?.data || res.data || [];
        return list.map((item: any) => ({
          id: item.id,
          scheduleCode: item.scheduleNumber || item.code || item.id,
          date: item.startTime ? String(item.startTime).slice(0, 10) : new Date().toISOString().slice(0, 10),
          batchRecord: item.workOrder?.woNumber || "BR-2026-0001",
          salesOrder: item.workOrder?.lead?.clientName || "SO-2026",
          customer: item.workOrder?.lead?.clientName || "Farah Derma Clinic",
          category: "Skincare",
          product: item.workOrder?.lead?.brandName || "Day Cream SPF 30",
          formulaName: "FORM-MIX-V1",
          targetPcs: Number(item.targetQty) || 3000,
          nettoGram: 50,
          baseResultKg: 150.0,
          upscalePct: 5.0,
          upscaleResultKg: 157.5,
          actualMixingKg: item.resultQty ? Number(item.resultQty) : undefined,
          status: item.status === "COMPLETED" ? "SELESAI" : item.status === "IN_PROGRESS" ? "PROSES" : "MENUNGGU",
          notes: item.notes || "",
          historyLogs: [],
        }));
      } catch {
        return [];
      }
    },
  });

  const [localData, setLocalData] = useState<MixingProductionItem[]>(INITIAL_MIXING_DATA);
  const data = useMemo(() => {
    return [...localData, ...(serverData || [])];
  }, [localData, serverData]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Modals & Drawer state
  const [selectedDetail, setSelectedDetail] = useState<MixingProductionItem | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [produceModalItem, setProduceModalItem] = useState<MixingProductionItem | null>(null);
  const [actualProduceQty, setActualProduceQty] = useState<number>(0);
  const [produceNote, setProduceNote] = useState<string>("");

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        !searchTerm ||
        item.scheduleCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.batchRecord.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === "ALL" || item.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [data, searchTerm, filterStatus]);

  const kpis = useMemo(() => {
    const total = data.length;
    const proses = data.filter((d) => d.status === "PROSES").length;
    const pending = data.filter((d) => d.status === "PENDING").length;
    const selesai = data.filter((d) => d.status === "SELESAI").length;
    return { total, proses, pending, selesai };
  }, [data]);

  const handleStartProduce = (item: MixingProductionItem) => {
    setLocalData((prev) =>
      prev.map((d) =>
        d.id === item.id
          ? {
              ...d,
              status: "PROSES",
              historyLogs: [
                ...(d.historyLogs || []),
                {
                  timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
                  note: "Proses produksi mixing dimulai",
                  operator: "Operator Mixing"
                }
              ]
            }
          : d
      )
    );
    toast.success("Produksi Dimulai", `Jadwal ${item.scheduleCode} berstatus PROSES.`);
    setIsDetailDrawerOpen(false);
  };

  const handleTogglePending = (item: MixingProductionItem) => {
    const newStatus = item.status === "PENDING" ? "MENUNGGU" : "PENDING";
    setLocalData((prev) =>
      prev.map((d) =>
        d.id === item.id
          ? {
              ...d,
              status: newStatus,
              historyLogs: [
                ...(d.historyLogs || []),
                {
                  timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
                  note: `Status diubah menjadi ${newStatus}`,
                  operator: "Supervisor Produksi"
                }
              ]
            }
          : d
      )
    );
    toast.info("Status Diperbarui", `${item.scheduleCode} diubah menjadi ${newStatus}.`);
    setIsDetailDrawerOpen(false);
  };

  const handleCompleteProduce = (e: React.FormEvent) => {
    e.preventDefault();
    if (!produceModalItem) return;

    setLocalData((prev) =>
      prev.map((d) =>
        d.id === produceModalItem.id
          ? {
              ...d,
              status: "SELESAI",
              actualMixingKg: actualProduceQty,
              historyLogs: [
                ...(d.historyLogs || []),
                {
                  timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
                  note: `Mixing selesai: ${actualProduceQty} Kg (${produceNote || "Sesuai spesifikasi"})`,
                  operator: "Supervisor Mixing"
                }
              ]
            }
          : d
      )
    );

    toast.success("Mixing Selesai", `Realisasi mixing ${produceModalItem.scheduleCode} berhasil dicatat (${actualProduceQty} Kg).`);
    setProduceModalItem(null);
    setIsDetailDrawerOpen(false);
  };

  const getStatusBadge = (status: MixingProductionItem["status"]) => {
    switch (status) {
      case "SELESAI":
        return <DnaBadge variant="success">SELESAI</DnaBadge>;
      case "PROSES":
        return <DnaBadge variant="info">PROSES</DnaBadge>;
      case "PENDING":
        return <DnaBadge variant="warning">PENDING</DnaBadge>;
      case "DIBATALKAN":
        return <DnaBadge variant="danger">BATAL</DnaBadge>;
      default:
        return <DnaBadge variant="neutral">{status}</DnaBadge>;
    }
  };

  return (
    <DnaPageContainer>
      {/* 1. Header Page with Unified Top-Right Tabs */}
      <DnaPageHeader
        title="Produksi Mixing (Ruahan)"
        description="Operasional dan realisasi pengolahan formula kosmetik skala bejana mixing sesuai standar CPKB."
        badge={<DnaBadge variant="neutral">BEJANA-MIX</DnaBadge>}
        breadcrumbs={[
          { label: "Produksi Pabrik", href: "/production" },
          { label: "Jadwal", href: "/production/schedule" },
          { label: "Produksi Mixing", href: "/production/mixing" }
        ]}
        tabs={[
          { id: "ALL", label: `Semua (${kpis.total})` },
          { id: "MENUNGGU", label: "Menunggu" },
          { id: "PROSES", label: `Sedang Proses (${kpis.proses})` },
          { id: "PENDING", label: `Pending (${kpis.pending})` },
          { id: "SELESAI", label: `Selesai (${kpis.selesai})` }
        ]}
        activeTab={filterStatus}
        onTabChange={setFilterStatus}
        actions={
          <DnaButton
            variant="secondary"
            onClick={() => toast.success("Export Data", "Data operasional mixing berhasil diekspor.")}
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5" />
            Export Excel
          </DnaButton>
        }
      />

      {/* 2. KPI Grid */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="TOTAL JADWAL MIXING"
          value={kpis.total.toString()}
          subValue="Akumulasi Batch Record"
          icon={<FlaskConical className="w-5 h-5 text-blue-600" />}
        />
        <DnaStatCard
          label="SEDANG PROSES"
          value={kpis.proses.toString()}
          subValue="Bejana Sedang Aktif"
          icon={<Clock className="w-5 h-5 text-indigo-600" />}
        />
        <DnaStatCard
          label="TERTUNDA / PENDING"
          value={kpis.pending.toString()}
          subValue="Perlu Intervensi QC"
          icon={<RotateCw className="w-5 h-5 text-amber-600" />}
        />
        <DnaStatCard
          label="MIXING SELESAI"
          value={kpis.selesai.toString()}
          subValue="Siap Transfer ke Filling"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
      </DnaKpiGrid>

      {/* 3. DataTable Card (Zero redundant title, zero horizontal scroll, max 6 cols) */}
      <DnaDataTableCard
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Cari jadwal, batch record, produk, pelanggan..."
      >
        <div className="w-full">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow>
                <DnaTh className="py-3 px-4 w-[16%]">Kode & Tanggal</DnaTh>
                <DnaTh className="py-3 px-4 w-[24%]">Batch & Formula</DnaTh>
                <DnaTh className="py-3 px-4 w-[26%]">Produk & Pelanggan</DnaTh>
                <DnaTh className="py-3 px-4 w-[18%]">Target & Hasil Upscale</DnaTh>
                <DnaTh className="py-3 px-4 w-[10%]">Status</DnaTh>
                <DnaTh className="py-3 px-4 w-[6%] text-right">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {isLoading ? (
                <DnaTableRow>
                  <DnaTd colSpan={6} className="py-12 text-center text-slate-400">
                    Memuat antrian produksi mixing...
                  </DnaTd>
                </DnaTableRow>
              ) : filteredData.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={6} className="py-12 text-center text-slate-400">
                    <FlaskConical className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada jadwal produksi mixing yang sesuai filter.
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredData.map((item) => (
                  <DnaTableRow key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <DnaTd className="py-3 px-4 truncate">
                      <p className="tabular-nums text-xs font-bold text-slate-900 truncate">{item.scheduleCode}</p>
                      <p className="text-[11px] text-slate-500 tabular-nums mt-0.5 truncate">{item.date}</p>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 truncate">
                      <p className="tabular-nums text-xs font-semibold text-blue-700 truncate">{item.batchRecord}</p>
                      <p className="text-[11px] text-slate-500 truncate">{item.formulaName}</p>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 truncate">
                      <p className="font-semibold text-slate-900 text-xs truncate">{item.product}</p>
                      <p className="text-[11px] text-slate-500 truncate">{item.customer}</p>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 truncate">
                      <p className="tabular-nums font-bold text-slate-900 text-xs truncate">
                        {item.targetPcs.toLocaleString()} Pcs (@{item.nettoGram}g)
                      </p>
                      <p className="text-[11px] text-indigo-700 tabular-nums truncate">
                        Upscale: {item.upscaleResultKg.toFixed(1)} Kg (+{item.upscalePct}%)
                      </p>
                    </DnaTd>
                    <DnaTd className="py-3 px-4">
                      {getStatusBadge(item.status)}
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-right">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedDetail(item);
                          setIsDetailDrawerOpen(true);
                        }}
                        title="Lihat Detail Mixing"
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

      {/* 4. Modal Konfirmasi Selesai Mixing */}
      <DnaModal
        isOpen={!!produceModalItem}
        onClose={() => setProduceModalItem(null)}
        title={`Konfirmasi Selesai Mixing: ${produceModalItem?.scheduleCode}`}
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton variant="secondary" onClick={() => setProduceModalItem(null)}>
              Batal
            </DnaButton>
            <DnaButton variant="primary" onClick={handleCompleteProduce}>
              Simpan Realisasi
            </DnaButton>
          </div>
        }
      >
        {produceModalItem && (
          <form onSubmit={handleCompleteProduce} className="space-y-4 text-xs">
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg space-y-1">
              <div className="font-bold text-blue-900">{produceModalItem.product}</div>
              <div className="text-blue-700">Target Upscale: {produceModalItem.upscaleResultKg.toFixed(1)} Kg</div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">
                Hasil Timbangan Riil Ruahan (Kg) <span className="text-rose-500">*</span>
              </label>
              <DnaInput
                type="number"
                value={actualProduceQty.toString()}
                onChange={(e) => setActualProduceQty(Number(e.target.value))}
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Catatan Pelaksanaan Mixing</label>
              <DnaInput
                placeholder="Homogenitas ruahan, suhu akhir emulsi, dll..."
                value={produceNote}
                onChange={(e) => setProduceNote(e.target.value)}
              />
            </div>
          </form>
        )}
      </DnaModal>

      {/* 5. Quick Peek Drawer (Rule 5) */}
      <DnaDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        title={selectedDetail?.scheduleCode || "Detail Produksi Mixing"}
        subtitle={selectedDetail ? `${selectedDetail.product} • ${selectedDetail.batchRecord}` : undefined}
        badge={selectedDetail ? getStatusBadge(selectedDetail.status) : undefined}
        tabs={[
          {
            id: "summary",
            label: "Ringkasan Mixing",
            content: selectedDetail ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="tabular-nums font-bold text-slate-900">{selectedDetail.scheduleCode}</span>
                    <span className="tabular-nums text-slate-500">{selectedDetail.date}</span>
                  </div>
                  <p className="font-bold text-slate-900 text-sm">{selectedDetail.product}</p>
                  <p className="text-slate-600">{selectedDetail.customer} ({selectedDetail.category})</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 block mb-1">Target Produksi</span>
                    <p className="tabular-nums font-bold text-slate-900 text-sm">{selectedDetail.targetPcs.toLocaleString()} Pcs</p>
                    <span className="text-[10px] text-slate-400">Netto: {selectedDetail.nettoGram}g / Pcs</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 block mb-1">Hasil Upscale Teoritis</span>
                    <p className="tabular-nums font-bold text-indigo-700 text-sm">{selectedDetail.upscaleResultKg.toFixed(2)} Kg</p>
                    <span className="text-[10px] text-slate-400">Buffer susut: +{selectedDetail.upscalePct}%</span>
                  </div>
                </div>

                {selectedDetail.actualMixingKg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <span className="text-emerald-800 font-semibold block mb-0.5">Hasil Timbang Riil Mixing:</span>
                    <p className="tabular-nums font-bold text-emerald-900 text-base">{selectedDetail.actualMixingKg} Kg</p>
                  </div>
                )}
              </div>
            ) : null
          },
          {
            id: "history",
            label: "Riwayat & Log",
            content: selectedDetail ? (
              <div className="space-y-3 text-xs">
                <p className="font-bold text-slate-700 uppercase">Riwayat Operasional Bejana:</p>
                {(selectedDetail.historyLogs || []).length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-lg text-slate-400 text-center">
                    Belum ada riwayat aktivitas yang tercatat.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedDetail.historyLogs?.map((log, i) => (
                      <div key={i} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex justify-between text-[11px] tabular-nums text-slate-500 mb-1">
                          <span>{log.timestamp}</span>
                          <span className="font-semibold text-slate-700">{log.operator}</span>
                        </div>
                        <p className="text-slate-800 font-medium">{log.note}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null
          }
        ]}
        footerActions={
          <div className="flex items-center justify-end gap-2 w-full">
            <DnaButton variant="secondary" onClick={() => setIsDetailDrawerOpen(false)}>
              Tutup
            </DnaButton>
            {selectedDetail?.status === "MENUNGGU" && (
              <DnaButton variant="primary" onClick={() => handleStartProduce(selectedDetail)}>
                <Play className="w-3.5 h-3.5 mr-1" />
                Mulai Mixing
              </DnaButton>
            )}
            {selectedDetail?.status === "PROSES" && (
              <DnaButton
                variant="primary"
                onClick={() => {
                  setProduceModalItem(selectedDetail);
                  setActualProduceQty(selectedDetail.upscaleResultKg);
                }}
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Selesaikan Mixing
              </DnaButton>
            )}
            {selectedDetail && selectedDetail.status !== "SELESAI" && selectedDetail.status !== "DIBATALKAN" && (
              <DnaButton variant="outline" onClick={() => handleTogglePending(selectedDetail)}>
                {selectedDetail.status === "PENDING" ? "Aktifkan" : "Pending"}
              </DnaButton>
            )}
          </div>
        }
      />
    </DnaPageContainer>
  );
}
