"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
    name: string;
    unit: string;
    qty: number;
    notes?: string;
  }[];
}

const INITIAL_TRANSFERS: TransferItem[] = [
  {
    id: "TRF-001",
    code: "TRF-2026-0001",
    date: "2026-09-02",
    sourceWarehouse: "Gudang Bahan Baku",
    destWarehouse: "Gudang Kemasan",
    creator: "Super Admin",
    vehicleNo: "B 9284 KIL",
    status: "COMPLETED",
    notes: "Mutasi bahan baku untuk batch mixing awal pekan",
    items: [
      { name: "Hairdensyl Complex", unit: "gr", qty: 50, notes: "Lot HC-0921" },
      { name: "IPM", unit: "gr", qty: 25, notes: "Lot IPM-882" }
    ]
  },
  {
    id: "TRF-002",
    code: "TRF-2026-0002",
    date: "2026-09-05",
    sourceWarehouse: "Gudang Bahan Baku",
    destWarehouse: "Gudang Barang Jadi",
    creator: "Super Admin",
    vehicleNo: "B 1042 SER",
    status: "PENDING",
    notes: "Transfer sampel uji stabilitas ke gudang lab",
    items: [
      { name: "Niacinamide", unit: "gr", qty: 10, notes: "Sampel uji mikroba" }
    ]
  },
  {
    id: "TRF-003",
    code: "TRF-2026-0003",
    date: "2026-09-08",
    sourceWarehouse: "Gudang Kemasan",
    destWarehouse: "Gudang Barang Jadi",
    creator: "Logistics Officer",
    vehicleNo: "L 8831 UY",
    status: "COMPLETED",
    notes: "Mutasi kemasan primer botol 100ml ke lini packaging",
    items: [
      { name: "Secret Water", unit: "gr", qty: 2500, notes: "Solvent pelarut" }
    ]
  },
  {
    id: "TRF-004",
    code: "TRF-2026-0004",
    date: "2026-09-12",
    sourceWarehouse: "Gudang Bahan Baku",
    destWarehouse: "Gudang Kemasan",
    creator: "Super Admin",
    vehicleNo: "B 7721 PK",
    status: "PENDING",
    notes: "Buffer stock bahan aktif niacinamide pabrik utama",
    items: [
      { name: "Hairdensyl Complex", unit: "gr", qty: 100, notes: "Stock pengaman" }
    ]
  }
];

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
  const { toast } = useDnaToast();

  const [transfers, setTransfers] = useState<TransferItem[]>(INITIAL_TRANSFERS);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedTransfer, setSelectedTransfer] = useState<TransferItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: `TRF-2026-${String(transfers.length + 1).padStart(4, "0")}`,
    date: new Date().toISOString().split("T")[0],
    sourceWarehouse: "Gudang Bahan Baku",
    destWarehouse: "Gudang Kemasan",
    vehicleNo: "",
    notes: "",
    cartItems: [
      { name: "Hairdensyl Complex", unit: "gr", qtyStock: 500, qtyTransfer: 50, notes: "Permintaan lini 1" }
    ]
  });

  const [newItem, setNewItem] = useState({
    name: "Niacinamide",
    unit: "gr",
    qtyStock: 250,
    qtyTransfer: 25,
    notes: ""
  });

  useEffect(() => {
    if (actionParam === "create") {
      setIsCreateOpen(true);
    }
  }, [actionParam]);

  const filteredData = useMemo(() => {
    return transfers.filter(item => {
      const matchSearch =
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sourceWarehouse.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.destWarehouse.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.creator.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "ALL" || item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [transfers, searchTerm, statusFilter]);

  const totalCompleted = transfers.filter(t => t.status === "COMPLETED").length;
  const totalPending = transfers.filter(t => t.status === "PENDING").length;

  const handleAddItem = () => {
    if (!newItem.name || newItem.qtyTransfer <= 0) {
      toast({ title: "Validasi Gagal", description: "Pilih barang dan jumlah transfer valid", variant: "warning" });
      return;
    }
    setFormData({
      ...formData,
      cartItems: [...formData.cartItems, { ...newItem }]
    });
    setNewItem({ name: "IPM", unit: "gr", qtyStock: 300, qtyTransfer: 10, notes: "" });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      cartItems: formData.cartItems.filter((_, i) => i !== index)
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.sourceWarehouse === formData.destWarehouse) {
      toast({ title: "Gudang Sama", description: "Gudang asal dan tujuan tidak boleh sama", variant: "danger" });
      return;
    }
    if (formData.cartItems.length === 0) {
      toast({ title: "Keranjang Kosong", description: "Tambahkan minimal satu item transfer", variant: "warning" });
      return;
    }

    const newTransfer: TransferItem = {
      id: `TRF-${Date.now()}`,
      code: formData.code,
      date: formData.date,
      sourceWarehouse: formData.sourceWarehouse,
      destWarehouse: formData.destWarehouse,
      creator: "Super Admin",
      vehicleNo: formData.vehicleNo || "Internal Trolley",
      status: "COMPLETED",
      notes: formData.notes,
      items: formData.cartItems.map(it => ({
        name: it.name,
        unit: it.unit,
        qty: it.qtyTransfer,
        notes: it.notes
      }))
    };

    setTransfers([newTransfer, ...transfers]);
    setIsCreateOpen(false);
    toast({
      title: "Mutasi Disimpan",
      description: `Surat Mutasi ${newTransfer.code} berhasil diproses antar gudang.`,
      variant: "success"
    });
    if (actionParam === "create") {
      router.push("/goods-transfer");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <DnaBadge status="success">Selesai</DnaBadge>;
      case "PENDING":
        return <DnaBadge status="warning">Dalam Proses</DnaBadge>;
      case "CANCELLED":
        return <DnaBadge status="danger">Dibatalkan</DnaBadge>;
      default:
        return <DnaBadge status="default">{status}</DnaBadge>;
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
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Kode Transfer</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Gudang Asal</th>
                <th className="py-3 px-4">Gudang Tujuan</th>
                <th className="py-3 px-4">Pembuat</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Tidak ada transaksi mutasi barang ditemukan
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-semibold text-blue-600">{item.code}</td>
                    <td className="py-3 px-4 text-slate-600">{item.date}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{item.sourceWarehouse}</td>
                    <td className="py-3 px-4 font-medium text-blue-600">{item.destWarehouse}</td>
                    <td className="py-3 px-4 text-slate-600">{item.creator}</td>
                    <td className="py-3 px-4 text-center">{getStatusBadge(item.status)}</td>
                    <td className="py-3 px-4 text-center">
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">Nama Barang</th>
                      <th className="py-2.5 px-3 text-center">Satuan</th>
                      <th className="py-2.5 px-3 text-right">Qty Transfer</th>
                      <th className="py-2.5 px-3">Catatan Khusus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedTransfer.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{it.name}</td>
                        <td className="py-2.5 px-3 text-center text-slate-600">{it.unit}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-blue-600">
                          {it.qty.toLocaleString("id-ID")}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{it.notes || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                value={formData.sourceWarehouse}
                onChange={(e) => setFormData({ ...formData, sourceWarehouse: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-medium"
              >
                <option value="Gudang Bahan Baku">Gudang Bahan Baku</option>
                <option value="Gudang Kemasan">Gudang Kemasan</option>
                <option value="Gudang Barang Jadi">Gudang Barang Jadi</option>
                <option value="Gudang Surabaya">Gudang Surabaya</option>
                <option value="Gudang Laboratorium">Gudang Laboratorium</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gudang Tujuan *
              </label>
              <select
                value={formData.destWarehouse}
                onChange={(e) => setFormData({ ...formData, destWarehouse: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-medium"
              >
                <option value="Gudang Kemasan">Gudang Kemasan</option>
                <option value="Gudang Bahan Baku">Gudang Bahan Baku</option>
                <option value="Gudang Barang Jadi">Gudang Barang Jadi</option>
                <option value="Gudang Surabaya">Gudang Surabaya</option>
                <option value="Gudang Laboratorium">Gudang Laboratorium</option>
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
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
                >
                  <option value="Hairdensyl Complex">Hairdensyl Complex (gr)</option>
                  <option value="Niacinamide">Niacinamide (gr)</option>
                  <option value="IPM">IPM (gr)</option>
                  <option value="Secret Water">Secret Water (gr)</option>
                  <option value="TR-3TS">TR-3TS (gr)</option>
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
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">Barang</th>
                  <th className="py-2.5 px-3 text-center">Satuan</th>
                  <th className="py-2.5 px-3 text-right">Qty Mutasi</th>
                  <th className="py-2.5 px-3">Catatan</th>
                  <th className="py-2.5 px-3 text-center w-12">Hapus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {formData.cartItems.map((it, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-3 text-center text-slate-400">{idx + 1}</td>
                    <td className="py-2 px-3 font-medium text-slate-800">{it.name}</td>
                    <td className="py-2 px-3 text-center text-slate-600">{it.unit}</td>
                    <td className="py-2 px-3 text-right font-bold text-blue-600">{it.qtyTransfer.toLocaleString()}</td>
                    <td className="py-2 px-3 text-slate-500">{it.notes || "-"}</td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
