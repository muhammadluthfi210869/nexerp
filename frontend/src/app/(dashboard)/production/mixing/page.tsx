"use client";

import React, { useState, useMemo } from "react";
import {
  FlaskConical,
  Search,
  Eye,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  Clock,
  Play,
  RotateCw,
  Printer,
  History,
  Ban,
  XCircle,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaInput,
  DnaModal,
  DnaBadge,
  useDnaToast,
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

const INITIAL_MIXING_DATA: MixingProductionItem[] = [
  {
    id: "MIX-001",
    scheduleCode: "SCH-MIX-2026-0001",
    date: "2026-09-18",
    batchRecord: "BR-2026-0001",
    salesOrder: "SO-202609-000004",
    customer: "Farah Derma Clinic",
    category: "Skincare",
    product: "Day Cream SPF 30",
    formulaName: "FORM-DC-SPF30-V2",
    targetPcs: 3000,
    nettoGram: 50,
    baseResultKg: 150.0,
    upscalePct: 5.0,
    upscaleResultKg: 157.5,
    actualMixingKg: 157.2,
    status: "PROSES",
    notes: "Homogenizer suhu 70C, pendinginan bertahap hingga 35C sebelum penambahan preservative",
    historyLogs: [
      { timestamp: "2026-09-18 08:30", note: "Jadwal dirilis ke ruang mixing bejana 500L", operator: "Supervisor Produksi" },
      { timestamp: "2026-09-18 09:15", note: "Penimbangan bahan baku fase air dan minyak selesai", operator: "Ahmad Fauzi" },
      { timestamp: "2026-09-18 10:00", note: "Proses emulsifikasi dan homogenisasi dimulai (2800 RPM)", operator: "Ahmad Fauzi" }
    ]
  },
  {
    id: "MIX-002",
    scheduleCode: "SCH-MIX-2026-0002",
    date: "2026-09-19",
    batchRecord: "BR-2026-0002",
    salesOrder: "SO-202609-000005",
    customer: "Glow Skin Official",
    category: "Skincare",
    product: "Brightening Serum",
    formulaName: "FORM-BS-GLOW-V1",
    targetPcs: 5000,
    nettoGram: 30,
    baseResultKg: 150.0,
    upscalePct: 3.0,
    upscaleResultKg: 154.5,
    actualMixingKg: 154.5,
    status: "SELESAI",
    notes: "Dispersi Niacinamide dan Sodium Hyaluronate sempurna, organoleptik jernih",
    historyLogs: [
      { timestamp: "2026-09-19 08:00", note: "Penimbangan bahan selesai", operator: "Budi Santoso" },
      { timestamp: "2026-09-19 11:30", note: "QC In-Process Check lolos (pH 5.4, viskositas 1200 cPs)", operator: "QC Officer" },
      { timestamp: "2026-09-19 13:00", note: "Mixing selesai, transfer ruahan ke tangki penyimpanan", operator: "Budi Santoso" }
    ]
  },
  {
    id: "MIX-003",
    scheduleCode: "SCH-MIX-2026-0003",
    date: "2026-09-20",
    batchRecord: "BR-2026-0003",
    salesOrder: "SO-202609-000006",
    customer: "Velvet Lips Beauty",
    category: "Decorative",
    product: "Matte Velvet Lip Cream Shade 04",
    formulaName: "FORM-LIP-VELV-04",
    targetPcs: 6000,
    nettoGram: 4.5,
    baseResultKg: 27.0,
    upscalePct: 10.0,
    upscaleResultKg: 29.7,
    status: "MENUNGGU",
    notes: "Dispersi pigmen warna dan lilin microcrystalline",
    historyLogs: [
      { timestamp: "2026-09-17 16:00", note: "Jadwal mixing dibuat otomatis dari SPK", operator: "Admin Produksi" }
    ]
  },
  {
    id: "MIX-004",
    scheduleCode: "SCH-MIX-2026-0004",
    date: "2026-09-21",
    batchRecord: "BR-2026-0004",
    salesOrder: "SO-202609-000007",
    customer: "Aura Skin Estetika",
    category: "Skincare",
    product: "Hydrating Facial Toner 100ml",
    formulaName: "FORM-TONER-HYD-V3",
    targetPcs: 4000,
    nettoGram: 100,
    baseResultKg: 400.0,
    upscalePct: 2.0,
    upscaleResultKg: 408.0,
    status: "PENDING",
    notes: "Menunggu konfirmasi kedatangan bahan baku active chamomile extract",
    historyLogs: [
      { timestamp: "2026-09-18 14:00", note: "Status diubah ke PENDING karena stok bahan aktif menipis", operator: "Supervisor Produksi" }
    ]
  }
];

export default function ProductionMixingPage() {
  const [data, setData] = useState<MixingProductionItem[]>(INITIAL_MIXING_DATA);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Modals
  const [selectedDetail, setSelectedDetail] = useState<MixingProductionItem | null>(null);
  const [historyModalItem, setHistoryModalItem] = useState<MixingProductionItem | null>(null);
  const [produceModalItem, setProduceModalItem] = useState<MixingProductionItem | null>(null);
  const [actualProduceQty, setActualProduceQty] = useState<number>(0);
  const [produceNote, setProduceNote] = useState<string>("");

  const { addToast } = useDnaToast();

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
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
    setData((prev) =>
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
    addToast({ title: "Produksi Dimulai", message: `Jadwal ${item.scheduleCode} berstatus PROSES`, type: "success" });
  };

  const handleTogglePending = (item: MixingProductionItem) => {
    const newStatus = item.status === "PENDING" ? "MENUNGGU" : "PENDING";
    setData((prev) =>
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
    addToast({
      title: newStatus === "PENDING" ? "Jadwal Ditangguhkan" : "Jadwal Diaktifkan",
      message: `${item.scheduleCode} diubah menjadi ${newStatus}`,
      type: "info"
    });
  };

  const handleCompleteProduce = (e: React.FormEvent) => {
    e.preventDefault();
    if (!produceModalItem) return;

    setData((prev) =>
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

    addToast({
      title: "Produksi Selesai",
      message: `Realisasi mixing ${produceModalItem.scheduleCode} berhasil dicatat (${actualProduceQty} Kg)`,
      type: "success"
    });
    setProduceModalItem(null);
  };

  const handleCancelSchedule = (item: MixingProductionItem) => {
    setData((prev) =>
      prev.map((d) =>
        d.id === item.id
          ? {
              ...d,
              status: "DIBATALKAN",
              historyLogs: [
                ...(d.historyLogs || []),
                {
                  timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
                  note: "Jadwal mixing dibatalkan",
                  operator: "Supervisor Produksi"
                }
              ]
            }
          : d
      )
    );
    setSelectedDetail(null);
    addToast({ title: "Jadwal Dibatalkan", message: `${item.scheduleCode} berhasil dibatalkan`, type: "error" });
  };

  return (
    <div className="space-y-6">
      <DnaPageHeader
        title="Produksi Mixing"
        subtitle="Operasional dan Realisasi Pengolahan Formula Kosmetik / Skincare (Ruang Bejana)"
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Jadwal Mixing"
          value={kpis.total.toString()}
          subtext="Semua batch record"
          icon={<FlaskConical className="w-5 h-5 text-blue-600" />}
        />
        <DnaStatCard
          label="Sedang Proses"
          value={kpis.proses.toString()}
          subtext="Bejana aktif"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
        />
        <DnaStatCard
          label="Pending / Tertunda"
          value={kpis.pending.toString()}
          subtext="Perlu perhatian"
          icon={<RotateCw className="w-5 h-5 text-orange-600" />}
        />
        <DnaStatCard
          label="Mixing Selesai"
          value={kpis.selesai.toString()}
          subtext="Siap transfer filling"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        title="Daftar Produksi Mixing"
        description="Data pengolahan ruahan mixing sesuai standar CPKB dan formula baku"
        actions={
          <div className="flex items-center gap-2">
            <div className="w-64">
              <DnaInput
                placeholder="Cari jadwal, batch, produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="MENUNGGU">Menunggu</option>
              <option value="PROSES">Proses</option>
              <option value="PENDING">Pending</option>
              <option value="SELESAI">Selesai</option>
              <option value="DIBATALKAN">Dibatalkan</option>
            </select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="px-3.5 py-3 w-10 text-center">#</th>
                <th className="px-3.5 py-3">Kode Jadwal</th>
                <th className="px-3.5 py-3">Tanggal</th>
                <th className="px-3.5 py-3">Batch Record</th>
                <th className="px-3.5 py-3">Pelanggan</th>
                <th className="px-3.5 py-3">Produk</th>
                <th className="px-3.5 py-3 text-right">Target (PCS)</th>
                <th className="px-3.5 py-3 text-right">Hasil Upscale</th>
                <th className="px-3.5 py-3 text-center">Status</th>
                <th className="px-3.5 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3.5 py-8 text-center text-slate-400">
                    Tidak ada jadwal produksi mixing yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-3.5 py-3 text-center font-medium text-slate-400">{idx + 1}</td>
                    <td className="px-3.5 py-3 font-semibold text-blue-600 font-mono">{item.scheduleCode}</td>
                    <td className="px-3.5 py-3 text-slate-700 whitespace-nowrap">{item.date}</td>
                    <td className="px-3.5 py-3 font-mono text-slate-800">{item.batchRecord}</td>
                    <td className="px-3.5 py-3 text-slate-800">{item.customer}</td>
                    <td className="px-3.5 py-3 font-medium text-slate-900">{item.product}</td>
                    <td className="px-3.5 py-3 text-right font-semibold text-slate-800">
                      {item.targetPcs.toLocaleString()} PCS
                    </td>
                    <td className="px-3.5 py-3 text-right font-bold text-slate-800">
                      {item.upscaleResultKg.toFixed(1)} Kg (+{item.upscalePct}%)
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <DnaBadge
                        variant={
                          item.status === "SELESAI"
                            ? "success"
                            : item.status === "PROSES"
                            ? "primary"
                            : item.status === "PENDING"
                            ? "warning"
                            : item.status === "DIBATALKAN"
                            ? "danger"
                            : "secondary"
                        }
                      >
                        {item.status}
                      </DnaBadge>
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setHistoryModalItem(item)}
                          className="px-2 py-1 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                          title="Riwayat Jadwal"
                        >
                          Riwayat
                        </button>
                        {item.status === "MENUNGGU" && (
                          <button
                            type="button"
                            onClick={() => handleStartProduce(item)}
                            className="px-2 py-1 text-[11px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                            title="Mulai Produksi"
                          >
                            Produksi
                          </button>
                        )}
                        {item.status === "PROSES" && (
                          <button
                            type="button"
                            onClick={() => {
                              setProduceModalItem(item);
                              setActualProduceQty(item.upscaleResultKg);
                              setProduceNote("");
                            }}
                            className="px-2 py-1 text-[11px] font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors"
                            title="Catat Realisasi Selesai"
                          >
                            Produksi
                          </button>
                        )}
                        {(item.status === "MENUNGGU" || item.status === "PROSES" || item.status === "PENDING") && (
                          <button
                            type="button"
                            onClick={() => handleTogglePending(item)}
                            className="px-2 py-1 text-[11px] font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded transition-colors"
                            title="Pending / Lanjutkan"
                          >
                            Pending
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedDetail(item)}
                          className="px-2 py-1 text-[11px] font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors"
                          title="Lihat Jadwal"
                        >
                          Lihat Jadwal
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* MODAL RIWAYAT (1:1 Legacy) */}
      <DnaModal
        isOpen={!!historyModalItem}
        onClose={() => setHistoryModalItem(null)}
        title={`Riwayat Jadwal - ${historyModalItem?.scheduleCode || ""}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
            <div className="font-semibold text-slate-800">{historyModalItem?.product}</div>
            <div className="text-slate-500 font-mono">Batch Record: {historyModalItem?.batchRecord} | Customer: {historyModalItem?.customer}</div>
          </div>
          <div className="space-y-3">
            {historyModalItem?.historyLogs?.map((log, i) => (
              <div key={i} className="flex items-start gap-3 text-xs border-l-2 border-blue-500 pl-3 py-1">
                <div className="w-28 text-slate-400 font-mono whitespace-nowrap">{log.timestamp}</div>
                <div className="flex-1">
                  <div className="text-slate-800 font-medium">{log.note}</div>
                  <div className="text-[10px] text-slate-400">Operator: {log.operator}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-3 border-t border-slate-200">
            <DnaButton variant="secondary" size="sm" onClick={() => setHistoryModalItem(null)}>
              Tutup
            </DnaButton>
          </div>
        </div>
      </DnaModal>

      {/* MODAL INPUT HASIL PRODUKSI */}
      <DnaModal
        isOpen={!!produceModalItem}
        onClose={() => setProduceModalItem(null)}
        title={`Realisasi Produksi Mixing - ${produceModalItem?.scheduleCode || ""}`}
        size="md"
      >
        {produceModalItem && (
          <form onSubmit={handleCompleteProduce} className="space-y-4">
            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg text-xs space-y-1">
              <div className="font-semibold text-blue-900">{produceModalItem.product}</div>
              <div className="text-blue-700">Target Upscale: {produceModalItem.upscaleResultKg.toFixed(1)} Kg ({produceModalItem.targetPcs.toLocaleString()} PCS)</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hasil Realisasi Mixing (Kg) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={actualProduceQty}
                onChange={(e) => setActualProduceQty(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Pengolahan (Suhu/pH/Viskositas)</label>
              <textarea
                rows={3}
                placeholder="Contoh: Suhu homogenizer 70C, pH 5.5, ruahan homogen sempurna lolos organoleptik."
                value={produceNote}
                onChange={(e) => setProduceNote(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <DnaButton type="button" variant="secondary" size="sm" onClick={() => setProduceModalItem(null)}>
                Batal
              </DnaButton>
              <DnaButton type="submit" variant="primary" size="sm">
                Simpan & Selesaikan
              </DnaButton>
            </div>
          </form>
        )}
      </DnaModal>

      {/* MODAL DETAIL JADWAL MIXING (1:1 Legacy Spec) */}
      <DnaModal
        isOpen={!!selectedDetail}
        onClose={() => setSelectedDetail(null)}
        title="[Detail Jadwal Mixing]"
        size="lg"
      >
        {selectedDetail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-400 block">Kode Jadwal</span>
                <span className="font-bold font-mono text-slate-800">{selectedDetail.scheduleCode}</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-400 block">Tanggal Jadwal</span>
                <span className="font-medium text-slate-800">{selectedDetail.date}</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-400 block">Batch Record</span>
                <span className="font-semibold font-mono text-slate-800">{selectedDetail.batchRecord}</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-400 block">Sales Order</span>
                <span className="font-medium font-mono text-slate-800">{selectedDetail.salesOrder}</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-400 block">Pelanggan</span>
                <span className="font-semibold text-slate-800">{selectedDetail.customer}</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-400 block">Kategori</span>
                <span className="font-medium text-slate-800">{selectedDetail.category}</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg col-span-2">
                <span className="text-slate-400 block">Produk</span>
                <span className="font-bold text-slate-900">{selectedDetail.product}</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-400 block">Nama Formula</span>
                <span className="font-mono font-medium text-slate-800">{selectedDetail.formulaName}</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-400 block">Hasil Mixing (Upscale)</span>
                <span className="font-bold text-blue-700">{selectedDetail.upscaleResultKg.toFixed(1)} Kg</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-400 block">Target Qty</span>
                <span className="font-bold text-slate-800">{selectedDetail.targetPcs.toLocaleString()} PCS</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-400 block">Status</span>
                <DnaBadge
                  variant={
                    selectedDetail.status === "SELESAI"
                      ? "success"
                      : selectedDetail.status === "PROSES"
                      ? "primary"
                      : selectedDetail.status === "PENDING"
                      ? "warning"
                      : selectedDetail.status === "DIBATALKAN"
                      ? "danger"
                      : "secondary"
                  }
                >
                  {selectedDetail.status}
                </DnaBadge>
              </div>
            </div>

            {selectedDetail.notes && (
              <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg text-xs">
                <span className="font-semibold text-amber-800 block mb-0.5">Catatan Teknis:</span>
                <span className="text-slate-700">{selectedDetail.notes}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              {selectedDetail.status !== "DIBATALKAN" && selectedDetail.status !== "SELESAI" ? (
                <button
                  type="button"
                  onClick={() => handleCancelSchedule(selectedDetail)}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Ban className="w-3.5 h-3.5" />
                  Canceled
                </button>
              ) : (
                <div />
              )}
              <DnaButton variant="secondary" size="sm" onClick={() => setSelectedDetail(null)}>
                Close
              </DnaButton>
            </div>
          </div>
        )}
      </DnaModal>
    </div>
  );
}
