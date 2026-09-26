"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
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
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
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
    materialId?: string;
    name: string;
    unit: string;
    systemQty: number;
    actualQty: number;
    difference: number;
    reason?: string;
  }[];
}

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
  const toast = useDnaToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAdj, setSelectedAdj] = useState<AdjustmentItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Queries
  const { data: rawAdjustments = [], isLoading } = useQuery({
    queryKey: ["warehouse-adjustments"],
    queryFn: async () => {
      try {
        const res = await api.get("/warehouse/adjustments");
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

  const adjustments: AdjustmentItem[] = useMemo(() => {
    if (!rawAdjustments || !Array.isArray(rawAdjustments)) return [];
    return rawAdjustments.map((adj: any) => ({
      id: adj.id,
      code: adj.adjNumber || `ADJ-${adj.id.slice(0, 8).toUpperCase()}`,
      date: adj.date || "-",
      warehouse: adj.warehouseName || "Gudang Utama",
      creator: "Warehouse Team",
      notes: adj.notes || "-",
      account: "5100 - Beban Selisih Persediaan",
      items: [
        {
          name: adj.materialName || "Material",
          unit: adj.unit || "Unit",
          systemQty: adj.qty > 0 ? 0 : Math.abs(adj.qty),
          actualQty: adj.qty > 0 ? adj.qty : 0,
          difference: adj.qty,
          reason: adj.notes || adj.type,
        },
      ],
    }));
  }, [rawAdjustments]);

  // Form state
  const [formData, setFormData] = useState<{
    warehouseId: string;
    date: string;
    account: string;
    notes: string;
    items: {
      materialId: string;
      name: string;
      unit: string;
      systemQty: number;
      actualQty: number;
      difference: number;
      reason?: string;
    }[];
  }>({
    warehouseId: "",
    date: new Date().toISOString().split("T")[0],
    account: "5100 - Beban Selisih Persediaan",
    notes: "",
    items: [],
  });

  const [newItem, setNewItem] = useState<{
    materialId: string;
    name: string;
    unit: string;
    systemQty: number;
    actualQty: number;
    difference: number;
    reason: string;
  }>({
    materialId: "",
    name: "",
    unit: "Kg",
    systemQty: 0,
    actualQty: 0,
    difference: 0,
    reason: "",
  });

  useEffect(() => {
    if (warehouseList.length > 0 && !formData.warehouseId) {
      setFormData((prev) => ({ ...prev, warehouseId: warehouseList[0].id }));
    }
  }, [warehouseList, formData.warehouseId]);

  useEffect(() => {
    if (actionParam === "create") {
      setIsCreateOpen(true);
    }
  }, [actionParam]);

  const filteredData = useMemo(() => {
    return adjustments.filter((item) => {
      return (
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.warehouse.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.creator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.notes.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [adjustments, searchTerm]);

  const totalDeficit = useMemo(() => {
    return adjustments.reduce((acc, curr) => {
      return acc + curr.items.filter((it) => it.difference < 0).length;
    }, 0);
  }, [adjustments]);

  const totalSurplus = useMemo(() => {
    return adjustments.reduce((acc, curr) => {
      return acc + curr.items.filter((it) => it.difference > 0).length;
    }, 0);
  }, [adjustments]);

  const handleAddItem = () => {
    if (!newItem.materialId) {
      toast.warning("Pilih barang terlebih dahulu");
      return;
    }
    const diff = newItem.actualQty - newItem.systemQty;
    setFormData({
      ...formData,
      items: [...formData.items, { ...newItem, difference: diff }],
    });
    setNewItem({
      materialId: "",
      name: "",
      unit: "Kg",
      systemQty: 0,
      actualQty: 0,
      difference: 0,
      reason: "",
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      toast.warning("Tambahkan barang yang akan disesuaikan");
      return;
    }

    const targetWhId = formData.warehouseId || warehouseList[0]?.id;
    if (!targetWhId) {
      toast.error("Gudang tidak valid atau belum tersedia");
      return;
    }

    try {
      await Promise.all(
        formData.items.map((it) =>
          api.post("/warehouse/adjustments", {
            materialId: it.materialId,
            warehouseId: targetWhId,
            type: it.difference < 0 ? "WRITE_OFF" : "CORRECTION",
            qty: Math.abs(it.difference),
            notes: `${formData.notes ? formData.notes + " - " : ""}${it.reason || ""}`.trim() || undefined,
          })
        )
      );
      toast.success("Penyesuaian stok berhasil disimpan dan dibukukan.");
      queryClient.invalidateQueries({ queryKey: ["warehouse-adjustments"] });
      queryClient.invalidateQueries({ queryKey: ["warehouse-transactions"] });
      setIsCreateOpen(false);
      setFormData({
        warehouseId: warehouseList[0]?.id || "",
        date: new Date().toISOString().split("T")[0],
        account: "5100 - Beban Selisih Persediaan",
        notes: "",
        items: [],
      });
      if (actionParam === "create") {
        router.push("/stock-adjustment");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal menyimpan penyesuaian stok");
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
          <DnaTable className="w-full text-xs text-left">
            <DnaTableHead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <DnaTableRow>
                <DnaTh className="py-3 px-4 w-12 text-center">#</DnaTh>
                <DnaTh className="py-3 px-4">Kode Penyesuaian</DnaTh>
                <DnaTh className="py-3 px-4">Tanggal</DnaTh>
                <DnaTh className="py-3 px-4">Gudang</DnaTh>
                <DnaTh className="py-3 px-4">Pembuat</DnaTh>
                <DnaTh className="py-3 px-4">Catatan</DnaTh>
                <DnaTh className="py-3 px-4 text-center">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada catatan penyesuaian stok ditemukan
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredData.map((item, idx) => (
                  <DnaTableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <DnaTd className="py-3 px-4 text-center font-medium text-slate-400">{idx + 1}</DnaTd>
                    <DnaTd className="py-3 px-4 font-semibold text-blue-600">{item.code}</DnaTd>
                    <DnaTd className="py-3 px-4 text-slate-600 tabular-nums">{item.date}</DnaTd>
                    <DnaTd className="py-3 px-4 font-medium text-slate-800">{item.warehouse}</DnaTd>
                    <DnaTd className="py-3 px-4 text-slate-600">{item.creator}</DnaTd>
                    <DnaTd className="py-3 px-4 text-slate-700 max-w-xs truncate">{item.notes}</DnaTd>
                    <DnaTd className="py-3 px-4 text-center">
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
                    </DnaTd>
                  </DnaTableRow>
                ))
              )}
            </DnaTableBody>
          </DnaTable>
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
                <DnaTable className="w-full text-xs text-left">
                  <DnaTableHead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <DnaTableRow>
                      <DnaTh className="py-2.5 px-3 w-10 text-center">#</DnaTh>
                      <DnaTh className="py-2.5 px-3">Nama Barang</DnaTh>
                      <DnaTh className="py-2.5 px-3 text-center">Satuan</DnaTh>
                      <DnaTh className="py-2.5 px-3 text-right">Stok Sistem</DnaTh>
                      <DnaTh className="py-2.5 px-3 text-right">Stok Aktual</DnaTh>
                      <DnaTh className="py-2.5 px-3 text-right">Selisih</DnaTh>
                      <DnaTh className="py-2.5 px-3">Alasan / Keterangan</DnaTh>
                    </DnaTableRow>
                  </DnaTableHead>
                  <DnaTableBody className="divide-y divide-slate-100">
                    {selectedAdj.items.map((it, idx) => (
                      <DnaTableRow key={idx}>
                        <DnaTd className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</DnaTd>
                        <DnaTd className="py-2.5 px-3 font-medium text-slate-800">{it.name}</DnaTd>
                        <DnaTd className="py-2.5 px-3 text-center text-slate-600">{it.unit}</DnaTd>
                        <DnaTd className="py-2.5 px-3 text-right text-slate-600 tabular-nums">{it.systemQty.toLocaleString()}</DnaTd>
                        <DnaTd className="py-2.5 px-3 text-right font-semibold text-slate-900 tabular-nums">{it.actualQty.toLocaleString()}</DnaTd>
                        <DnaTd className={`py-2.5 px-3 text-right font-bold tabular-nums ${it.difference < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                          {it.difference > 0 ? `+${it.difference}` : it.difference}
                        </DnaTd>
                        <DnaTd className="py-2.5 px-3 text-slate-500">{it.reason || "-"}</DnaTd>
                      </DnaTableRow>
                    ))}
                  </DnaTableBody>
                </DnaTable>
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
                value={formData.warehouseId || (warehouseList[0]?.id ?? "")}
                onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white font-medium"
              >
                {warehouseList.length === 0 ? (
                  <option value="">Gudang Utama</option>
                ) : (
                  warehouseList.map((wh: any) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} {wh.code ? `(${wh.code})` : ""}
                    </option>
                  ))
                )}
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
                  value={newItem.materialId}
                  onChange={(e) => {
                    const selectedMat = catalogMaterials.find((m: any) => m.id === e.target.value);
                    const stockVal = Number(selectedMat?.stock || selectedMat?.currentStock || 0);
                    setNewItem({
                      ...newItem,
                      materialId: e.target.value,
                      name: selectedMat?.name || e.target.value,
                      unit: selectedMat?.unit || "Unit",
                      systemQty: stockVal,
                      actualQty: stockVal,
                      difference: 0,
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
            <DnaTable className="w-full text-xs text-left">
              <DnaTableHead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <DnaTableRow>
                  <DnaTh className="py-2.5 px-3 w-10 text-center">#</DnaTh>
                  <DnaTh className="py-2.5 px-3">Barang</DnaTh>
                  <DnaTh className="py-2.5 px-3 text-center">Satuan</DnaTh>
                  <DnaTh className="py-2.5 px-3 text-right">Stok Sistem</DnaTh>
                  <DnaTh className="py-2.5 px-3 text-right">Stok Aktual</DnaTh>
                  <DnaTh className="py-2.5 px-3 text-right">Selisih</DnaTh>
                  <DnaTh className="py-2.5 px-3">Alasan</DnaTh>
                  <DnaTh className="py-2.5 px-3 text-center w-12">Hapus</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody className="divide-y divide-slate-100">
                {formData.items.map((it, idx) => (
                  <DnaTableRow key={idx}>
                    <DnaTd className="py-2 px-3 text-center text-slate-400">{idx + 1}</DnaTd>
                    <DnaTd className="py-2 px-3 font-medium text-slate-800">{it.name}</DnaTd>
                    <DnaTd className="py-2 px-3 text-center text-slate-600">{it.unit}</DnaTd>
                    <DnaTd className="py-2 px-3 text-right text-slate-500 tabular-nums">{it.systemQty.toLocaleString()}</DnaTd>
                    <DnaTd className="py-2 px-3 text-right font-bold text-slate-800 tabular-nums">{it.actualQty.toLocaleString()}</DnaTd>
                    <DnaTd className={`py-2 px-3 text-right font-bold tabular-nums ${it.difference < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      {it.difference > 0 ? `+${it.difference}` : it.difference}
                    </DnaTd>
                    <DnaTd className="py-2 px-3 text-slate-500">{it.reason || "-"}</DnaTd>
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
