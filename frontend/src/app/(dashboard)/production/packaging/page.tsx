"use client";

import React, { useState, useMemo } from "react";
import {
  Boxes,
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
  Package,
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

interface PackagingProductionItem {
  id: string;
  code: string;
  date: string;
  batchRecord: string;
  salesOrder: string;
  customer: string;
  category: string;
  product: string; // Produk (BJD)
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

const INITIAL_PACKAGING_DATA: PackagingProductionItem[] = [
  {
    id: "PKG-001",
    code: "SCH-PKG-2026-0001",
    date: "2026-09-20",
    batchRecord: "BR-2026-0001",
    salesOrder: "SO-202609-000004",
    customer: "Farah Derma Clinic",
    category: "Skincare",
    product: "Day Cream SPF 30 (BJD)",
    targetPcs: 3000,
    actualPcs: 2970,
    rejectPcs: 10,
    machine: "Conveyor Line 1 & Shrink Tunnel (PCK-01)",
    status: "PROSES",
    notes: "Inner box lipat, segel stiker hologram BPOM, shrink wrap 6-pack & master carton",
    detailRows: [
      {
        id: "dp1",
        productionCode: "PRD-PKG-2026-0001",
        machine: "Conveyor Line 1 (PCK-01)",
        qtyProduce: 1500,
        date: "2026-09-20 11:00",
        status: "SELESAI"
      },
      {
        id: "dp2",
        productionCode: "PRD-PKG-2026-0002",
        machine: "Conveyor Line 1 (PCK-01)",
        qtyProduce: 1470,
        date: "2026-09-20 15:30",
        status: "PROSES"
      }
    ],
    historyLogs: [
      { timestamp: "2026-09-20 08:30", note: "Pengecekan barcode EAN-13 & cetak Exp Date (09/2029)", operator: "Supervisor Packaging" },
      { timestamp: "2026-09-20 09:15", note: "Mulai pelipatan inner box & pemasangan stiker hologram", operator: "Operator Packaging" }
    ]
  },
  {
    id: "PKG-002",
    code: "SCH-PKG-2026-0002",
    date: "2026-09-21",
    batchRecord: "BR-2026-0002",
    salesOrder: "SO-202609-000005",
    customer: "Glow Skin Official",
    category: "Skincare",
    product: "Brightening Serum (BJD)",
    targetPcs: 5000,
    actualPcs: 4960,
    rejectPcs: 15,
    machine: "Manual Packaging Table Line 2 (PCK-02)",
    status: "SELESAI",
    notes: "Dus lipat hot print gold, insert leaflet, shrink film dan packing ke 52 box master",
    detailRows: [
      {
        id: "dp3",
        productionCode: "PRD-PKG-2026-0003",
        machine: "Manual Packaging Table Line 2 (PCK-02)",
        qtyProduce: 4960,
        date: "2026-09-21 16:00",
        status: "SELESAI"
      }
    ],
    historyLogs: [
      { timestamp: "2026-09-21 08:00", note: "Persiapan material kemasan sekunder", operator: "Supervisor Packaging" },
      { timestamp: "2026-09-21 16:30", note: "Pengemasan sekunder 5000 pcs selesai, produk jadi siap ke Gudang BJD", operator: "Operator Packaging" }
    ]
  },
  {
    id: "PKG-003",
    code: "SCH-PKG-2026-0003",
    date: "2026-09-22",
    batchRecord: "BR-2026-0003",
    salesOrder: "SO-202609-000006",
    customer: "Velvet Lips Beauty",
    category: "Decorative",
    product: "Matte Velvet Lip Cream Shade 04 (BJD)",
    targetPcs: 6000,
    actualPcs: 0,
    rejectPcs: 0,
    machine: "Conveyor Line 1 & Shrink Tunnel (PCK-01)",
    status: "MENUNGGU",
    notes: "Inner box satin matte dengan batch number inkjet printing",
    detailRows: [],
    historyLogs: [
      { timestamp: "2026-09-19 14:00", note: "Jadwal packaging dibuat dari SPK", operator: "Admin Produksi" }
    ]
  },
  {
    id: "PKG-004",
    code: "SCH-PKG-2026-0004",
    date: "2026-09-23",
    batchRecord: "BR-2026-0004",
    salesOrder: "SO-202609-000007",
    customer: "Aura Skin Estetika",
    category: "Skincare",
    product: "Hydrating Facial Toner 100ml (BJD)",
    targetPcs: 4000,
    actualPcs: 0,
    rejectPcs: 0,
    machine: "Manual Packaging Table Line 2 (PCK-02)",
    status: "PENDING",
    notes: "Menunggu penyelesaian filling botol toner",
    detailRows: [],
    historyLogs: [
      { timestamp: "2026-09-20 10:00", note: "Status ditangguhkan sementara menunggu antrian filling", operator: "Supervisor Produksi" }
    ]
  }
];

export default function ProductionPackagingPage() {
  const [data, setData] = useState<PackagingProductionItem[]>(INITIAL_PACKAGING_DATA);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Modals
  const [selectedDetail, setSelectedDetail] = useState<PackagingProductionItem | null>(null);
  const [historyModalItem, setHistoryModalItem] = useState<PackagingProductionItem | null>(null);
  const [produceModalItem, setProduceModalItem] = useState<PackagingProductionItem | null>(null);
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

  const handleStartProduce = (item: PackagingProductionItem) => {
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
                  note: "Line packaging sekunder mulai beroperasi",
                  operator: "Operator Packaging"
                }
              ]
            }
          : d
      )
    );
    addToast({ title: "Produksi Dimulai", message: `Jadwal packaging ${item.code} berstatus PROSES`, type: "success" });
  };

  const handleTogglePending = (item: PackagingProductionItem) => {
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
      message: `${item.code} diubah menjadi ${newStatus}`,
      type: "info"
    });
  };

  const handleCompleteProduce = (e: React.FormEvent) => {
    e.preventDefault();
    if (!produceModalItem) return;

    const newDetailRow = {
      id: `dp-${Date.now()}`,
      productionCode: `PRD-PKG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
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
                  note: `Packaging selesai: ${produceQty} Good PCS, ${rejectQty} Reject pada ${produceMachine || d.machine}`,
                  operator: "Supervisor Packaging"
                }
              ]
            }
          : d
      )
    );

    addToast({
      title: "Realisasi Selesai",
      message: `Produksi packaging ${produceModalItem.code} selesai (${produceQty} Good PCS)`,
      type: "success"
    });
    setProduceModalItem(null);
  };

  return (
    <div className="space-y-6">
      <DnaPageHeader
        title="Produksi Packaging"
        subtitle="Operasional dan Realisasi Pengemasan Sekunder, Pelabelan Barcode, Hologram & Master Box"
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Jadwal Packaging"
          value={kpis.total.toString()}
          subtext="Semua batch record"
          icon={<Boxes className="w-5 h-5 text-indigo-600" />}
        />
        <DnaStatCard
          label="Sedang Proses"
          value={kpis.proses.toString()}
          subtext="Line packing aktif"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
        />
        <DnaStatCard
          label="Pending / Tertunda"
          value={kpis.pending.toString()}
          subtext="Perlu perhatian"
          icon={<RotateCw className="w-5 h-5 text-orange-600" />}
        />
        <DnaStatCard
          label="Packaging Selesai"
          value={kpis.selesai.toString()}
          subtext="Siap masuk Gudang BJD"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        title="Daftar Produksi Packaging"
        description="Data pelaksanaan pengemasan sekunder produk jadi kosmetik sesuai instruksi batch"
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
                    Tidak ada data produksi packaging yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-3.5 py-3 text-center font-medium text-slate-400">{idx + 1}</td>
                    <td className="px-3.5 py-3 font-semibold text-indigo-600 font-mono">{item.code}</td>
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
        title={`Riwayat Jadwal Packaging - ${historyModalItem?.code || ""}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
            <div className="font-semibold text-slate-800">{historyModalItem?.product}</div>
            <div className="text-slate-500 font-mono">Batch Record: {historyModalItem?.batchRecord} | Customer: {historyModalItem?.customer}</div>
          </div>
          <div className="space-y-3">
            {historyModalItem?.historyLogs?.map((log, i) => (
              <div key={i} className="flex items-start gap-3 text-xs border-l-2 border-indigo-500 pl-3 py-1">
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

      {/* MODAL INPUT HASIL PACKAGING */}
      <DnaModal
        isOpen={!!produceModalItem}
        onClose={() => setProduceModalItem(null)}
        title={`Realisasi Produksi Packaging - ${produceModalItem?.code || ""}`}
        size="md"
      >
        {produceModalItem && (
          <form onSubmit={handleCompleteProduce} className="space-y-4">
            <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-lg text-xs space-y-1">
              <div className="font-semibold text-indigo-900">{produceModalItem.product}</div>
              <div className="text-indigo-700">Target: {produceModalItem.targetPcs.toLocaleString()} PCS | Batch: {produceModalItem.batchRecord}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mesin / Line Packaging <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={produceMachine}
                onChange={(e) => setProduceMachine(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-emerald-700"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reject Qty (PCS)</label>
                <input
                  type="number"
                  value={rejectQty}
                  onChange={(e) => setRejectQty(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-rose-600"
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

      {/* MODAL DETAIL JADWAL PACKAGING (1:1 Legacy Spec) */}
      <DnaModal
        isOpen={!!selectedDetail}
        onClose={() => setSelectedDetail(null)}
        title="[Detail Jadwal Packaging]"
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
                <span className="text-slate-400 block">Produk (BJD)</span>
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
