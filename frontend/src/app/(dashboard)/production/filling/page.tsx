"use client";

import React, { useState, useMemo } from "react";
import {
  Package,
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
  XCircle,
  Scale,
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

interface FillingProductionItem {
  id: string;
  code: string;
  date: string;
  batchRecord: string;
  salesOrder: string;
  customer: string;
  category: string;
  product: string; // Produk (BSJ)
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

const INITIAL_FILLING_DATA: FillingProductionItem[] = [
  {
    id: "FIL-001",
    code: "SCH-FIL-2026-0001",
    date: "2026-09-19",
    batchRecord: "BR-2026-0001",
    salesOrder: "SO-202609-000004",
    customer: "Farah Derma Clinic",
    category: "Skincare",
    product: "Day Cream SPF 30",
    targetPcs: 3000,
    actualPcs: 2980,
    rejectPcs: 12,
    machine: "Semi-Auto Jar Filling Line (FIL-01)",
    status: "PROSES",
    notes: "Pot acrylic 50g dengan inner lid dan seal foil induksi",
    detailRows: [
      {
        id: "d1",
        productionCode: "PRD-FIL-2026-0001",
        machine: "Semi-Auto Jar Filling Line (FIL-01)",
        qtyProduce: 1500,
        date: "2026-09-19 10:30",
        status: "SELESAI"
      },
      {
        id: "d2",
        productionCode: "PRD-FIL-2026-0002",
        machine: "Semi-Auto Jar Filling Line (FIL-01)",
        qtyProduce: 1480,
        date: "2026-09-19 14:00",
        status: "PROSES"
      }
    ],
    historyLogs: [
      { timestamp: "2026-09-19 08:30", note: "Sanitasi line filling dan kalibrasi timbangan nettonya (50g +/- 0.5g)", operator: "Supervisor Filling" },
      { timestamp: "2026-09-19 09:15", note: "Transfer ruahan krim dari ruang mixing", operator: "Operator Filling" },
      { timestamp: "2026-09-19 10:00", note: "Mulai filling batch 1 (1500 pot)", operator: "Operator Filling" }
    ]
  },
  {
    id: "FIL-002",
    code: "SCH-FIL-2026-0002",
    date: "2026-09-20",
    batchRecord: "BR-2026-0002",
    salesOrder: "SO-202609-000005",
    customer: "Glow Skin Official",
    category: "Skincare",
    product: "Brightening Serum",
    targetPcs: 5000,
    actualPcs: 4975,
    rejectPcs: 15,
    machine: "Rotary Auto Dropper Filling Line (FIL-02)",
    status: "SELESAI",
    notes: "Botol dropper kaca 30ml amber dengan torque capper 1.8 Nm",
    detailRows: [
      {
        id: "d3",
        productionCode: "PRD-FIL-2026-0003",
        machine: "Rotary Auto Dropper Filling Line (FIL-02)",
        qtyProduce: 4975,
        date: "2026-09-20 16:00",
        status: "SELESAI"
      }
    ],
    historyLogs: [
      { timestamp: "2026-09-20 08:00", note: "Pembersihan line dan tes kebocoran botol (leak test lolos)", operator: "Supervisor Filling" },
      { timestamp: "2026-09-20 16:30", note: "Filling 5000 botol selesai dengan 4975 good pcs dan 15 reject", operator: "Operator Filling" }
    ]
  },
  {
    id: "FIL-003",
    code: "SCH-FIL-2026-0003",
    date: "2026-09-21",
    batchRecord: "BR-2026-0003",
    salesOrder: "SO-202609-000006",
    customer: "Velvet Lips Beauty",
    category: "Decorative",
    product: "Matte Velvet Lip Cream Shade 04",
    targetPcs: 6000,
    actualPcs: 0,
    rejectPcs: 0,
    machine: "Rotary Piston Filling Line 1 (FIL-01)",
    status: "MENUNGGU",
    notes: "Botol tube lipcream dengan stopper wiper bening",
    detailRows: [],
    historyLogs: [
      { timestamp: "2026-09-18 10:00", note: "Jadwal filling dirilis dari jadwal mixing", operator: "Admin Produksi" }
    ]
  },
  {
    id: "FIL-004",
    code: "SCH-FIL-2026-0004",
    date: "2026-09-22",
    batchRecord: "BR-2026-0004",
    salesOrder: "SO-202609-000007",
    customer: "Aura Skin Estetika",
    category: "Skincare",
    product: "Hydrating Facial Toner 100ml",
    targetPcs: 4000,
    actualPcs: 0,
    rejectPcs: 0,
    machine: "Liquid Overflow Filling Line (FIL-03)",
    status: "PENDING",
    notes: "Menunggu penyelesaian batch mixing ruahan toner",
    detailRows: [],
    historyLogs: [
      { timestamp: "2026-09-19 11:00", note: "Status ditangguhkan sementara menunggu QC bulk", operator: "Supervisor Produksi" }
    ]
  }
];

export default function ProductionFillingPage() {
  const [data, setData] = useState<FillingProductionItem[]>(INITIAL_FILLING_DATA);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Modals
  const [selectedDetail, setSelectedDetail] = useState<FillingProductionItem | null>(null);
  const [historyModalItem, setHistoryModalItem] = useState<FillingProductionItem | null>(null);
  const [produceModalItem, setProduceModalItem] = useState<FillingProductionItem | null>(null);
  const [produceQty, setProduceQty] = useState<number>(0);
  const [rejectQty, setRejectQty] = useState<number>(0);
  const [produceMachine, setProduceMachine] = useState<string>("");

  const { addToast } = useDnaToast();

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
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

  const handleStartProduce = (item: FillingProductionItem) => {
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
                  note: "Line filling mulai beroperasi",
                  operator: "Operator Filling"
                }
              ]
            }
          : d
      )
    );
    addToast({ title: "Produksi Dimulai", message: `Jadwal filling ${item.code} berstatus PROSES`, type: "success" });
  };

  const handleCompleteProduce = (e: React.FormEvent) => {
    e.preventDefault();
    if (!produceModalItem) return;

    const newDetailRow = {
      id: `d-${Date.now()}`,
      productionCode: `PRD-FIL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      machine: produceMachine || produceModalItem.machine,
      qtyProduce: produceQty,
      date: new Date().toISOString().replace("T", " ").substring(0, 16),
      status: "SELESAI"
    };

    setData((prev) =>
      prev.map((d) =>
        d.id === produceModalItem.id
          ? {
              ...d,
              status: "SELESAI",
              actualPcs: produceQty,
              rejectPcs: rejectQty,
              machine: produceMachine || d.machine,
              detailRows: [...(d.detailRows || []), newDetailRow],
              historyLogs: [
                ...(d.historyLogs || []),
                {
                  timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
                  note: `Filling selesai: ${produceQty} Good PCS, ${rejectQty} Reject PCS pada ${produceMachine || d.machine}`,
                  operator: "Supervisor Filling"
                }
              ]
            }
          : d
      )
    );

    addToast({
      title: "Realisasi Selesai",
      message: `Produksi filling ${produceModalItem.code} selesai (${produceQty} Good PCS)`,
      type: "success"
    });
    setProduceModalItem(null);
  };

  return (
    <div className="space-y-6">
      <DnaPageHeader
        title="Produksi Filling"
        subtitle="Operasional dan Realisasi Pengisian Formula Ruahan ke Kemasan Primer (Ruang Bersih Kelas C/D)"
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Jadwal Filling"
          value={kpis.total.toString()}
          subtext="Semua batch record"
          icon={<Package className="w-5 h-5 text-purple-600" />}
        />
        <DnaStatCard
          label="Sedang Proses"
          value={kpis.proses.toString()}
          subtext="Line filling aktif"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
        />
        <DnaStatCard
          label="Pending / Tertunda"
          value={kpis.pending.toString()}
          subtext="Perlu perhatian"
          icon={<RotateCw className="w-5 h-5 text-orange-600" />}
        />
        <DnaStatCard
          label="Filling Selesai"
          value={kpis.selesai.toString()}
          subtext="Siap packaging sekunder"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        title="Daftar Produksi Filling"
        description="Data pelaksanaan filling kemasan primer sesuai batch record dan target PCS"
        actions={
          <div className="flex items-center gap-2">
            <div className="w-64">
              <DnaInput
                placeholder="Cari kode, batch, produk..."
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
            </select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="px-3.5 py-3 w-10 text-center">#</th>
                <th className="px-3.5 py-3">Kode</th>
                <th className="px-3.5 py-3">Tanggal</th>
                <th className="px-3.5 py-3">Batch Record</th>
                <th className="px-3.5 py-3">Pelanggan</th>
                <th className="px-3.5 py-3">Produk</th>
                <th className="px-3.5 py-3 text-right">Target (PCS)</th>
                <th className="px-3.5 py-3 text-center">Status</th>
                <th className="px-3.5 py-3 text-center">#</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3.5 py-8 text-center text-slate-400">
                    Tidak ada data produksi filling yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-3.5 py-3 text-center font-medium text-slate-400">{idx + 1}</td>
                    <td className="px-3.5 py-3 font-semibold text-purple-600 font-mono">{item.code}</td>
                    <td className="px-3.5 py-3 text-slate-700 whitespace-nowrap">{item.date}</td>
                    <td className="px-3.5 py-3 font-mono text-slate-800">{item.batchRecord}</td>
                    <td className="px-3.5 py-3 text-slate-800">{item.customer}</td>
                    <td className="px-3.5 py-3 font-medium text-slate-900">{item.product}</td>
                    <td className="px-3.5 py-3 text-right font-semibold text-slate-800">
                      {item.targetPcs.toLocaleString()} PCS
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
                              setProduceQty(item.targetPcs);
                              setRejectQty(0);
                              setProduceMachine(item.machine);
                            }}
                            className="px-2 py-1 text-[11px] font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors"
                            title="Catat Realisasi Selesai"
                          >
                            Produksi
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedDetail(item)}
                          className="px-2 py-1 text-[11px] font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded transition-colors"
                          title="Lihat Detail Jadwal"
                        >
                          Detail
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
        title={`Riwayat Jadwal Filling - ${historyModalItem?.code || ""}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
            <div className="font-semibold text-slate-800">{historyModalItem?.product}</div>
            <div className="text-slate-500 font-mono">Batch Record: {historyModalItem?.batchRecord} | Customer: {historyModalItem?.customer}</div>
          </div>
          <div className="space-y-3">
            {historyModalItem?.historyLogs?.map((log, i) => (
              <div key={i} className="flex items-start gap-3 text-xs border-l-2 border-purple-500 pl-3 py-1">
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

      {/* MODAL INPUT HASIL FILLING */}
      <DnaModal
        isOpen={!!produceModalItem}
        onClose={() => setProduceModalItem(null)}
        title={`Realisasi Produksi Filling - ${produceModalItem?.code || ""}`}
        size="md"
      >
        {produceModalItem && (
          <form onSubmit={handleCompleteProduce} className="space-y-4">
            <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-lg text-xs space-y-1">
              <div className="font-semibold text-purple-900">{produceModalItem.product}</div>
              <div className="text-purple-700">Target: {produceModalItem.targetPcs.toLocaleString()} PCS | Batch: {produceModalItem.batchRecord}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mesin / Line Filling <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={produceMachine}
                onChange={(e) => setProduceMachine(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Good Qty (PCS) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={produceQty}
                  onChange={(e) => setProduceQty(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 font-bold text-emerald-700"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reject Qty (PCS)</label>
                <input
                  type="number"
                  value={rejectQty}
                  onChange={(e) => setRejectQty(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 font-bold text-rose-600"
                />
              </div>
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

      {/* MODAL DETAIL JADWAL FILLING (1:1 Legacy Spec) */}
      <DnaModal
        isOpen={!!selectedDetail}
        onClose={() => setSelectedDetail(null)}
        title="[Detail Jadwal Filling]"
        size="lg"
      >
        {selectedDetail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-400 block">Kode Jadwal</span>
                <span className="font-bold font-mono text-slate-800">{selectedDetail.code}</span>
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
                <span className="text-slate-400 block">Produk (BSJ)</span>
                <span className="font-bold text-slate-900">{selectedDetail.product}</span>
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
                      : "secondary"
                  }
                >
                  {selectedDetail.status}
                </DnaBadge>
              </div>
            </div>

            {/* TABEL DETAIL REALISASI PRODUKSI */}
            <div>
              <div className="text-xs font-semibold text-slate-700 mb-2">Tabel Detail Realisasi Produksi:</div>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase">
                    <tr>
                      <th className="px-3 py-2 w-8 text-center">#</th>
                      <th className="px-3 py-2">Kode Produksi</th>
                      <th className="px-3 py-2">Mesin</th>
                      <th className="px-3 py-2 text-right">Qty Produksi</th>
                      <th className="px-3 py-2">Tanggal</th>
                      <th className="px-3 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {!selectedDetail.detailRows || selectedDetail.detailRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-4 text-center text-slate-400">
                          Belum ada log realisasi produksi.
                        </td>
                      </tr>
                    ) : (
                      selectedDetail.detailRows.map((row, i) => (
                        <tr key={row.id} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2 text-center text-slate-400">{i + 1}</td>
                          <td className="px-3 py-2 font-mono font-semibold text-slate-800">{row.productionCode}</td>
                          <td className="px-3 py-2 text-slate-700">{row.machine}</td>
                          <td className="px-3 py-2 text-right font-bold text-slate-800">{row.qtyProduce.toLocaleString()} PCS</td>
                          <td className="px-3 py-2 text-slate-600">{row.date}</td>
                          <td className="px-3 py-2 text-center">
                            <DnaBadge variant={row.status === "SELESAI" ? "success" : "primary"}>
                              {row.status}
                            </DnaBadge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
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
