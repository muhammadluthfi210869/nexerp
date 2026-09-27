"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Boxes,
  Search,
  Eye,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  Play,
  RotateCw,
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

interface PackagingProductionItem {
  id: string;
  code: string;
  date: string;
  batchRecord: string;
  salesOrder: string;
  customer: string;
  category: string;
  product: string;
  targetPcs: number;
  actualPcs?: number;
  rejectPcs?: number;
  machine: string;
  status: "MENUNGGU" | "PROSES" | "PENDING" | "SELESAI" | "DIBATALKAN";
  notes?: string;
  detailRows?: {
    id: string;
    productionCode: string;
    machine: string;
    qtyProduce: number;
    date: string;
    status: string;
  }[];
  historyLogs?: { timestamp: string; note: string; operator: string }[];
}

const INITIAL_PACKAGING_DATA: PackagingProductionItem[] = [];

export default function ProductionPackagingPage() {
  const toast = useDnaToast();

  const { data: serverData, isLoading } = useQuery({
    queryKey: ["production-packaging-items"],
    queryFn: async () => {
      try {
        const res = await api.get("/production/schedules?stage=PACKING");
        const list = res.data?.data || res.data || [];
        return list.map((item: any) => ({
          id: item.id,
          code: item.scheduleNumber || item.code || item.id,
          date: item.startTime ? String(item.startTime).slice(0, 10) : new Date().toISOString().slice(0, 10),
          batchRecord: item.workOrder?.woNumber || "BR-2026-0001",
          salesOrder: item.workOrder?.lead?.clientName || "SO-2026",
          customer: item.workOrder?.lead?.clientName || "Farah Derma Clinic",
          category: "Skincare",
          product: item.workOrder?.lead?.brandName || "Day Cream SPF 30",
          targetPcs: Number(item.targetQty) || 3000,
          actualPcs: item.resultQty ? Number(item.resultQty) : undefined,
          rejectPcs: 0,
          machine: item.machine?.name || "Conveyor Line 1 (Shrink)",
          status: item.status === "COMPLETED" ? "SELESAI" : item.status === "IN_PROGRESS" ? "PROSES" : "MENUNGGU",
          notes: item.notes || "",
          detailRows: [],
          historyLogs: [],
        }));
      } catch {
        return [];
      }
    },
  });

  const [localData, setLocalData] = useState<PackagingProductionItem[]>(INITIAL_PACKAGING_DATA);
  const data = useMemo(() => {
    return [...localData, ...(serverData || [])];
  }, [localData, serverData]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Modals & Drawer state
  const [selectedDetail, setSelectedDetail] = useState<PackagingProductionItem | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [produceModalItem, setProduceModalItem] = useState<PackagingProductionItem | null>(null);
  const [produceQty, setProduceQty] = useState<number>(0);
  const [rejectQty, setRejectQty] = useState<number>(0);
  const [produceMachine, setProduceMachine] = useState<string>("");

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        !searchTerm ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  const handleStartProduce = (item: PackagingProductionItem) => {
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
                  note: "Line packaging sekunder mulai beroperasi",
                  operator: "Operator Packaging"
                }
              ]
            }
          : d
      )
    );
    toast.success("Produksi Dimulai", `Jadwal packaging ${item.code} berstatus PROSES.`);
    setIsDetailDrawerOpen(false);
  };

  const handleTogglePending = (item: PackagingProductionItem) => {
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
                  operator: "Supervisor Packaging"
                }
              ]
            }
          : d
      )
    );
    toast.info("Status Diperbarui", `${item.code} diubah menjadi ${newStatus}.`);
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
              actualPcs: produceQty,
              rejectPcs: rejectQty,
              machine: produceMachine || d.machine,
              historyLogs: [
                ...(d.historyLogs || []),
                {
                  timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
                  note: `Packaging selesai: ${produceQty} pcs (Reject: ${rejectQty} pcs) via ${produceMachine || d.machine}`,
                  operator: "Supervisor Packaging"
                }
              ]
            }
          : d
      )
    );

    toast.success("Packaging Selesai", `Realisasi packaging ${produceModalItem.code} berhasil dicatat (${produceQty} Pcs).`);
    setProduceModalItem(null);
    setIsDetailDrawerOpen(false);
  };

  const getStatusBadge = (status: PackagingProductionItem["status"]) => {
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
        title="Produksi Packaging (Sekunder)"
        description="Pengemasan sekunder (kotak, leaflet, segel hologram) dan batch coding ke master box sebelum rilis APJ."
        badge={<DnaBadge variant="neutral">PACKAGING-LINE</DnaBadge>}
        breadcrumbs={[
          { label: "Produksi Pabrik", href: "/production" },
          { label: "Jadwal", href: "/production/schedule" },
          { label: "Produksi Packaging", href: "/production/packaging" }
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
            onClick={() => toast.success("Export Data", "Data operasional packaging berhasil diekspor.")}
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5" />
            Export Excel
          </DnaButton>
        }
      />

      {/* 2. KPI Grid */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="TOTAL JADWAL PACKAGING"
          value={kpis.total.toString()}
          subValue="Akumulasi Lini Sekunder"
          icon={<Boxes className="w-5 h-5 text-blue-600" />}
        />
        <DnaStatCard
          label="SEDANG PROSES"
          value={kpis.proses.toString()}
          subValue="Conveyor Line Aktif"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
        />
        <DnaStatCard
          label="TERTUNDA / PENDING"
          value={kpis.pending.toString()}
          subValue="Menunggu Material Sekunder"
          icon={<RotateCw className="w-5 h-5 text-orange-600" />}
        />
        <DnaStatCard
          label="PACKAGING SELESAI"
          value={kpis.selesai.toString()}
          subValue="Siap Masuk Karantina QC APJ"
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
                <DnaTh className="py-3 px-4 w-[24%]">Batch & Mesin</DnaTh>
                <DnaTh className="py-3 px-4 w-[26%]">Produk & Pelanggan</DnaTh>
                <DnaTh className="py-3 px-4 w-[18%]">Target & Output</DnaTh>
                <DnaTh className="py-3 px-4 w-[10%]">Status</DnaTh>
                <DnaTh className="py-3 px-4 w-[6%] text-right">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {isLoading ? (
                <DnaTableRow>
                  <DnaTd colSpan={6} className="py-12 text-center text-slate-400">
                    Memuat antrian produksi packaging...
                  </DnaTd>
                </DnaTableRow>
              ) : filteredData.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={6} className="py-12 text-center text-slate-400">
                    <Boxes className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada jadwal produksi packaging yang sesuai filter.
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredData.map((item) => (
                  <DnaTableRow key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <DnaTd className="py-3 px-4 truncate">
                      <p className="tabular-nums text-xs font-bold text-slate-900 truncate">{item.code}</p>
                      <p className="text-[11px] text-slate-500 tabular-nums mt-0.5 truncate">{item.date}</p>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 truncate">
                      <p className="tabular-nums text-xs font-semibold text-blue-700 truncate">{item.batchRecord}</p>
                      <p className="text-[11px] text-slate-500 truncate">{item.machine}</p>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 truncate">
                      <p className="font-semibold text-slate-900 text-xs truncate">{item.product}</p>
                      <p className="text-[11px] text-slate-500 truncate">{item.customer}</p>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 truncate">
                      <p className="tabular-nums font-bold text-slate-900 text-xs truncate">
                        Target: {item.targetPcs.toLocaleString()} Pcs
                      </p>
                      <p className="text-[11px] text-amber-700 tabular-nums truncate">
                        {item.actualPcs ? `Aktual: ${item.actualPcs.toLocaleString()} Pcs` : "Menunggu kemas"}
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
                        title="Lihat Detail Packaging"
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

      {/* 4. Modal Konfirmasi Selesai Packaging */}
      <DnaModal
        isOpen={!!produceModalItem}
        onClose={() => setProduceModalItem(null)}
        title={`Konfirmasi Selesai Packaging: ${produceModalItem?.code}`}
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
              <div className="text-blue-700">Target Order: {produceModalItem.targetPcs.toLocaleString()} Pcs</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">
                  Jumlah Good Pcs <span className="text-rose-500">*</span>
                </label>
                <DnaInput
                  type="number"
                  value={produceQty.toString()}
                  onChange={(e) => setProduceQty(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase">Jumlah Reject Pcs</label>
                <DnaInput
                  type="number"
                  value={rejectQty.toString()}
                  onChange={(e) => setRejectQty(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Lini Mesin Packaging</label>
              <DnaInput
                value={produceMachine}
                onChange={(e) => setProduceMachine(e.target.value)}
              />
            </div>
          </form>
        )}
      </DnaModal>

      {/* 5. Quick Peek Drawer (Rule 5) */}
      <DnaDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        title={selectedDetail?.code || "Detail Produksi Packaging"}
        subtitle={selectedDetail ? `${selectedDetail.product} • ${selectedDetail.batchRecord}` : undefined}
        badge={selectedDetail ? getStatusBadge(selectedDetail.status) : undefined}
        tabs={[
          {
            id: "summary",
            label: "Ringkasan Packaging",
            content: selectedDetail ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="tabular-nums font-bold text-slate-900">{selectedDetail.code}</span>
                    <span className="tabular-nums text-slate-500">{selectedDetail.date}</span>
                  </div>
                  <p className="font-bold text-slate-900 text-sm">{selectedDetail.product}</p>
                  <p className="text-slate-600">{selectedDetail.customer} ({selectedDetail.category})</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 block mb-1">Target Kemasan</span>
                    <p className="tabular-nums font-bold text-slate-900 text-sm">{selectedDetail.targetPcs.toLocaleString()} Pcs</p>
                    <span className="text-[10px] text-slate-400">Master Box Sekunder</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-500 block mb-1">Alokasi Lini</span>
                    <p className="font-semibold text-amber-700">{selectedDetail.machine}</p>
                    <span className="text-[10px] text-slate-400">Conveyor & Shrink Tunnel</span>
                  </div>
                </div>

                {selectedDetail.actualPcs && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <span className="text-emerald-800 font-semibold block mb-0.5">Hasil Realisasi Packaging:</span>
                    <p className="tabular-nums font-bold text-emerald-900 text-base">{selectedDetail.actualPcs.toLocaleString()} Pcs</p>
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
                <p className="font-bold text-slate-700 uppercase">Riwayat Operasional Line Packaging:</p>
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
                Mulai Packaging
              </DnaButton>
            )}
            {selectedDetail?.status === "PROSES" && (
              <DnaButton
                variant="primary"
                onClick={() => {
                  setProduceModalItem(selectedDetail);
                  setProduceQty(selectedDetail.targetPcs);
                  setProduceMachine(selectedDetail.machine);
                }}
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Selesaikan Packaging
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
