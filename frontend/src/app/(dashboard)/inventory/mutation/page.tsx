"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  ArrowRightLeft,
  Search,
  Plus,
  Eye,
  Printer,
  XCircle,
  Warehouse,
  Calendar,
  UserCheck,
  CheckCircle2,
  Clock,
  Send,
  Boxes,
  Trash2,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaInput,
  DnaModal,
  DnaCell,
  DnaBadge,
  useDnaToast,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";

interface TransferItem {
  id: string;
  code: string;
  date: string;
  sourceWarehouse: string;
  destWarehouse: string;
  creator: string;
  vehicleNo: string;
  status: "COMPLETED" | "PENDING" | "CANCELLED";
  notes?: string;
  items: {
    materialId?: string;
    name: string;
    unit: string;
    qty: number;
    notes?: string;
  }[];
}

export default function InventoryMutationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Memuat Mutasi Antar Gudang...</div>}>
      <InventoryMutationContent />
    </Suspense>
  );
}

function InventoryMutationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const actionParam = searchParams.get("action");
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedTransfer, setSelectedTransfer] = useState<TransferItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Queries
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

  const { data: warehouseList = [] } = useQuery({
    queryKey: ["warehouse-warehouses"],
    queryFn: async () => {
      try {
        const res = await api.get("/warehouse/warehouses");
        return (unwrapResponse(res.data) as any[]) || [];
      } catch {
        return [];
      }
    },
  });

  const { data: catalogMaterials = [] } = useQuery({
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

  const transfers: TransferItem[] = useMemo(() => {
    if (!rawTransfers || !Array.isArray(rawTransfers)) return [];
    return rawTransfers.map((t: any) => ({
      id: t.id,
      code: t.transferNumber || `TRF-${t.id.slice(0, 8).toUpperCase()}`,
      date: t.date ? new Date(t.date).toISOString().split("T")[0] : "-",
      sourceWarehouse: t.sourceWarehouse?.name || "Gudang Asal",
      destWarehouse: t.destWarehouse?.name || "Gudang Tujuan",
      creator: t.createdById || "Admin Gudang",
      vehicleNo: "Internal Transfer",
      status: (t.status || "PENDING") as "COMPLETED" | "PENDING" | "CANCELLED",
      notes: t.notes || "-",
      items: (t.items || []).map((it: any) => ({
        materialId: it.materialId,
        name: it.material?.name || "Material",
        unit: it.material?.unit || "Unit",
        qty: Number(it.qty || 0),
        notes: it.notes || "-",
      })),
    }));
  }, [rawTransfers]);

  // Form State
  const [formData, setFormData] = useState<{
    sourceWarehouseId: string;
    destWarehouseId: string;
    date: string;
    vehicleNo: string;
    notes: string;
    cartItems: {
      materialId: string;
      name: string;
      unit: string;
      qtyStock: number;
      qtyTransfer: number;
      notes: string;
    }[];
  }>({
    sourceWarehouseId: "",
    destWarehouseId: "",
    date: new Date().toISOString().split("T")[0],
    vehicleNo: "",
    notes: "",
    cartItems: [],
  });

  const [newItem, setNewItem] = useState<{
    materialId: string;
    name: string;
    unit: string;
    qtyStock: number;
    qtyTransfer: number;
    notes: string;
  }>({
    materialId: "",
    name: "",
    unit: "Kg",
    qtyStock: 0,
    qtyTransfer: 1,
    notes: "",
  });

  useEffect(() => {
    if (warehouseList.length > 0) {
      setFormData((prev) => ({
        ...prev,
        sourceWarehouseId: prev.sourceWarehouseId || warehouseList[0]?.id || "",
        destWarehouseId: prev.destWarehouseId || (warehouseList[1]?.id || warehouseList[0]?.id || ""),
      }));
    }
  }, [warehouseList]);

  useEffect(() => {
    if (actionParam === "create") {
      setIsCreateOpen(true);
    }
  }, [actionParam]);

  const filteredData = useMemo(() => {
    return transfers.filter((item) => {
      const matchSearch =
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sourceWarehouse.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.destWarehouse.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.creator.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "ALL" || item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [transfers, searchTerm, statusFilter]);

  const totalCompleted = useMemo(() => transfers.filter((t) => t.status === "COMPLETED").length, [transfers]);
  const totalPending = useMemo(() => transfers.filter((t) => t.status === "PENDING").length, [transfers]);

  const handleAddItem = () => {
    if (!newItem.materialId || newItem.qtyTransfer <= 0) {
      toast.warning("Pilih barang dan masukkan jumlah transfer yang valid");
      return;
    }
    setFormData({
      ...formData,
      cartItems: [...formData.cartItems, { ...newItem }],
    });
    setNewItem({
      materialId: "",
      name: "",
      unit: "Kg",
      qtyStock: 0,
      qtyTransfer: 1,
      notes: "",
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      cartItems: formData.cartItems.filter((_, i) => i !== index),
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.sourceWarehouseId === formData.destWarehouseId) {
      toast.error("Gudang asal dan tujuan tidak boleh sama");
      return;
    }
    if (formData.cartItems.length === 0) {
      toast.warning("Tambahkan minimal satu item transfer");
      return;
    }

    try {
      await api.post("/warehouse/transfers", {
        sourceWarehouseId: formData.sourceWarehouseId,
        destWarehouseId: formData.destWarehouseId,
        notes: `${formData.vehicleNo ? `[Kendaraan: ${formData.vehicleNo}] ` : ""}${formData.notes || ""}`.trim() || undefined,
        items: formData.cartItems.map((it) => ({
          materialId: it.materialId,
          qty: it.qtyTransfer,
        })),
      });

      toast.success("Surat Mutasi Transfer berhasil dibuat.");
      queryClient.invalidateQueries({ queryKey: ["warehouse-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["warehouse-transactions"] });
      setIsCreateOpen(false);
      setFormData({
        sourceWarehouseId: warehouseList[0]?.id || "",
        destWarehouseId: warehouseList[1]?.id || warehouseList[0]?.id || "",
        date: new Date().toISOString().split("T")[0],
        vehicleNo: "",
        notes: "",
        cartItems: [],
      });
      if (actionParam === "create") {
        router.push("/goods-transfer");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal membuat transfer barang");
    }
  };

  const handleExecuteTransfer = async (id: string) => {
    try {
      await api.post(`/warehouse/transfers/${id}/execute`, {});
      toast.success("Transfer barang berhasil dieksekusi dan stok telah dipindahkan.");
      queryClient.invalidateQueries({ queryKey: ["warehouse-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["warehouse-transactions"] });
      setSelectedTransfer(null);
      setIsDetailOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal mengeksekusi transfer barang");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <DnaBadge variant="success">Selesai</DnaBadge>;
      case "PENDING":
        return <DnaBadge variant="warning">Dalam Proses</DnaBadge>;
      case "CANCELLED":
        return <DnaBadge variant="critical">Dibatalkan</DnaBadge>;
      default:
        return <DnaBadge variant="default">{status}</DnaBadge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <DnaPageHeader
        title="Transfer & Mutasi Barang Antar Gudang"
        description="Pencatatan pergerakan fisik persediaan material, kemasan, dan produk jadi antar multi-lokasi gudang"
        actions={
          <DnaButton
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setIsCreateOpen(true);
              router.push("/goods-transfer/create");
            }}
          >
            + Buat Transfer Barang
          </DnaButton>
        }
      />

      {/* KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          title="Total Dokumen Transfer"
          value={transfers.length.toString()}
          icon={ArrowRightLeft}
          variant="default"
          subtext="Akumulasi surat jalan mutasi"
        />
        <DnaStatCard
          title="Mutasi Selesai (In-Place)"
          value={totalCompleted.toString()}
          icon={CheckCircle2}
          variant="success"
          subtext="Fisik sudah masuk stok tujuan"
        />
        <DnaStatCard
          title="Dalam Proses / Transit"
          value={totalPending.toString()}
          icon={Clock}
          variant="warning"
          subtext="Menunggu verifikasi penerimaan"
        />
        <DnaStatCard
          title="Gudang Terintegrasi"
          value="5 Lokasi"
          icon={Warehouse}
          variant="info"
          subtext="Bahan Baku, Kemasan, Jadi, dsb"
        />
      </DnaKpiGrid>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode transfer, gudang asal, tujuan, pembuat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Semua Status</option>
            <option value="COMPLETED">Selesai</option>
            <option value="PENDING">Dalam Proses</option>
            <option value="CANCELLED">Dibatalkan</option>
          </select>
        </div>
      </div>

      {/* 1:1 Table (Exactly 8 columns matching legacy G-SERP) */}
      <DnaDataTableCard title="Daftar Mutasi Antar Gudang">
        <div className="overflow-x-auto">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow>
                <DnaTh className="py-3 px-4 w-12 text-center">#</DnaTh>
                <DnaTh className="py-3 px-4">Kode Transfer</DnaTh>
                <DnaTh className="py-3 px-4">Tanggal</DnaTh>
                <DnaTh className="py-3 px-4">Gudang Asal</DnaTh>
                <DnaTh className="py-3 px-4">Gudang Tujuan</DnaTh>
                <DnaTh className="py-3 px-4">Pembuat</DnaTh>
                <DnaTh className="py-3 px-4 text-center">Status</DnaTh>
                <DnaTh className="py-3 px-4 text-center">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {filteredData.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={8} className="py-8 text-center text-slate-400">
                    Tidak ada transaksi mutasi barang ditemukan
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredData.map((item, idx) => (
                  <DnaTableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <DnaTd className="py-3 px-4 text-center font-medium text-slate-400">{idx + 1}</DnaTd>
                    <DnaTd className="py-3 px-4 font-semibold text-blue-600">{item.code}</DnaTd>
                    <DnaTd className="py-3 px-4 text-slate-600">{item.date}</DnaTd>
                    <DnaTd className="py-3 px-4 font-medium text-slate-800">{item.sourceWarehouse}</DnaTd>
                    <DnaTd className="py-3 px-4 font-medium text-blue-600">{item.destWarehouse}</DnaTd>
                    <DnaTd className="py-3 px-4 text-slate-600">{item.creator}</DnaTd>
                    <DnaTd className="py-3 px-4 text-center">{getStatusBadge(item.status)}</DnaTd>
                    <DnaTd className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          icon={<Eye className="h-3.5 w-3.5 text-blue-600" />}
                          onClick={() => {
                            setSelectedTransfer(item);
                            setIsDetailOpen(true);
                          }}
                        >
                          Lihat
                        </DnaButton>
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          icon={<Printer className="h-3.5 w-3.5 text-slate-600" />}
                          onClick={() => {
                            toast({
                              title: "Mencetak Form Mutasi",
                              description: `Mengunduh PDF Bukti Transfer ${item.code}`,
                              variant: "info"
                            });
                          }}
                        >
                          Print
                        </DnaButton>
                      </div>
                    </DnaTd>
                  </DnaTableRow>
                ))
              )}
            </DnaTableBody>
          </DnaTable>
        </div>
      </DnaDataTableCard>

      {/* Modal Detail (1:1 Legacy G-SERP Modal Detail) */}
      <DnaModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Detail Mutasi Barang: ${selectedTransfer?.code || ""}`}
        size="lg"
      >
        {selectedTransfer && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Kode Transfer</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedTransfer.code}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Tanggal Transfer</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedTransfer.date}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Status</p>
                <div className="mt-0.5">{getStatusBadge(selectedTransfer.status)}</div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Gudang Asal</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedTransfer.sourceWarehouse}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Gudang Tujuan</p>
                <p className="text-xs font-bold text-blue-600 mt-0.5">{selectedTransfer.destWarehouse}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Pembuat / Operator</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedTransfer.creator}</p>
              </div>
            </div>

            {/* Sub-table Detail Item */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
                Rincian Barang Ditransfer
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <DnaTable>
                  <DnaTableHead>
                    <DnaTableRow>
                      <DnaTh className="py-2.5 px-3 w-10 text-center">#</DnaTh>
                      <DnaTh className="py-2.5 px-3">Nama Barang</DnaTh>
                      <DnaTh className="py-2.5 px-3 text-center">Satuan</DnaTh>
                      <DnaTh className="py-2.5 px-3 text-right">Qty Transfer</DnaTh>
                      <DnaTh className="py-2.5 px-3">Catatan Khusus</DnaTh>
                    </DnaTableRow>
                  </DnaTableHead>
                  <DnaTableBody>
                    {selectedTransfer.items.map((it, idx) => (
                      <DnaTableRow key={idx}>
                        <DnaTd className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</DnaTd>
                        <DnaTd className="py-2.5 px-3 font-medium text-slate-800">{it.name}</DnaTd>
                        <DnaTd className="py-2.5 px-3 text-center text-slate-600">{it.unit}</DnaTd>
                        <DnaTd className="py-2.5 px-3 text-right font-bold text-blue-600">
                          {it.qty.toLocaleString("id-ID")}
                        </DnaTd>
                        <DnaTd className="py-2.5 px-3 text-slate-500">{it.notes || "-"}</DnaTd>
                      </DnaTableRow>
                    ))}
                  </DnaTableBody>
                </DnaTable>
              </div>
            </div>

            {selectedTransfer.notes && (
              <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100 text-xs text-blue-900">
                <span className="font-bold">Catatan Mutasi:</span> {selectedTransfer.notes}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <DnaButton variant="secondary" onClick={() => setIsDetailOpen(false)}>
                Tutup
              </DnaButton>
              {selectedTransfer.status === "PENDING" && (
                <DnaButton
                  variant="primary"
                  onClick={() => handleExecuteTransfer(selectedTransfer.id)}
                >
                  Eksekusi Mutasi (Keluarkan & Terima)
                </DnaButton>
              )}
            </div>
          </div>
        )}
      </DnaModal>

      {/* Modal Form Buat Transfer (/goods-transfer/create) */}
      <DnaModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          if (actionParam === "create") {
            router.push("/goods-transfer");
          }
        }}
        title="Buat Mutasi & Transfer Antar Gudang"
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gudang Asal *
              </label>
              <select
                value={formData.sourceWarehouseId}
                onChange={(e) => setFormData({ ...formData, sourceWarehouseId: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-medium"
              >
                {warehouseList.map((wh: any) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} {wh.code ? `(${wh.code})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gudang Tujuan *
              </label>
              <select
                value={formData.destWarehouseId}
                onChange={(e) => setFormData({ ...formData, destWarehouseId: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-medium"
              >
                {warehouseList.map((wh: any) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} {wh.code ? `(${wh.code})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Transfer *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                No. Polisi Kendaraan / Alat Angkut (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: B 9284 KIL"
                value={formData.vehicleNo}
                onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white"
              />
            </div>
          </div>

          {/* Sub-form Tambah Item */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Tambah Barang ke Keranjang Mutasi
            </h5>
            <div className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-5">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Barang *</label>
                <select
                  value={newItem.materialId}
                  onChange={(e) => {
                    const selectedMat = catalogMaterials.find((m: any) => m.id === e.target.value);
                    const stockVal = Number(selectedMat?.stock || selectedMat?.currentStock || 0);
                    setNewItem({
                      ...newItem,
                      materialId: e.target.value,
                      name: selectedMat?.name || e.target.value,
                      unit: selectedMat?.unit || "Kg",
                      qtyStock: stockVal,
                    });
                  }}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
                >
                  <option value="">-- Pilih Barang --</option>
                  {catalogMaterials.map((mat: any) => (
                    <option key={mat.id} value={mat.id}>
                      {mat.name} ({mat.unit || "Unit"})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-3">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Qty Transfer *</label>
                <input
                  type="number"
                  min="1"
                  value={newItem.qtyTransfer}
                  onChange={(e) => setNewItem({ ...newItem, qtyTransfer: Number(e.target.value) })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white text-right font-bold"
                />
              </div>
              <div className="col-span-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Catatan lot / kemasan"
                  value={newItem.notes}
                  onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
                />
                <DnaButton type="button" variant="primary" size="sm" onClick={handleAddItem}>
                  + Tambah
                </DnaButton>
              </div>
            </div>
          </div>

          {/* Tabel Keranjang Item */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow>
                  <DnaTh className="py-2.5 px-3 w-10 text-center">#</DnaTh>
                  <DnaTh className="py-2.5 px-3">Barang</DnaTh>
                  <DnaTh className="py-2.5 px-3 text-center">Satuan</DnaTh>
                  <DnaTh className="py-2.5 px-3 text-right">Qty Mutasi</DnaTh>
                  <DnaTh className="py-2.5 px-3">Catatan</DnaTh>
                  <DnaTh className="py-2.5 px-3 text-center w-12">Hapus</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {formData.cartItems.map((it, idx) => (
                  <DnaTableRow key={idx}>
                    <DnaTd className="py-2 px-3 text-center text-slate-400">{idx + 1}</DnaTd>
                    <DnaTd className="py-2 px-3 font-medium text-slate-800">{it.name}</DnaTd>
                    <DnaTd className="py-2 px-3 text-center text-slate-600">{it.unit}</DnaTd>
                    <DnaTd className="py-2 px-3 text-right font-bold text-blue-600">{it.qtyTransfer.toLocaleString()}</DnaTd>
                    <DnaTd className="py-2 px-3 text-slate-500">{it.notes || "-"}</DnaTd>
                    <DnaTd className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </DnaTd>
                  </DnaTableRow>
                ))}
              </DnaTableBody>
            </DnaTable>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Transfer Antar Gudang
            </label>
            <textarea
              rows={2}
              placeholder="Instruksi handling, keperluan produksi, dsb..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <DnaButton
              type="button"
              variant="secondary"
              onClick={() => {
                setIsCreateOpen(false);
                if (actionParam === "create") {
                  router.push("/goods-transfer");
                }
              }}
            >
              Batal
            </DnaButton>
            <DnaButton type="submit" variant="primary">
              Simpan & Mutasikan Stok
            </DnaButton>
          </div>
        </form>
      </DnaModal>
    </div>
  );
}
