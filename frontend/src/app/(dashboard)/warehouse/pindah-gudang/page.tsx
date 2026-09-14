"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  ArrowRightLeft,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  FileSpreadsheet,
  AlertTriangle,
  Send,
  Trash2,
  FileText,
  Boxes,
  Warehouse,
  ShieldCheck,
  Package,
  Calendar,
  Building2,
  ArrowRight,
  Printer
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
  DnaInput,
  DnaSelect,
  DnaTextarea,
  DnaTable,
  useDnaToast
} from "@/components/dna";

interface TransferItem {
  id: string;
  materialCode: string;
  materialName: string;
  transferQty: number;
  availableStockOrigin: number;
  unit: string;
  batchLot: string;
}

interface WarehouseTransfer {
  id: string;
  transferNumber: string; // TRF-WH-YYYYMM-XXXX
  transferDate: string;
  fromWarehouse: string;
  toWarehouse: string;
  referenceDoc: string; // e.g. SPK / Kebutuhan Line Produksi
  totalItems: number;
  totalQty: number;
  senderPic: string;
  receiverPic?: string;
  receivedDate?: string;
  status: "IN_TRANSIT" | "COMPLETED" | "CANCELLED";
  notes?: string;
  items: TransferItem[];
}

const INITIAL_TRANSFERS: WarehouseTransfer[] = [
  {
    id: "trf-1",
    transferNumber: "TRF-WH-202609-0008",
    transferDate: "2026-09-09",
    fromWarehouse: "Gudang Bahan Baku Utama (WH-01)",
    toWarehouse: "Gudang Karantina & QC (WH-04)",
    referenceDoc: "SPK-2026-09-008",
    totalItems: 2,
    totalQty: 55.0,
    senderPic: "Bambang Sudiro (WH-01)",
    status: "IN_TRANSIT",
    notes: "Pengiriman sampel ruahan dan bahan aktif untuk re-testing kestabilan mikrobiologi.",
    items: [
      { id: "ti-1", materialCode: "BBK00028", materialName: "Super Moisturing Max", transferQty: 50.0, availableStockOrigin: 120.0, unit: "Kg", batchLot: "LOT-BB-2609-001" },
      { id: "ti-2", materialCode: "BBK00092", materialName: "Fragrance Sweet Vanilla", transferQty: 5.0, availableStockOrigin: 18.0, unit: "Kg", batchLot: "LOT-FG-2608-004" }
    ]
  },
  {
    id: "trf-2",
    transferNumber: "TRF-WH-202609-0007",
    transferDate: "2026-09-08",
    fromWarehouse: "Gudang Kemas & Box (WH-02)",
    toWarehouse: "Gudang Produk Jadi (WH-03)",
    referenceDoc: "SPK-2026-09-006",
    totalItems: 1,
    totalQty: 300,
    senderPic: "Siti Rahma (WH-02)",
    receiverPic: "Rahmat Hidayat (WH-03)",
    receivedDate: "2026-09-08 16:30",
    status: "COMPLETED",
    notes: "Transfer master carton box cadangan untuk line packaging shift malam.",
    items: [
      { id: "ti-3", materialCode: "KMS00105", materialName: "Master Carton Box K125/M125 (Isi 48)", transferQty: 300, availableStockOrigin: 1200, unit: "Pcs", batchLot: "LOT-KM-2608-012" }
    ]
  },
  {
    id: "trf-3",
    transferNumber: "TRF-WH-202609-0005",
    transferDate: "2026-09-05",
    fromWarehouse: "Gudang Bahan Baku Utama (WH-01)",
    toWarehouse: "Gudang Retur & Reject (WH-05)",
    referenceDoc: "RET-PO-202609-0004",
    totalItems: 1,
    totalQty: 25.0,
    senderPic: "Bambang Sudiro (WH-01)",
    receiverPic: "Agus Santoso (WH-05)",
    receivedDate: "2026-09-05 11:15",
    status: "COMPLETED",
    notes: "Pemindahan drum rusak fisik hasil reject QC ke gudang retur vendor.",
    items: [
      { id: "ti-4", materialCode: "REJ00004", materialName: "Drum Bahan Baku Rusak Segel", transferQty: 25.0, availableStockOrigin: 25.0, unit: "Kg", batchLot: "LOT-SON-2609-001" }
    ]
  }
];

const MASTER_WAREHOUSES = [
  "Gudang Bahan Baku Utama (WH-01)",
  "Gudang Kemas & Box (WH-02)",
  "Gudang Produk Jadi (WH-03)",
  "Gudang Karantina & QC (WH-04)",
  "Gudang Retur & Reject (WH-05)"
];

