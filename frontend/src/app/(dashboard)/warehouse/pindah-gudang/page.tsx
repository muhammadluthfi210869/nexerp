"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  ArrowRightLeft,
  Plus,
  Eye,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  AlertTriangle,
  Send,
  Boxes,
  Warehouse,
  ArrowRight,
  Printer,
  Trash2
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
  DnaDetailDrawer,
  DnaInput,
  DnaSelect,
  DnaTextarea,
  DnaTable,
  useDnaToast
} from "@/components/dna";
import { DnaCell } from "@/components/dna/cells/DnaCell";

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
      { id: "ti-2", materialCode: "BBK00092", materialName: "Fragrance Sweet Vanilla", transferQty: 5.0, availableStockOrigin: 18.0, unit: "Kg", batchLot: "LOT-FG-2608-004" },
    ],
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
      { id: "ti-3", materialCode: "KMS00105", materialName: "Master Carton Box K125/M125 (Isi 48)", transferQty: 300, availableStockOrigin: 1200, unit: "Pcs", batchLot: "LOT-KM-2608-012" },
    ],
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
      { id: "ti-4", materialCode: "REJ00004", materialName: "Drum Bahan Baku Rusak Segel", transferQty: 25.0, availableStockOrigin: 25.0, unit: "Kg", batchLot: "LOT-SON-2609-001" },
    ],
  },
];

const MASTER_WAREHOUSES = [
  "Gudang Bahan Baku Utama (WH-01)",
  "Gudang Kemas & Box (WH-02)",
  "Gudang Produk Jadi (WH-03)",
  "Gudang Karantina & QC (WH-04)",
  "Gudang Retur & Reject (WH-05)",
];

const AVAILABLE_TRANSFER_ITEMS = [
  { code: "BBK00028", name: "Super Moisturing Max", unit: "Kg", stock: 120.0, lot: "LOT-BB-2609-001" },
  { code: "BBK00031", name: "Niacinamide PC (Vitamin B3)", unit: "Kg", stock: 85.0, lot: "LOT-NC-2608-019" },
  { code: "KMS00012", name: "Botol Tube 100ml Doff White", unit: "Pcs", stock: 12500, lot: "LOT-KM-2609-002" },
  { code: "KMS00105", name: "Master Carton Box K125/M125", unit: "Pcs", stock: 350, lot: "LOT-KM-2608-012" },
];

