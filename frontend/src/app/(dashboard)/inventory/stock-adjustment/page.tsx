"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  SlidersHorizontal,
  Search,
  Plus,
  Eye,
  Warehouse,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileText,
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

interface AdjustmentItem {
  id: string;
  code: string;
  date: string;
  warehouse: string;
  creator: string;
  notes: string;
  account: string;
  items: {
    name: string;
    unit: string;
    systemQty: number;
    actualQty: number;
    difference: number;
    reason?: string;
  }[];
}

const INITIAL_ADJUSTMENTS: AdjustmentItem[] = [
  {
    id: "ADJ-001",
    code: "ADJ-2026-0001",
    date: "2026-09-04",
    warehouse: "Gudang Bahan Baku",
    creator: "QC Controller",
    notes: "Koreksi susut evaporasi bahan aktif batch mixing 01",
    account: "5100 - Beban Selisih Persediaan",
    items: [
      { name: "Hairdensyl Complex", unit: "gr", systemQty: 500, actualQty: 497.5, difference: -2.5, reason: "Evaporasi panas reaktor" }
    ]
  },
  {
    id: "ADJ-002",
    code: "ADJ-2026-0002",
    date: "2026-09-09",
    warehouse: "Gudang Kemasan",
    creator: "Staff Gudang",
    notes: "Kerusakan botol kaca saat bongkar muat forklift",
    account: "5100 - Beban Selisih Persediaan",
    items: [
      { name: "IPM", unit: "gr", systemQty: 250, actualQty: 235, difference: -15, reason: "Pecah fisik kemasan luar" }
    ]
  },
  {
    id: "ADJ-003",
    code: "ADJ-2026-0003",
    date: "2026-09-13",
    warehouse: "Gudang Barang Jadi",
    creator: "Super Admin",
    notes: "Penambahan stok sample uji lab gratis dari supplier",
    account: "7100 - Pendapatan Lain-lain (Bonus Sample)",
    items: [
      { name: "Niacinamide", unit: "gr", systemQty: 100, actualQty: 105, difference: 5, reason: "Bonus supplier gratis" }
    ]
  }
];

export default function StockAdjustmentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Memuat Penyesuaian Stok...</div>}>
      <StockAdjustmentContent />
    </Suspense>
  );
}

function StockAdjustmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const actionParam = searchParams.get("action");
  const { toast } = useDnaToast();

  const [adjustments, setAdjustments] = useState<AdjustmentItem[]>(INITIAL_ADJUSTMENTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAdj, setSelectedAdj] = useState<AdjustmentItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    code: `ADJ-2026-${String(adjustments.length + 1).padStart(4, "0")}`,
    date: new Date().toISOString().split("T")[0],
    warehouse: "Gudang Bahan Baku",
    account: "5100 - Beban Selisih Persediaan",
    notes: "",
    items: [
      { name: "Hairdensyl Complex", unit: "gr", systemQty: 500, actualQty: 498, difference: -2, reason: "Susut resep" }
    ]
  });

  const [newItem, setNewItem] = useState({
    name: "Niacinamide",
    unit: "gr",
    systemQty: 250,
    actualQty: 248,
    difference: -2,
    reason: ""
  });

  useEffect(() => {
    if (actionParam === "create") {
      setIsCreateOpen(true);
    }
  }, [actionParam]);

  const filteredData = useMemo(() => {
    return adjustments.filter(item => {
      return (
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.warehouse.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.creator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.notes.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [adjustments, searchTerm]);

  const totalDeficit = adjustments.reduce((acc, curr) => {
    return acc + curr.items.filter(it => it.difference < 0).length;
  }, 0);

  const totalSurplus = adjustments.reduce((acc, curr) => {
    return acc + curr.items.filter(it => it.difference > 0).length;
  }, 0);

  const handleAddItem = () => {
    const diff = newItem.actualQty - newItem.systemQty;
    setFormData({
      ...formData,
      items: [...formData.items, { ...newItem, difference: diff }]
    });
    setNewItem({ name: "IPM", unit: "gr", systemQty: 300, actualQty: 300, difference: 0, reason: "" });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      toast({ title: "Item Kosong", description: "Tambahkan barang yang akan disesuaikan", variant: "warning" });
      return;
    }

    const newAdj: AdjustmentItem = {
      id: `ADJ-${Date.now()}`,
      code: formData.code,
      date: formData.date,
      warehouse: formData.warehouse,
      creator: "Super Admin",
      account: formData.account,
      notes: formData.notes || "Penyesuaian stok reguler",
      items: formData.items
    };

    setAdjustments([newAdj, ...adjustments]);
    setIsCreateOpen(false);
    toast({
      title: "Penyesuaian Disimpan",
      description: `Dokumen ${newAdj.code} berhasil memutasi saldo persediaan.`,
      variant: "success"
    });
    if (actionParam === "create") {
      router.push("/stock-adjustment");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <DnaPageHeader
        title="Penyesuaian Stok (Stock Adjustment)"
        description="Koreksi dan penyesuaian saldo persediaan akibat susut formulasi, barang cacat, tumpah, atau bonus sample"
        actions={
          <DnaButton
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setIsCreateOpen(true);
              router.push("/stock-adjustment/create");
            }}
          >
            + Buat Penyesuaian Stok
          </DnaButton>
        }
      />

      {/* KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          title="Total Dokumen Penyesuaian"
          value={adjustments.length.toString()}
          icon={SlidersHorizontal}
          variant="default"
          subtext="Akumulasi adjustment terbit"
        />
        <DnaStatCard
          title="Item Susut / Defisit"
          value={totalDeficit.toString()}
          icon={AlertTriangle}
          variant="danger"
          subtext="Koreksi stok berkurang"
        />
        <DnaStatCard
          title="Item Surplus / Bonus"
          value={totalSurplus.toString()}
          icon={CheckCircle2}
          variant="success"
          subtext="Penambahan stok bebas HPP"
        />
        <DnaStatCard
          title="Gudang Terverifikasi"
          value="Semua Lokasi"
          icon={Warehouse}
          variant="info"
          subtext="Posting otomatis ke COA 5100"
        />
      </DnaKpiGrid>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari no penyesuaian, gudang, pembuat, alasan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 1:1 Table (Exactly 7 columns matching legacy G-SERP) */}
      <DnaDataTableCard title="Daftar Penyesuaian Stok">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Kode Penyesuaian</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Gudang</th>
                <th className="py-3 px-4">Pembuat</th>
                <th className="py-3 px-4">Catatan</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada catatan penyesuaian stok ditemukan
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-semibold text-blue-600">{item.code}</td>
                    <td className="py-3 px-4 text-slate-600">{item.date}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{item.warehouse}</td>
                    <td className="py-3 px-4 text-slate-600">{item.creator}</td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs truncate">{item.notes}</td>
                    <td className="py-3 px-4 text-center">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        icon={<Eye className="h-3.5 w-3.5 text-blue-600" />}
                        onClick={() => {
                          setSelectedAdj(item);
                          setIsDetailOpen(true);
                        }}
                      >
                        Lihat
                      </DnaButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* Modal Detail */}
      <DnaModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Detail Penyesuaian Stok: ${selectedAdj?.code || ""}`}
        size="lg"
      >
        {selectedAdj && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Kode Adjustment</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedAdj.code}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Tanggal</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedAdj.date}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Gudang</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedAdj.warehouse}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Pembuat</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedAdj.creator}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Akun Lawan CoA</p>
                <p className="text-xs font-bold text-blue-600 mt-0.5">{selectedAdj.account}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Catatan</p>
                <p className="text-xs text-slate-700 mt-0.5">{selectedAdj.notes}</p>
              </div>
            </div>

            {/* Sub-table */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
                Rincian Barang Disesuaikan
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">Nama Barang</th>
                      <th className="py-2.5 px-3 text-center">Satuan</th>
                      <th className="py-2.5 px-3 text-right">Stok Sistem</th>
                      <th className="py-2.5 px-3 text-right">Stok Aktual</th>
                      <th className="py-2.5 px-3 text-right">Selisih</th>
                      <th className="py-2.5 px-3">Alasan / Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedAdj.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{it.name}</td>
                        <td className="py-2.5 px-3 text-center text-slate-600">{it.unit}</td>
                        <td className="py-2.5 px-3 text-right text-slate-600">{it.systemQty.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-900">{it.actualQty.toLocaleString()}</td>
                        <td className={`py-2.5 px-3 text-right font-bold ${it.difference < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                          {it.difference > 0 ? `+${it.difference}` : it.difference}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{it.reason || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <DnaButton variant="secondary" onClick={() => setIsDetailOpen(false)}>
                Tutup
              </DnaButton>
            </div>
          </div>
        )}
      </DnaModal>

      {/* Modal Form Buat Penyesuaian (/stock-adjustment/create) */}
      <DnaModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          if (actionParam === "create") {
            router.push("/stock-adjustment");
          }
        }}
        title="Buat Penyesuaian Stok"
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gudang *
              </label>
              <select
                value={formData.warehouse}
                onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-medium"
              >
                <option value="Gudang Bahan Baku">Gudang Bahan Baku</option>
                <option value="Gudang Kemasan">Gudang Kemasan</option>
                <option value="Gudang Barang Jadi">Gudang Barang Jadi</option>
                <option value="Gudang Surabaya">Gudang Surabaya</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Penyesuaian *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Akun Penyesuaian (CoA) *
              </label>
              <select
                value={formData.account}
                onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-medium text-blue-600"
              >
                <option value="5100 - Beban Selisih Persediaan">5100 - Beban Selisih Persediaan (Susut/Rusak)</option>
                <option value="7100 - Pendapatan Lain-lain (Bonus Sample)">7100 - Pendapatan Lain-lain (Bonus Sample/Surplus)</option>
                <option value="5200 - Beban Pemakaian Internal Laboratorium">5200 - Beban Pemakaian Internal Laboratorium</option>
              </select>
            </div>
          </div>

          {/* Sub-form Tambah Item */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Barang yang Disesuaikan
            </h5>
            <div className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-4">
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
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Stok Sistem</label>
                <input
                  type="number"
                  readOnly
                  value={newItem.systemQty}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-slate-100 text-right font-medium"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Stok Aktual *</label>
                <input
                  type="number"
                  value={newItem.actualQty}
                  onChange={(e) => setNewItem({ ...newItem, actualQty: Number(e.target.value) })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white text-right font-bold"
                />
              </div>
              <div className="col-span-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Alasan selisih..."
                  value={newItem.reason}
                  onChange={(e) => setNewItem({ ...newItem, reason: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white"
                />
                <DnaButton type="button" variant="primary" size="sm" onClick={handleAddItem}>
                  + Tambah
                </DnaButton>
              </div>
            </div>
          </div>

          {/* Tabel Item Keranjang */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">Barang</th>
                  <th className="py-2.5 px-3 text-center">Satuan</th>
                  <th className="py-2.5 px-3 text-right">Stok Sistem</th>
                  <th className="py-2.5 px-3 text-right">Stok Aktual</th>
                  <th className="py-2.5 px-3 text-right">Selisih</th>
                  <th className="py-2.5 px-3">Alasan</th>
                  <th className="py-2.5 px-3 text-center w-12">Hapus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {formData.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-3 text-center text-slate-400">{idx + 1}</td>
                    <td className="py-2 px-3 font-medium text-slate-800">{it.name}</td>
                    <td className="py-2 px-3 text-center text-slate-600">{it.unit}</td>
                    <td className="py-2 px-3 text-right text-slate-500">{it.systemQty.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-800">{it.actualQty.toLocaleString()}</td>
                    <td className={`py-2 px-3 text-right font-bold ${it.difference < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      {it.difference > 0 ? `+${it.difference}` : it.difference}
                    </td>
                    <td className="py-2 px-3 text-slate-500">{it.reason || "-"}</td>
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
              Catatan Penyesuaian
            </label>
            <textarea
              rows={2}
              placeholder="Catatan tambahan..."
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
                  router.push("/stock-adjustment");
                }
              }}
            >
              Batal
            </DnaButton>
            <DnaButton type="submit" variant="primary">
              Simpan Penyesuaian Stok
            </DnaButton>
          </div>
        </form>
      </DnaModal>
    </div>
  );
}