const AVAILABLE_TRANSFER_ITEMS = [
  { code: "BBK00028", name: "Super Moisturing Max", unit: "Kg", stock: 120.0, lot: "LOT-BB-2609-001" },
  { code: "BBK00031", name: "Niacinamide PC (Vitamin B3)", unit: "Kg", stock: 85.0, lot: "LOT-NC-2608-019" },
  { code: "KMS00012", name: "Botol Tube 100ml Doff White", unit: "Pcs", stock: 12500, lot: "LOT-KM-2609-002" },
  { code: "KMS00105", name: "Master Carton Box K125/M125", unit: "Pcs", stock: 350, lot: "LOT-KM-2608-012" }
];

export default function WarehouseTransfersPage() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();
  const [dataList, setDataList] = useState<WarehouseTransfer[]>(INITIAL_TRANSFERS);

  // Filters
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTransfer, setSelectedTransfer] = useState<WarehouseTransfer | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Create Form State
  const [fromWarehouse, setFromWarehouse] = useState(MASTER_WAREHOUSES[0]);
  const [toWarehouse, setToWarehouse] = useState(MASTER_WAREHOUSES[3]);
  const [referenceDoc, setReferenceDoc] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [cartItems, setCartItems] = useState<Array<{
    materialCode: string;
    materialName: string;
    transferQty: number;
    availableStockOrigin: number;
    unit: string;
    batchLot: string;
  }>>([]);

  const [selectedMatCode, setSelectedMatCode] = useState("");
  const [itemTransferQty, setItemTransferQty] = useState<number>(1);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const list = dataList;
    const totalTransfers = list.length;
    const inTransitCount = list.filter(t => t.status === "IN_TRANSIT").length;
    const completedCount = list.filter(t => t.status === "COMPLETED").length;
    const totalVolume = list.reduce((sum, t) => sum + t.totalQty, 0);

    return {
      totalTransfers,
      inTransitCount,
      completedCount,
      totalVolume
    };
  }, [dataList]);

  // Filtered List
  const filteredList = useMemo(() => {
    return dataList.filter(item => {
      const matchSearch =
        item.transferNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.referenceDoc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.fromWarehouse.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.toWarehouse.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.senderPic.toLowerCase().includes(searchQuery.toLowerCase());

      const matchTab =
        activeTab === "ALL" ? true :
        activeTab === "IN_TRANSIT" ? item.status === "IN_TRANSIT" :
        activeTab === "COMPLETED" ? item.status === "COMPLETED" : true;

      return matchSearch && matchTab;
    });
  }, [dataList, searchQuery, activeTab]);

  const handleAddItemToTransfer = () => {
    if (!selectedMatCode) {
      toast.error("Pilih material barang terlebih dahulu");
      return;
    }
    const mat = AVAILABLE_TRANSFER_ITEMS.find(m => m.code === selectedMatCode);
    if (!mat) return;

    if (itemTransferQty <= 0) {
      toast.error("Jumlah transfer harus lebih dari 0");
      return;
    }
    if (itemTransferQty > mat.stock) {
      toast.error(`Kuantitas transfer melebihi stok tersedia (${mat.stock} ${mat.unit})`);
      return;
    }

    const existing = cartItems.find(c => c.materialCode === mat.code);
    if (existing) {
      setCartItems(cartItems.map(c => c.materialCode === mat.code ? { ...c, transferQty: c.transferQty + itemTransferQty } : c));
    } else {
      setCartItems([
        ...cartItems,
        {
          materialCode: mat.code,
          materialName: mat.name,
          transferQty: itemTransferQty,
          availableStockOrigin: mat.stock,
          unit: mat.unit,
          batchLot: mat.lot
        }
      ]);
    }

    setSelectedMatCode("");
    setItemTransferQty(1);
    toast.success(`${mat.name} ditambahkan ke daftar transfer`);
  };

  const handleRemoveFromCart = (code: string) => {
    setCartItems(cartItems.filter(c => c.materialCode !== code));
  };

  const handleCreateTransfer = () => {
    if (fromWarehouse === toWarehouse) {
      toast.error("Gudang asal dan gudang tujuan tidak boleh sama");
      return;
    }
    if (!referenceDoc.trim()) {
      toast.error("Nomor Dokumen Referensi / SPK wajib diisi");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Tambahkan minimal 1 item barang yang akan dipindahkan");
      return;
    }

    const newNo = `TRF-WH-202609-00${String(dataList.length + 9).padStart(2, "0")}`;
    const totalQty = cartItems.reduce((sum, i) => sum + i.transferQty, 0);

    const newTransfer: WarehouseTransfer = {
      id: `trf-${Date.now()}`,
      transferNumber: newNo,
      transferDate: new Date().toISOString().split("T")[0],
      fromWarehouse,
      toWarehouse,
      referenceDoc,
      totalItems: cartItems.length,
      totalQty,
      senderPic: "Petugas Gudang Asal (Anda)",
      status: "IN_TRANSIT",
      notes: formNotes || "Mutasi fisik antar gudang internal.",
      items: cartItems.map((c, idx) => ({
        id: `ti-${Date.now()}-${idx}`,
        ...c
      }))
    };

    setDataList([newTransfer, ...dataList]);
    setIsCreateOpen(false);
    setCartItems([]);
    setReferenceDoc("");
    setFormNotes("");
    toast.success(`Surat Transfer ${newNo} berhasil diterbitkan (Status: In Transit).`);
  };

  const handleConfirmReceived = (id: string) => {
    setDataList(dataList.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: "COMPLETED",
          receiverPic: "Petugas Gudang Penerima (Anda)",
          receivedDate: new Date().toLocaleString("id-ID")
        };
      }
      return item;
    }));
    if (selectedTransfer && selectedTransfer.id === id) {
      setSelectedTransfer({
        ...selectedTransfer,
        status: "COMPLETED",
        receiverPic: "Petugas Gudang Penerima (Anda)",
        receivedDate: new Date().toLocaleString("id-ID")
      });
    }
    toast.success("Barang transfer telah diverifikasi fisik dan stok gudang tujuan otomatis bertambah.");
  };

  const getStatusBadge = (status: WarehouseTransfer["status"]) => {
    switch (status) {
      case "IN_TRANSIT":
        return <DnaBadge variant="info">Sedang Dikirim (In Transit)</DnaBadge>;
      case "COMPLETED":
        return <DnaBadge variant="success">Selesai Serah Terima</DnaBadge>;
      case "CANCELLED":
        return <DnaBadge variant="critical">Dibatalkan</DnaBadge>;
    }
  };

  return (
    <DnaPageContainer>
      {/* Header */}
      <DnaPageHeader
        title="Transfer Antar Gudang (Inter-Warehouse Transfers)"
        description="Pemindahan persediaan material fisik antar lokasi gudang internal dengan alur serah terima 2-Step Handover."
        badge={<DnaBadge variant="neutral">SCR-088 / WH-TRANSFER</DnaBadge>}
        actions={
          <div className="flex items-center gap-2.5">
            <DnaButton
              variant="outline"
              size="sm"
              icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
              onClick={() => toast.success("Data Transfer Barang diexport ke Excel")}
            >
              Export Excel
            </DnaButton>
            <DnaButton
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateOpen(true)}
            >
              + Buat Transfer Antar Gudang
            </DnaButton>
          </div>
        }
      />

      {/* KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Dokumen Transfer"
          value={`${kpis.totalTransfers} Mutasi`}
          icon={<ArrowRightLeft className="w-5 h-5 text-indigo-600" />}
          delta={{ value: "+3 minggu ini", isPositive: true }}
        />
        <DnaStatCard
          label="Sedang Dalam Pengiriman"
          value={`${kpis.inTransitCount} Mutasi`}
          icon={<Clock className="w-5 h-5 text-blue-500" />}
          variant={kpis.inTransitCount > 0 ? "warning" : "default"}
        />
        <DnaStatCard
          label="Selesai Diterima"
          value={`${kpis.completedCount} Mutasi`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
        <DnaStatCard
          label="Total Volume Berpindah"
          value={`${kpis.totalVolume.toLocaleString("id-ID")} Qty`}
          icon={<Boxes className="w-5 h-5 text-purple-600" />}
        />
      </DnaKpiGrid>

      {/* Navigation Tabs */}
      <div className="mb-4">
        <DnaTabNav
          tabs={[
            { id: "ALL", label: "Semua Transfer", count: dataList.length },
            { id: "IN_TRANSIT", label: "Sedang Dikirim (In Transit)", count: dataList.filter(d => d.status === "IN_TRANSIT").length },
            { id: "COMPLETED", label: "Selesai Serah Terima", count: dataList.filter(d => d.status === "COMPLETED").length }
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Main Table Card */}
      <DnaDataTableCard
        title="Daftar Surat Pemindahan Barang Antar Gudang"
        description="Stok baru bertambah di gudang tujuan setelah petugas penerima mengonfirmasi penerimaan fisik."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari No Transfer, Dokumen SPK, Gudang Asal/Tujuan..."
      >
        <div className="overflow-x-auto">
          <DnaTable className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">No. Transfer</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Gudang Asal</th>
                <th className="py-3 px-4">Gudang Tujuan</th>
                <th className="py-3 px-4">Dokumen Referensi</th>
                <th className="py-3 px-4 text-center">Total Item</th>
                <th className="py-3 px-4 text-right">Total Qty</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <ArrowRightLeft className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada dokumen transfer antar gudang yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 text-xs">
                      {row.transferNumber}
                    </td>
                    <td className="py-3 px-4 text-xs whitespace-nowrap">
                      {row.transferDate}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-800">
                      {row.fromWarehouse}
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-900">
                      {row.toWarehouse}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-slate-700">
                      {row.referenceDoc}
                    </td>
                    <td className="py-3 px-4 text-center text-xs font-semibold text-slate-800">
                      {row.totalItems} Jenis
                    </td>
                    <td className="py-3 px-4 text-right text-xs font-mono font-bold text-indigo-700">
                      {row.totalQty.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(row.status)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          icon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => {
                            setSelectedTransfer(row);
                            setIsDetailOpen(true);
                          }}
                        >
                          Detail
                        </DnaButton>
                        {row.status === "IN_TRANSIT" && (
                          <DnaButton
                            variant="secondary"
                            size="sm"
                            icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                            onClick={() => handleConfirmReceived(row.id)}
                          >
                            Terima Fisik
                          </DnaButton>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </DnaTable>
        </div>
      </DnaDataTableCard>

      {/* Modal Detail Transfer */}
      {selectedTransfer && (
        <DnaModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Surat Transfer Barang: ${selectedTransfer.transferNumber}`}
          description={`Pemindahan dari ${selectedTransfer.fromWarehouse} ➔ ${selectedTransfer.toWarehouse}`}
          size="xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="text-xs text-slate-500">
                Pengirim: <span className="font-semibold text-slate-700">{selectedTransfer.senderPic}</span>
                {selectedTransfer.receiverPic && (
                  <span> | Penerima: <span className="font-semibold text-slate-700">{selectedTransfer.receiverPic}</span></span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <DnaButton
                  variant="outline"
                  size="sm"
                  icon={<Printer className="w-4 h-4" />}
                  onClick={() => toast.success("Mencetak Surat Transfer Barang Antar Gudang...")}
                >
                  Cetak Bukti Transfer
                </DnaButton>
                {selectedTransfer.status === "IN_TRANSIT" && (
                  <DnaButton
                    variant="primary"
                    size="sm"
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    onClick={() => {
                      handleConfirmReceived(selectedTransfer.id);
                      setIsDetailOpen(false);
                    }}
                  >
                    Konfirmasi Penerimaan Fisik
                  </DnaButton>
                )}
                <DnaButton variant="primary" size="sm" onClick={() => setIsDetailOpen(false)}>
                  Tutup
                </DnaButton>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Header Cards */}
            <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500 block">No. Referensi / SPK</span>
                <span className="font-bold text-slate-900 font-mono">{selectedTransfer.referenceDoc}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Total Volume Berpindah</span>
                <span className="font-bold text-indigo-700 font-mono text-sm">{selectedTransfer.totalQty.toLocaleString("id-ID")} Unit</span>
              </div>
              <div>
                <span className="text-slate-500 block">Tanggal Transfer</span>
                <span className="font-medium text-slate-800">{selectedTransfer.transferDate}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Status Mutasi</span>
                <div className="mt-0.5">{getStatusBadge(selectedTransfer.status)}</div>
              </div>
            </div>

            {selectedTransfer.notes && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-indigo-900">
                <span className="font-bold block mb-0.5">Catatan Instruksi Pemindahan:</span>
                {selectedTransfer.notes}
              </div>
            )}

            {/* Items Table */}
            <div>
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">Daftar Barang yang Dipindahkan</h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <DnaTable className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Kode</th>
                      <th className="py-2.5 px-3">Nama Material / Barang</th>
                      <th className="py-2.5 px-3 text-right">Qty Transfer</th>
                      <th className="py-2.5 px-3">Satuan</th>
                      <th className="py-2.5 px-3">No. Batch / Lot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {selectedTransfer.items.map((it) => (
                      <tr key={it.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-indigo-600 font-medium">{it.materialCode}</td>
                        <td className="py-2.5 px-3 font-sans font-semibold text-slate-800">{it.materialName}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-indigo-700">{it.transferQty.toLocaleString("id-ID")}</td>
                        <td className="py-2.5 px-3 text-slate-500">{it.unit}</td>
                        <td className="py-2.5 px-3 text-slate-700">{it.batchLot}</td>
                      </tr>
                    ))}
                  </tbody>
                </DnaTable>
              </div>
            </div>
          </div>
        </DnaModal>
      )}

      {/* Modal Buat Transfer Baru */}
      <DnaModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Form Transfer Barang Antar Gudang"
        description="Pilih gudang asal dan gudang tujuan serta item barang yang akan dipindahkan fisiknya."
        size="2xl"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <DnaButton variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton
              variant="primary"
              size="sm"
              icon={<Send className="w-4 h-4" />}
              onClick={handleCreateTransfer}
            >
              Terbitkan Surat Transfer
            </DnaButton>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Gudang Asal (Pengirim) *</label>
<DnaSelect 
                aria-label="Gudang Asal"
                value={fromWarehouse}
                onChange={setFromWarehouse}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              >
                {MASTER_WAREHOUSES.map((wh) => (
                  <option key={wh} value={wh}>{wh}</option>
                ))}
              </DnaSelect>
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Gudang Tujuan (Penerima) *</label>
<DnaSelect 
                aria-label="Gudang Tujuan"
                value={toWarehouse}
                onChange={setToWarehouse}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              >
                {MASTER_WAREHOUSES.map((wh) => (
                  <option key={wh} value={wh}>{wh}</option>
                ))}
              </DnaSelect>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">No. Dokumen Referensi / SPK / Permintaan *</label>
            <DnaInput
              type="text"
              placeholder="Contoh: SPK-2026-09-012 / REQ-202609-0010"
              value={referenceDoc}
              onChange={(e) => setReferenceDoc(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Item Adder */}
          <div className="border-t border-slate-200 pt-3">
            <h4 className="font-bold text-slate-800 text-xs mb-2 flex items-center justify-between">
              <span>Pilih Material yang Dipindahkan</span>
              <span className="text-[11px] font-normal text-slate-500">{cartItems.length} Item dalam Daftar</span>
            </h4>
            <div className="grid grid-cols-12 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 items-end">
              <div className="col-span-7">
                <label className="block text-[11px] text-slate-600 font-medium mb-1">Pilih Material / Barang</label>
  <DnaSelect 
                  aria-label="Pilih Material Transfer"
                  value={selectedMatCode}
                  onChange={setSelectedMatCode}
                  className="w-full text-xs border border-slate-300 rounded-lg p-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">-- Pilih Material Gudang Asal --</option>
                  {AVAILABLE_TRANSFER_ITEMS.map((m) => (
                    <option key={m.code} value={m.code}>
                      [{m.code}] {m.name} (Tersedia: {m.stock} {m.unit})
                    </option>
                  ))}
                </DnaSelect>
              </div>
              <div className="col-span-3">
                <label className="block text-[11px] text-slate-600 font-medium mb-1">Qty Transfer</label>
                <DnaInput
                  type="number"
                  min="0.1"
                  step="any"
                  value={itemTransferQty}
                  onChange={(e) => setItemTransferQty(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-1.5 text-right font-mono"
                />
              </div>
              <div className="col-span-2">
                <DnaButton
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={handleAddItemToTransfer}
                >
                  Tambah
                </DnaButton>
              </div>
            </div>
          </div>

          {/* Cart Table */}
          {cartItems.length > 0 && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <DnaTable className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-700">
                  <tr>
                    <th className="py-2 px-3">Kode</th>
                    <th className="py-2 px-3">Nama Material</th>
                    <th className="py-2 px-3 text-right">Stok Asal</th>
                    <th className="py-2 px-3 text-right">Qty Dipindahkan</th>
                    <th className="py-2 px-3">Satuan</th>
                    <th className="py-2 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cartItems.map((c) => (
                    <tr key={c.materialCode}>
                      <td className="py-2 px-3 font-mono font-medium text-indigo-600">{c.materialCode}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{c.materialName}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600">{c.availableStockOrigin}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-indigo-700">{c.transferQty}</td>
                      <td className="py-2 px-3 text-slate-500">{c.unit}</td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(c.materialCode)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </DnaTable>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-bold mb-1">Catatan Tambahan</label>
            <DnaTextarea
              rows={2}
              placeholder="Contoh: Pemindahan material ruahan untuk line mixing shift malam."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}
