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
  useDnaToast,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaCell,
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

export default function WarehouseTransfersPage() {
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const { data: rawTransfers = [], isLoading } = useQuery({
    queryKey: ["warehouse-transfers"],
    queryFn: async () => {
      try {
        const res = await api.get("/warehouse/transfers");
        return (unwrapResponse(res.data) as any[]) || [];
      } catch {
        return [];
      }
    },
  });

  const { data: rawWarehouses = [] } = useQuery({
    queryKey: ["master-warehouses"],
    queryFn: async () => {
      try {
        const res = await api.get("/master/warehouses");
        return (unwrapResponse(res.data) as any[]) || [];
      } catch {
        return [];
      }
    },
  });

  const { data: rawCatalog = [] } = useQuery({
    queryKey: ["warehouse-catalog"],
    queryFn: async () => {
      try {
        const res = await api.get("/warehouse/catalog");
        return (unwrapResponse(res.data) as any[]) || [];
      } catch {
        return [];
      }
    },
  });

  const warehouseOptions = useMemo(() => {
    if (rawWarehouses.length > 0) {
      return rawWarehouses.map((w: any) => w.name || w.code);
    }
    return [
      "Gudang Bahan Baku Utama (WH-01)",
      "Gudang Kemas & Box (WH-02)",
      "Gudang Produk Jadi (WH-03)",
      "Gudang Karantina & QC (WH-04)",
      "Gudang Retur & Reject (WH-05)",
    ];
  }, [rawWarehouses]);

  const availableItems = useMemo(() => {
    if (rawCatalog.length > 0) {
      return rawCatalog.map((c: any) => ({
        code: c.code || "MAT-01",
        name: c.name || "Material",
        unit: c.unit || "Kg",
        stock: Number(c.stockQty || c.currentStock || 0),
        lot: c.batchNumber || "-",
      }));
    }
    return [];
  }, [rawCatalog]);

  const dataList: WarehouseTransfer[] = useMemo(() => {
    if (!rawTransfers || !Array.isArray(rawTransfers)) return [];
    return rawTransfers.map((t: any) => ({
      id: t.id,
      transferNumber: t.transferNumber || `TRF-${t.id.slice(0, 8).toUpperCase()}`,
      transferDate: t.createdAt ? new Date(t.createdAt).toISOString().split("T")[0] : "-",
      fromWarehouse: t.fromWarehouse?.name || t.sourceWarehouse?.name || "Gudang Asal",
      toWarehouse: t.toWarehouse?.name || t.destWarehouse?.name || "Gudang Tujuan",
      referenceDoc: t.referenceNo || t.referenceDoc || "-",
      totalItems: t.items?.length || 0,
      totalQty: (t.items || []).reduce((sum: number, it: any) => sum + Number(it.quantity || it.transferQty || 0), 0),
      senderPic: t.senderPic || t.createdBy?.fullName || "Petugas Gudang",
      receiverPic: t.receiverPic,
      receivedDate: t.executedAt ? new Date(t.executedAt).toLocaleString("id-ID") : undefined,
      status: (t.status === "COMPLETED" ? "COMPLETED" : t.status === "CANCELLED" ? "CANCELLED" : "IN_TRANSIT") as any,
      notes: t.notes || "-",
      items: (t.items || []).map((it: any, idx: number) => ({
        id: it.id || `ti-${idx}`,
        materialCode: it.material?.code || "MAT-01",
        materialName: it.material?.name || "Material",
        transferQty: Number(it.quantity || it.transferQty || 0),
        availableStockOrigin: Number(it.availableStock || 0),
        unit: it.material?.unit || "Kg",
        batchLot: it.batchNumber || "-",
      })),
    }));
  }, [rawTransfers]);

  // Filters
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTransfer, setSelectedTransfer] = useState<WarehouseTransfer | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Create Form State
  const [fromWarehouse, setFromWarehouse] = useState(warehouseOptions[0] || "WH-01");
  const [toWarehouse, setToWarehouse] = useState(warehouseOptions[1] || "WH-02");
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

  const handleConfirmReceive = async (trfId: string) => {
    try {
      await api.post(`/warehouse/transfers/${trfId}/execute`, { userId: "system" });
      queryClient.invalidateQueries({ queryKey: ["warehouse-transfers"] });
      toast.success("Barang transfer telah diverifikasi fisik dan stok gudang tujuan otomatis bertambah.");
      if (selectedTransfer && selectedTransfer.id === trfId) {
        setSelectedTransfer({
          ...selectedTransfer,
          status: "COMPLETED",
          receiverPic: "Petugas Gudang Penerima (Anda)",
          receivedDate: new Date().toLocaleString("id-ID"),
        });
      }
    } catch (err: any) {
      toast.error("Gagal Eksekusi Transfer", err?.response?.data?.message || err.message);
    }
  };

  const handleAddItemToCart = () => {
    if (!selectedMatCode) {
      toast.error("Pilih material yang ingin ditransfer.");
      return;
    }
    const item = availableItems.find((i) => i.code === selectedMatCode);
    if (!item) return;

    if (itemTransferQty <= 0) {
      toast.error("Jumlah transfer harus lebih dari 0.");
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

  const handleCreateTransfer = async () => {
    if (fromWarehouse === toWarehouse) {
      toast.error("Gudang asal dan gudang tujuan tidak boleh sama.");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Tambahkan minimal 1 item barang yang akan dipindahkan.");
      return;
    }

    try {
      const fromWhObj = (rawWarehouses as any[]).find((w: any) => w.name === fromWarehouse || w.id === fromWarehouse);
      const toWhObj = (rawWarehouses as any[]).find((w: any) => w.name === toWarehouse || w.id === toWarehouse);

      await api.post("/warehouse/transfers", {
        fromWarehouseId: fromWhObj?.id || (rawWarehouses as any[])[0]?.id,
        toWarehouseId: toWhObj?.id || (rawWarehouses as any[])[1]?.id,
        notes: formNotes || "Transfer stok antar gudang internal.",
        referenceNo: referenceDoc || undefined,
        items: cartItems.map((it) => {
          const catMat = (rawCatalog as any[]).find((m: any) => m.code === it.materialCode || m.name === it.materialName);
          return {
            materialId: catMat?.id || it.materialCode,
            quantity: it.transferQty,
            batchNumber: it.batchLot || undefined,
          };
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["warehouse-transfers"] });
      setIsCreateOpen(false);
      setCartItems([]);
      setReferenceDoc("");
      setFormNotes("");
      toast.success("Dokumen transfer gudang diterbitkan dan status IN_TRANSIT.");
    } catch (err: any) {
      toast.error("Gagal Menerbitkan Transfer", err?.response?.data?.message || err.message);
    }
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
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                <DnaTh className="px-4 py-3 h-[40px] w-[140px]">No. Transfer</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] w-[110px]">Tanggal</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px]">Gudang Asal</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px]">Gudang Tujuan</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] w-[140px]">Referensi Dokumen</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px]">PIC Pengirim</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] text-right w-[140px]">Volume & Item</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] text-center w-[130px]">Status</DnaTh>
                <DnaTh className="px-4 py-3 h-[40px] text-right w-[70px]">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {filteredList.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={9} className="py-12 text-center text-slate-400">
                    <ArrowRightLeft className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada data transfer antar gudang yang sesuai filter.
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredList.map((row) => (
                  <DnaTableRow
                    key={row.id}
                    onClick={() => setSelectedTransfer(row)}
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer group h-[48px]"
                  >
                    {/* Kolom 1: No. Transfer */}
                    <DnaTd className="px-4 py-2">
                      <DnaCell.Code value={row.transferNumber} />
                    </DnaTd>

                    {/* Kolom 2: Tanggal */}
                    <DnaTd className="px-3 py-2 text-slate-600 whitespace-nowrap">
                      {row.transferDate}
                    </DnaTd>

                    {/* Kolom 3: Gudang Asal */}
                    <DnaTd className="px-3 py-2 text-slate-800 font-medium truncate max-w-[160px]">
                      {row.fromWarehouse.split("(")[0]}
                    </DnaTd>

                    {/* Kolom 4: Gudang Tujuan */}
                    <DnaTd className="px-3 py-2 text-slate-800 font-medium truncate max-w-[160px]">
                      {row.toWarehouse.split("(")[0]}
                    </DnaTd>

                    {/* Kolom 5: Referensi Dokumen */}
                    <DnaTd className="px-3 py-2">
                      <DnaCell.Code value={row.referenceDoc} />
                    </DnaTd>

                    {/* Kolom 6: PIC Pengirim */}
                    <DnaTd className="px-3 py-2 text-slate-800 truncate max-w-[140px]">
                      {row.senderPic}
                    </DnaTd>

                    {/* Kolom 7: Volume & Item (1 Natural Pair) */}
                    <DnaTd className="px-3 py-2 text-right">
                      <DnaCell.DoubleText
                        primary={`${row.totalQty.toLocaleString("id-ID")} Unit`}
                        secondary={`${row.totalItems} macam item`}
                      />
                    </DnaTd>

                    {/* Kolom 8: Status */}
                    <DnaTd className="px-3 py-2 text-center">
                      {getStatusBadge(row.status)}
                    </DnaTd>

                    {/* Kolom 9: Aksi */}
                    <DnaTd className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTransfer(row)}
                        className="text-slate-400 hover:text-blue-600"
                      >
                        <Eye className="w-4 h-4" />
                      </DnaButton>
                    </DnaTd>
                  </DnaTableRow>
                ))
              )}
            </DnaTableBody>
          </DnaTable>
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
                  <DnaTableHead>
                    <DnaTableRow>
                      <DnaTh className="py-2.5 px-3">Nama Material</DnaTh>
                      <DnaTh className="py-2.5 px-3 text-right">Qty Transfer</DnaTh>
                      <DnaTh className="py-2.5 px-3">No. Batch/Lot</DnaTh>
                    </DnaTableRow>
                  </DnaTableHead>
                  <DnaTableBody>
                    {selectedTransfer.items.map((it) => (
                      <DnaTableRow key={it.id}>
                        <DnaTd className="py-2.5 px-3 font-sans">
                          <div className="font-semibold text-slate-800">{it.materialName}</div>
                          <div className="text-[10px] text-slate-400 tabular-nums">{it.materialCode}</div>
                        </DnaTd>
                        <DnaTd className="py-2.5 px-3 text-right font-bold text-slate-900">
                          {it.transferQty.toLocaleString("id-ID")} {it.unit}
                        </DnaTd>
                        <DnaTd className="py-2.5 px-3 text-slate-600">{it.batchLot}</DnaTd>
                      </DnaTableRow>
                    ))}
                  </DnaTableBody>
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
                {warehouseOptions.map((wh: string) => (
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
                {warehouseOptions.map((wh: string) => (
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
              className="w-full text-xs border border-slate-300 rounded-lg p-2 tabular-nums"
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
                  {availableItems.map((item) => (
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
                  className="w-20 text-xs border border-slate-300 rounded-lg p-2 tabular-nums"
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
                  <DnaTableHead>
                    <DnaTableRow>
                      <DnaTh className="py-2 px-3">Item</DnaTh>
                      <DnaTh className="py-2 px-3 text-right">Qty</DnaTh>
                      <DnaTh className="py-2 px-3">Lot</DnaTh>
                      <DnaTh className="py-2 px-3 text-right">Aksi</DnaTh>
                    </DnaTableRow>
                  </DnaTableHead>
                  <DnaTableBody>
                    {cartItems.map((c, idx) => (
                      <DnaTableRow key={idx}>
                        <DnaTd className="py-2 px-3">{c.materialName}</DnaTd>
                        <DnaTd className="py-2 px-3 text-right tabular-nums font-bold">{c.transferQty} {c.unit}</DnaTd>
                        <DnaTd className="py-2 px-3 tabular-nums text-slate-500">{c.batchLot}</DnaTd>
                        <DnaTd className="py-2 px-3 text-right">
                          <DnaButton
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setCartItems(cartItems.filter((_, i) => i !== idx))}
                            className="text-red-500 hover:text-red-700 h-7 w-7 p-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </DnaButton>
                        </DnaTd>
                      </DnaTableRow>
                    ))}
                  </DnaTableBody>
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