export default function WarehouseTransfersPage() {
  const toast = useDnaToast();
  const [dataList, setDataList] = useState<WarehouseTransfer[]>(INITIAL_TRANSFERS);

  // Filters
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTransfer, setSelectedTransfer] = useState<WarehouseTransfer | null>(null);
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
    const inTransitCount = list.filter((t) => t.status === "IN_TRANSIT").length;
    const completedCount = list.filter((t) => t.status === "COMPLETED").length;
    const totalVolume = list.reduce((sum, t) => sum + t.totalQty, 0);

    return {
      totalTransfers,
      inTransitCount,
      completedCount,
      totalVolume,
    };
  }, [dataList]);

  // Filtered List
  const filteredList = useMemo(() => {
    return dataList.filter((item) => {
      const matchSearch =
        item.transferNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.referenceDoc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.fromWarehouse.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.toWarehouse.toLowerCase().includes(searchQuery.toLowerCase());

      const matchTab =
        activeTab === "ALL" ? true :
        item.status === activeTab;

      return matchSearch && matchTab;
    });
  }, [dataList, searchQuery, activeTab]);

  const handleConfirmReceive = (trfId: string) => {
    setDataList((prev) =>
      prev.map((t) =>
        t.id === trfId
          ? {
              ...t,
              status: "COMPLETED",
              receiverPic: "Petugas Gudang Penerima (Anda)",
              receivedDate: new Date().toLocaleString("id-ID"),
            }
          : t
      )
    );

    if (selectedTransfer && selectedTransfer.id === trfId) {
      setSelectedTransfer({
        ...selectedTransfer,
        status: "COMPLETED",
        receiverPic: "Petugas Gudang Penerima (Anda)",
        receivedDate: new Date().toLocaleString("id-ID"),
      });
    }

    toast.success("Barang transfer telah diverifikasi fisik dan stok gudang tujuan otomatis bertambah.");
  };

  const handleAddItemToCart = () => {
    if (!selectedMatCode) {
      toast.error("Pilih material yang ingin ditransfer.");
      return;
    }
    const item = AVAILABLE_TRANSFER_ITEMS.find((i) => i.code === selectedMatCode);
    if (!item) return;

    if (itemTransferQty <= 0 || itemTransferQty > item.stock) {
      toast.error(`Jumlah transfer tidak valid. Stok tersedia: ${item.stock} ${item.unit}`);
      return;
    }

    setCartItems((prev) => [
      ...prev,
      {
        materialCode: item.code,
        materialName: item.name,
        transferQty: itemTransferQty,
        availableStockOrigin: item.stock,
        unit: item.unit,
        batchLot: item.lot,
      },
    ]);

    setSelectedMatCode("");
    setItemTransferQty(1);
  };

  const handleCreateTransfer = () => {
    if (fromWarehouse === toWarehouse) {
      toast.error("Gudang asal dan gudang tujuan tidak boleh sama.");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Tambahkan minimal 1 item barang yang akan dipindahkan.");
      return;
    }

    const newTransfer: WarehouseTransfer = {
      id: `trf-${Date.now()}`,
      transferNumber: `TRF-WH-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(dataList.length + 1).padStart(4, "0")}`,
      transferDate: new Date().toISOString().split("T")[0],
      fromWarehouse,
      toWarehouse,
      referenceDoc: referenceDoc || "INTERNAL-REQUEST",
      totalItems: cartItems.length,
      totalQty: cartItems.reduce((acc, it) => acc + it.transferQty, 0),
      senderPic: "Petugas Pengirim (Anda)",
      status: "IN_TRANSIT",
      notes: formNotes || "Transfer stok antar gudang internal.",
      items: cartItems.map((c, idx) => ({
        id: `ti-${Date.now()}-${idx}`,
        ...c,
      })),
    };

    setDataList([newTransfer, ...dataList]);
    setIsCreateOpen(false);
    toast.success(`Surat Pemindahan Barang ${newTransfer.transferNumber} berhasil diterbitkan (IN_TRANSIT).`);

    // Reset Form
    setCartItems([]);
    setReferenceDoc("");
    setFormNotes("");
  };

  const getStatusBadge = (status: WarehouseTransfer["status"]) => {
    switch (status) {
      case "IN_TRANSIT":
        return <DnaBadge variant="info">Sedang Dikirim</DnaBadge>;
      case "COMPLETED":
        return <DnaBadge variant="success">Selesai Terima</DnaBadge>;
      case "CANCELLED":
        return <DnaBadge variant="critical">Dibatalkan</DnaBadge>;
    }
  };

  return (
    <DnaPageContainer>
      {/* Header with Top-Right Unified Tabs (Rule 2) */}
      <DnaPageHeader
        title="Transfer Antar Gudang (Inter-Warehouse Transfers)"
        description="Pemindahan persediaan material fisik antar lokasi gudang internal dengan alur serah terima 2-Step Handover."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 font-semibold">
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>2-Step Handover Verified</span>
          </div>
        }
        tabs={[
          { id: "ALL", label: "Semua Transfer", count: dataList.length },
          { id: "IN_TRANSIT", label: "Sedang Dikirim (In Transit)", count: dataList.filter((d) => d.status === "IN_TRANSIT").length },
          { id: "COMPLETED", label: "Selesai Serah Terima", count: dataList.filter((d) => d.status === "COMPLETED").length },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <div className="flex items-center gap-2">
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
          variant="info"
        />
        <DnaStatCard
          label="Sedang Dikirim"
          value={`${kpis.inTransitCount} Mutasi`}
          icon={<Clock className="w-5 h-5 text-blue-500" />}
          variant={kpis.inTransitCount > 0 ? "warning" : "default"}
        />
        <DnaStatCard
          label="Selesai Diterima"
          value={`${kpis.completedCount} Mutasi`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          variant="success"
        />
        <DnaStatCard
          label="Total Volume Berpindah"
          value={`${kpis.totalVolume.toLocaleString("id-ID")} Qty`}
          icon={<Boxes className="w-5 h-5 text-purple-600" />}
          variant="purple"
        />
      </DnaKpiGrid>

      {/* Main Table Card (Rule 1: No title prop, Rule 4: Clean responsive columns) */}
      <DnaDataTableCard
        toolbarProps={{
          searchQuery,
          onSearchChange: setSearchQuery,
          searchPlaceholder: "Cari No Transfer, Dokumen SPK, Gudang Asal/Tujuan...",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-4 py-3 h-[40px] w-[140px]">No. Transfer</th>
                <th className="px-3 py-3 h-[40px] w-[110px]">Tanggal</th>
                <th className="px-3 py-3 h-[40px]">Gudang Asal</th>
                <th className="px-3 py-3 h-[40px]">Gudang Tujuan</th>
                <th className="px-3 py-3 h-[40px] w-[140px]">Referensi Dokumen</th>
                <th className="px-3 py-3 h-[40px]">PIC Pengirim</th>
                <th className="px-3 py-3 h-[40px] text-right w-[140px]">Volume & Item</th>
                <th className="px-3 py-3 h-[40px] text-center w-[130px]">Status</th>
                <th className="px-4 py-3 h-[40px] text-right w-[70px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <ArrowRightLeft className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada data transfer antar gudang yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedTransfer(row)}
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer group h-[48px]"
                  >
                    {/* Kolom 1: No. Transfer */}
                    <td className="px-4 py-2">
                      <DnaCell.Code value={row.transferNumber} />
                    </td>

                    {/* Kolom 2: Tanggal */}
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                      {row.transferDate}
                    </td>

                    {/* Kolom 3: Gudang Asal */}
                    <td className="px-3 py-2 text-slate-800 font-medium truncate max-w-[160px]">
                      {row.fromWarehouse.split("(")[0]}
                    </td>

                    {/* Kolom 4: Gudang Tujuan */}
                    <td className="px-3 py-2 text-slate-800 font-medium truncate max-w-[160px]">
                      {row.toWarehouse.split("(")[0]}
                    </td>

                    {/* Kolom 5: Referensi Dokumen */}
                    <td className="px-3 py-2">
                      <DnaCell.Code value={row.referenceDoc} />
                    </td>

                    {/* Kolom 6: PIC Pengirim */}
                    <td className="px-3 py-2 text-slate-800 truncate max-w-[140px]">
                      {row.senderPic}
                    </td>

                    {/* Kolom 7: Volume & Item (1 Natural Pair) */}
                    <td className="px-3 py-2 text-right">
                      <DnaCell.DoubleText
                        primary={`${row.totalQty.toLocaleString("id-ID")} Unit`}
                        secondary={`${row.totalItems} macam item`}
                      />
                    </td>

                    {/* Kolom 8: Status */}
                    <td className="px-3 py-2 text-center">
                      {getStatusBadge(row.status)}
                    </td>

                    {/* Kolom 9: Aksi */}
                    <td className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTransfer(row)}
                        className="text-slate-400 hover:text-blue-600"
                      >
                        <Eye className="w-4 h-4" />
                      </DnaButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* Quick Peek Drawer (Rule 5) */}
      <DnaDetailDrawer
        isOpen={!!selectedTransfer}
        onClose={() => setSelectedTransfer(null)}
        title={selectedTransfer?.transferNumber || "Detail Transfer"}
        subtitle={`Dokumen Ref: ${selectedTransfer?.referenceDoc}`}
        badge={selectedTransfer && getStatusBadge(selectedTransfer.status)}
        footerActions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="outline"
              size="sm"
              onClick={() => toast.success(`Mencetak Bukti Transfer ${selectedTransfer?.transferNumber}...`)}
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Bukti Transfer
            </DnaButton>
            {selectedTransfer && selectedTransfer.status === "IN_TRANSIT" && (
              <DnaButton
                variant="primary"
                size="sm"
                onClick={() => handleConfirmReceive(selectedTransfer.id)}
              >
                Konfirmasi Terima Fisik
              </DnaButton>
            )}
          </div>
        }
      >
        {selectedTransfer && (
          <div className="space-y-6 text-xs">
            {/* 2-Step Handover Route Card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Jalur Serah Terima (2-Step Handover)
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Gudang Asal (Pengirim)</span>
                  <div className="font-semibold text-slate-800 mt-1">{selectedTransfer.fromWarehouse}</div>
                  <div className="text-[11px] text-slate-500 mt-1">PIC: {selectedTransfer.senderPic}</div>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Gudang Tujuan (Penerima)</span>
                  <div className="font-semibold text-blue-700 mt-1">{selectedTransfer.toWarehouse}</div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {selectedTransfer.receiverPic ? `PIC: ${selectedTransfer.receiverPic}` : "Menunggu Serah Terima"}
                  </div>
                </div>
              </div>
            </div>

            {/* Handover Status Info */}
            {selectedTransfer.status === "COMPLETED" && (
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-emerald-800 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Verifikasi Fisik Telah Selesai
                </div>
                <p className="text-emerald-700 text-[11px]">
                  Diterima oleh {selectedTransfer.receiverPic} pada {selectedTransfer.receivedDate}. Stok gudang tujuan telah bertambah otomatis.
                </p>
              </div>
            )}

            {/* Transfer Items Table */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Daftar Barang yang Dipindahkan
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <DnaTable className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Nama Material</th>
                      <th className="py-2.5 px-3 text-right">Qty Transfer</th>
                      <th className="py-2.5 px-3">No. Batch/Lot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {selectedTransfer.items.map((it) => (
                      <tr key={it.id}>
                        <td className="py-2.5 px-3 font-sans">
                          <div className="font-semibold text-slate-800">{it.materialName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{it.materialCode}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          {it.transferQty.toLocaleString("id-ID")} {it.unit}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{it.batchLot}</td>
                      </tr>
                    ))}
                  </tbody>
                </DnaTable>
              </div>
            </div>

            {selectedTransfer.notes && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="font-semibold block text-slate-700 mb-1">Catatan Dokumen:</span>
                <p className="text-slate-600 leading-relaxed">{selectedTransfer.notes}</p>
              </div>
            )}
          </div>
        )}
      </DnaDetailDrawer>

      {/* Modal Buat Transfer Baru */}
      <DnaModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Buat Surat Pemindahan Barang Antar Gudang"
        description="Penerbitan surat transfer material fisik antar lokasi gudang internal dengan sistem 2-Step Handover."
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
              Terbitkan Dokumen Transfer
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
                className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
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
                className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
              >
                {MASTER_WAREHOUSES.map((wh) => (
                  <option key={wh} value={wh}>{wh}</option>
                ))}
              </DnaSelect>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Nomor Dokumen Referensi</label>
            <DnaInput
              type="text"
              placeholder="Contoh: SPK-2026-09-009 / REQ-PROD-01"
              value={referenceDoc}
              onChange={(e) => setReferenceDoc(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono"
            />
          </div>

          {/* Item Selector */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
              Pilih Material yang Akan Dipindahkan
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <DnaSelect
                  aria-label="Pilih Material"
                  value={selectedMatCode}
                  onChange={setSelectedMatCode}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                >
                  <option value="">-- Pilih Barang dari Gudang Asal --</option>
                  {AVAILABLE_TRANSFER_ITEMS.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.code} - {item.name} (Stok: {item.stock} {item.unit})
                    </option>
                  ))}
                </DnaSelect>
              </div>
              <div className="flex gap-2">
                <DnaInput
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={itemTransferQty}
                  onChange={(e) => setItemTransferQty(parseFloat(e.target.value) || 0)}
                  className="w-20 text-xs border border-slate-300 rounded-lg p-2 font-mono"
                />
                <DnaButton variant="secondary" size="sm" onClick={handleAddItemToCart}>
                  + Tambah
                </DnaButton>
              </div>
            </div>

            {/* Cart Items List */}
            {cartItems.length > 0 && (
              <div className="border border-slate-200 rounded-lg bg-white overflow-hidden mt-2">
                <DnaTable className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2 px-3">Item</th>
                      <th className="py-2 px-3 text-right">Qty</th>
                      <th className="py-2 px-3">Lot</th>
                      <th className="py-2 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cartItems.map((c, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3">{c.materialName}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold">{c.transferQty} {c.unit}</td>
                        <td className="py-2 px-3 font-mono text-slate-500">{c.batchLot}</td>
                        <td className="py-2 px-3 text-right">
                          <DnaButton
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setCartItems(cartItems.filter((_, i) => i !== idx))}
                            className="text-red-500 hover:text-red-700 h-7 w-7 p-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </DnaButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </DnaTable>
              </div>
            )}
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Catatan Tambahan</label>
            <DnaTextarea
              rows={2}
              placeholder="Instruksi khusus transfer / kondisi kemasan..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2"
            />
          </div>
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}
