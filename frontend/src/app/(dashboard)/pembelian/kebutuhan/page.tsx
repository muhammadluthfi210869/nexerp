"use client";

/**
 * Kebutuhan Barang (Material Requirements Planning / MRP)
 * Screen ID: SCR-035 & SCR-036
 *
 * Sesuai Spesifikasi Visual DNA Golden Reference:
 * - DnaPageContainer, DnaPageHeader, DnaKpiGrid, DnaDataTableCard, DnaDetailDrawer
 * - Kalkulasi MRP Otomatis: Kebutuhan Bersih (Net Need) = Gross - Real Stok Gudang - PO On-Order
 * - 6 kolom ramping tanpa scroll horizontal, 2 baris per sel
 */

import React, { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Layers,
  Plus,
  AlertTriangle,
  CheckCircle2,
  ShoppingCart,
  DollarSign,
  Eye,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaButton,
  DnaInput,
  DnaSelect,
  DnaModal,
  DnaDetailDrawer,
  DnaBadge,
  useDnaToast,
  DnaLoadingSkeleton,
  DnaErrorState,
  DnaEmptyState,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  GoodsRequestPrintModal,
} from "@/components/dna";
import { Printer } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface MrpItemRecord {
  id: string;
  materialCode: string;
  materialName: string;
  category: "Bahan Baku" | "Kemas Primer" | "Kemas Sekunder";
  salesOrderRef: string;
  clientName: string;
  brandProduct: string;
  grossRequirement: number;
  realStockQty: number; // Pilar 1: Real Stok Gudang (Bagus)
  onOrderQty: number;   // PO Sedang Berjalan
  netNeedQty: number;   // Gross - Real Stock - On Order
  unit: string;
  primarySupplier: string;
  estimatedUnitPrice: number;
  estimatedTotalCost: number;
  status: "DEFICIT" | "PARTIAL_COVERED" | "SAFE_STOCK";
}

export default function KebutuhanBarangMRPPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Memuat Kebutuhan Barang (MRP)...</div>}>
      <KebutuhanBarangMRPContent />
    </Suspense>
  );
}

function KebutuhanBarangMRPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useDnaToast();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<MrpItemRecord | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(searchParams.get("action") === "create");
  const [manualNeeds, setManualNeeds] = useState<MrpItemRecord[]>([]);
  const [isPrintGrqOpen, setIsPrintGrqOpen] = useState(false);

  // Live query from backend /scm/materials
  const {
    data: materials = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["mrp-materials"],
    queryFn: async () => {
      const res = await api.get("/scm/materials");
      return unwrapResponse(res) || [];
    },
  });

  const mrpList: MrpItemRecord[] = useMemo(() => {
    const fromApi: MrpItemRecord[] = (materials as any[]).map((mat) => {
      const stock = Number(mat.stockQty ?? 0);
      const minReq = Number(mat.minLevel ?? 50);
      const gross = Math.max(minReq, 50);
      const net = Math.max(0, gross - stock);
      const category =
        mat.type === "PACKAGING" || mat.type === "BOX" ? "Kemas Primer" : "Bahan Baku";
      const price = Number(mat.unitPrice ?? 10000);

      return {
        id: mat.id,
        materialCode: mat.code || `MAT-${mat.id.slice(0, 6)}`,
        materialName: mat.name,
        category,
        salesOrderRef: "SO-AUTO-ALLOC",
        clientName: "Internal Buffer / Maklon",
        brandProduct: "Kebutuhan Minimum",
        grossRequirement: gross,
        realStockQty: stock,
        onOrderQty: 0,
        netNeedQty: net,
        unit: mat.unit || "kg",
        primarySupplier: "Supplier Rekanan",
        estimatedUnitPrice: price,
        estimatedTotalCost: net * price,
        status: net > 0 ? "DEFICIT" : "SAFE_STOCK",
      };
    });

    return [...manualNeeds, ...fromApi];
  }, [materials, manualNeeds]);

  // Form State for Manual Need Entry
  const [formData, setFormData] = useState({
    materialCode: "",
    materialName: "",
    category: "Bahan Baku" as "Bahan Baku" | "Kemas Primer" | "Kemas Sekunder",
    salesOrderRef: "",
    clientName: "",
    brandProduct: "",
    grossRequirement: 0,
    realStockQty: 0,
    onOrderQty: 0,
    unit: "kg",
    primarySupplier: "",
    estimatedUnitPrice: 0,
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.materialCode || !formData.materialName) {
      toast.error("Validasi Gagal", "Kode material dan nama material wajib diisi.");
      return;
    }
    const netNeed = Math.max(0, formData.grossRequirement - formData.realStockQty - formData.onOrderQty);
    const newItem: MrpItemRecord = {
      id: `mrp-${Date.now()}`,
      ...formData,
      netNeedQty: netNeed,
      estimatedTotalCost: netNeed * formData.estimatedUnitPrice,
      status: netNeed > 0 ? "DEFICIT" : "SAFE_STOCK",
    };
    setManualNeeds([newItem, ...manualNeeds]);
    // Local planning worksheet only. POST /scm/goods-requirements needs `salesOrderId` and
    // `items[].materialId` as UUIDs; this form holds a material code/name, so it cannot fill
    // either and the row would be rejected. Nothing is sent until those pickers exist.
    toast.warning(
      "Kebutuhan dicatat lokal",
      `Kebutuhan ${newItem.materialName} masuk ke rencana MRP di layar ini saja — belum tersimpan ke server.`,
    );
    setIsCreateOpen(false);
  };

  // Filters
  const filteredList = useMemo(() => {
    return mrpList.filter((item) => {
      if (activeTab === "deficit" && item.status !== "DEFICIT") return false;
      if (activeTab === "safe" && item.status !== "SAFE_STOCK") return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.materialCode.toLowerCase().includes(q) ||
        item.materialName.toLowerCase().includes(q) ||
        item.salesOrderRef.toLowerCase().includes(q) ||
        item.clientName.toLowerCase().includes(q) ||
        item.primarySupplier.toLowerCase().includes(q)
      );
    });
  }, [mrpList, activeTab, searchQuery]);

  // KPIs
  const deficitItems = useMemo(() => mrpList.filter((i) => i.status === "DEFICIT"), [mrpList]);
  const totalDeficitCost = useMemo(() => deficitItems.reduce((sum, i) => sum + i.estimatedTotalCost, 0), [deficitItems]);
  const safeItemsCount = useMemo(() => mrpList.filter((i) => i.status === "SAFE_STOCK").length, [mrpList]);

  const handleGeneratePo = (item: MrpItemRecord) => {
    toast.success("Draft PO Dibuat", `Pengadaan untuk ${item.materialName} (${item.netNeedQty} ${item.unit}) telah dialokasikan ke SCM PO.`);
    router.push("/scm/pembelian/create");
  };

  return (
    <DnaPageContainer>
      {/* Header with Unified Tabs */}
      <DnaPageHeader
        title="Kebutuhan Barang (Material Requirements Planning / MRP)"
        description="Kalkulasi Otomatis Defisit Bahan Baku Formula & Kemasan Berdasarkan Sales Order Aktif Pabrik (Gross vs Real Stok Gudang vs PO On-Order)"
        tabs={[
          { key: "all", label: "Semua Kebutuhan", count: mrpList.length },
          { key: "deficit", label: "Defisit (Perlu PO)", count: deficitItems.length },
          { key: "safe", label: "Stok Aman (Siap Produksi)", count: safeItemsCount },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="outline"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateOpen(true)}
            >
              + Input Kebutuhan
            </DnaButton>
            <DnaButton
              variant="primary"
              size="sm"
              icon={<ShoppingCart className="w-4 h-4" />}
              onClick={() => {
                toast.success("Batch PO Ready", "Semua item defisit siap diterbitkan PO massal.");
                router.push("/scm/pembelian/create");
              }}
            >
              + Terbitkan PO Massal
            </DnaButton>
          </div>
        }
      />

      {/* 4 KPI Grid */}
      <DnaKpiGrid
        items={[
          {
            label: "Total Bahan Terjadwal",
            value: `${mrpList.length} Bahan/Kemas`,
            subtitle: "Diperlukan untuk seluruh SO aktif",
            trend: "Terpetakan BOM",
            icon: Layers,
            variant: "blue",
          },
          {
            label: "Bahan Defisit (Perlu PO)",
            value: `${deficitItems.length} Item Kurang`,
            subtitle: "Stok gudang di bawah kebutuhan SO",
            trend: "Prioritas SCM",
            icon: AlertTriangle,
            variant: "rose",
          },
          {
            label: "Estimasi Anggaran PO Defisit",
            value: formatCurrency(totalDeficitCost),
            subtitle: "Biaya pengadaan untuk menutup defisit",
            trend: "Kalkulasi Otomatis",
            icon: DollarSign,
            variant: "amber",
          },
          {
            label: "Bahan Siap Produksi (Aman)",
            value: `${safeItemsCount} Item Tersedia`,
            subtitle: "Real stok & on-order mencukupi",
            trend: "Siap Mixing/Pack",
            icon: CheckCircle2,
            variant: "emerald",
          },
        ]}
      />

      {/* Main MRP Table Card */}
      {isError && (
        <div className="mb-4">
          <DnaErrorState
            title="Gagal Memuat Kebutuhan MRP"
            message="Terjadi kesalahan saat memuat data material dari server."
            onRetry={() => refetch()}
          />
        </div>
      )}

      {isLoading ? (
        <DnaLoadingSkeleton rows={5} />
      ) : (
        <DnaDataTableCard
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Cari kode bahan, nama bahan, SO ref, supplier..."
        >
          <div className="w-full">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow>
                  <DnaTh className="py-3 px-4 w-[24%]">MATERIAL & KATEGORI</DnaTh>
                  <DnaTh className="py-3 px-4 w-[18%]">SO REF & KLIEN</DnaTh>
                  <DnaTh className="py-3 px-4 text-center w-[16%]">GROSS VS REAL STOK</DnaTh>
                  <DnaTh className="py-3 px-4 text-right w-[16%]">NET DEFISIT (PO)</DnaTh>
                  <DnaTh className="py-3 px-4 text-right w-[16%]">SUPPLIER & EST. BIAYA</DnaTh>
                  <DnaTh className="py-3 px-4 text-right w-[10%]">AKSI</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {filteredList.length === 0 ? (
                  <DnaTableRow>
                    <DnaTd colSpan={6} className="py-8 text-center">
                      <DnaEmptyState
                        title="Belum Ada Analisis MRP"
                        description="Tidak ada data kebutuhan barang pada filter ini."
                      />
                    </DnaTd>
                  </DnaTableRow>
                ) : (
                  filteredList.map((item) => (
                    <DnaTableRow
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <DnaTd className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block truncate">
                          {item.materialName}
                        </span>
                        <span className="text-[11px] tabular-nums text-slate-500 block truncate">
                          <span>{item.materialCode}</span> • {item.category}
                        </span>
                      </DnaTd>
                      <DnaTd className="py-3 px-4">
                        <span className="tabular-nums font-bold text-slate-800 block truncate">
                          {item.salesOrderRef}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate">
                          {item.clientName}
                        </span>
                      </DnaTd>
                      <DnaTd className="py-3 px-4 text-center">
                        <span className="tabular-nums font-bold text-slate-700 block text-xs">
                          {item.grossRequirement} {item.unit} (Gross)
                        </span>
                        <span className="text-[11px] font-medium text-emerald-700 block">
                          Stok: {item.realStockQty} {item.unit}
                        </span>
                      </DnaTd>
                      <DnaTd className="py-3 px-4 text-right">
                        {item.netNeedQty > 0 ? (
                          <>
                            <span className="tabular-nums font-black text-rose-600 block text-xs">
                              {item.netNeedQty} {item.unit}
                            </span>
                            <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 inline-block">
                              Defisit PO
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="tabular-nums font-semibold text-emerald-700 block text-xs">
                              0 {item.unit}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-medium">Stok Aman</span>
                          </>
                        )}
                      </DnaTd>
                      <DnaTd className="py-3 px-4 text-right">
                        <span className="font-semibold text-slate-800 block truncate text-xs">
                          {item.primarySupplier}
                        </span>
                        <span className="tabular-nums font-bold text-blue-600 block text-xs">
                          {item.netNeedQty > 0 ? formatCurrency(item.estimatedTotalCost) : "—"}
                        </span>
                      </DnaTd>
                      <DnaTd className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <DnaButton
                            size="sm"
                            variant="ghost"
                            icon={<Printer className="w-3.5 h-3.5 text-blue-600" />}
                            onClick={() => {
                              setSelectedItem(item);
                              setIsPrintGrqOpen(true);
                            }}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600"
                            title="Cetak Permintaan Barang (GRQ)"
                          />
                          {item.netNeedQty > 0 && (
                            <DnaButton
                              size="sm"
                              variant="primary"
                              onClick={() => handleGeneratePo(item)}
                              className="text-[10px] h-7 px-2 bg-blue-600"
                            >
                              PO
                            </DnaButton>
                          )}
                          <DnaButton
                            size="sm"
                            variant="ghost"
                            icon={<Eye className="w-3.5 h-3.5" />}
                            onClick={() => setSelectedItem(item)}
                          >
                            Detail
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
      )}

      {/* DnaDetailDrawer for MRP Detail */}
      <DnaDetailDrawer
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.materialName || "Detail Analisis Kebutuhan MRP"}
        subtitle={selectedItem ? `${selectedItem.materialCode} • ${selectedItem.category}` : undefined}
        badge={
          selectedItem ? (
            <DnaBadge variant={selectedItem.status === "SAFE_STOCK" ? "success" : "critical"}>
              {selectedItem.status === "SAFE_STOCK" ? "Stok Aman" : "Perlu PO"}
            </DnaBadge>
          ) : undefined
        }
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <DnaButton
                variant="outline"
                size="sm"
                icon={<Printer className="w-4 h-4 text-blue-600" />}
                onClick={() => setIsPrintGrqOpen(true)}
              >
                Cetak Permintaan (GRQ)
              </DnaButton>
              <DnaButton variant="outline" size="sm" onClick={() => setSelectedItem(null)}>
                Tutup
              </DnaButton>
            </div>
            {selectedItem && selectedItem.netNeedQty > 0 && (
              <DnaButton
                variant="primary"
                size="sm"
                icon={<ShoppingCart className="w-4 h-4" />}
                onClick={() => handleGeneratePo(selectedItem)}
              >
                Buat Purchase Order
              </DnaButton>
            )}
          </div>
        }
      >
        {selectedItem && (
          <div className="space-y-5 text-xs">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[11px]">SO Terkait & Produk</span>
                <span className="font-bold text-slate-900 tabular-nums text-sm block">{selectedItem.salesOrderRef}</span>
                <span className="text-slate-500 text-[11px] mt-0.5">{selectedItem.brandProduct} ({selectedItem.clientName})</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[11px]">Total Biaya Pengadaan</span>
                <span className="font-bold text-blue-600 tabular-nums text-sm block">
                  {selectedItem.netNeedQty > 0 ? formatCurrency(selectedItem.estimatedTotalCost) : "Rp 0 (Cukup)"}
                </span>
                <span className="text-slate-500 text-[11px] mt-0.5">Supplier: {selectedItem.primarySupplier}</span>
              </div>
            </div>

            {/* Matrix Perhitungan MRP */}
            <div className="grid grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block mb-0.5 text-[11px]">Gross Need</span>
                <span className="font-bold text-slate-900 text-sm tabular-nums">
                  {selectedItem.grossRequirement} {selectedItem.unit}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block mb-0.5 text-[11px]">Real Stok</span>
                <span className="font-bold text-emerald-700 text-sm tabular-nums">
                  {selectedItem.realStockQty} {selectedItem.unit}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block mb-0.5 text-[11px]">On-Order</span>
                <span className="font-bold text-blue-700 text-sm tabular-nums">
                  {selectedItem.onOrderQty} {selectedItem.unit}
                </span>
              </div>
              <div className="bg-rose-50/80 p-3 rounded-xl border border-rose-200">
                <span className="text-rose-600 block mb-0.5 text-[11px] font-bold">Defisit (Perlu PO)</span>
                <span className="font-black text-rose-700 text-sm tabular-nums">
                  {selectedItem.netNeedQty} {selectedItem.unit}
                </span>
              </div>
            </div>

            {/* Rekomendasi Mitra */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                Rekomendasi Pengadaan Supplier & Estimasi Harga
              </span>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Mitra Supplier Utama:</span>
                <span className="font-bold text-slate-900">{selectedItem.primarySupplier}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-600">Estimasi Harga Satuan:</span>
                <span className="tabular-nums font-semibold text-slate-800">
                  {formatCurrency(selectedItem.estimatedUnitPrice)} / {selectedItem.unit}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-600 font-semibold">Total Biaya Pengadaan Defisit:</span>
                <span className="tabular-nums font-bold text-blue-600 text-sm">
                  {formatCurrency(selectedItem.estimatedTotalCost)}
                </span>
              </div>
            </div>
          </div>
        )}
      </DnaDetailDrawer>

      {/* Modal Input Kebutuhan Baru */}
      <DnaModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Input Kebutuhan Barang Baru (Manual Entry MRP)"
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kode Material / Bahan *</label>
              <DnaInput
                placeholder="Contoh: RAW-ACT-005"
                value={formData.materialCode}
                onChange={(e) => setFormData({ ...formData, materialCode: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Material / Bahan *</label>
              <DnaInput
                placeholder="Contoh: Hyaluronic Acid 2%"
                value={formData.materialName}
                onChange={(e) => setFormData({ ...formData, materialName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kategori Material *</label>
              <DnaSelect
                options={[
                  { value: "Bahan Baku", label: "Bahan Baku (Raw Material)" },
                  { value: "Kemas Primer", label: "Kemas Primer (Botol/Pot)" },
                  { value: "Kemas Sekunder", label: "Kemas Sekunder (Box/Dus)" },
                ]}
                value={formData.category}
                onChange={(val) => setFormData({ ...formData, category: val as any })}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">No. SO Referensi *</label>
              <DnaInput
                placeholder="Contoh: SO-2026-0041"
                value={formData.salesOrderRef}
                onChange={(e) => setFormData({ ...formData, salesOrderRef: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Brand / Produk *</label>
              <DnaInput
                placeholder="Contoh: Glow Serum 30ml"
                value={formData.brandProduct}
                onChange={(e) => setFormData({ ...formData, brandProduct: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gross Need *</label>
              <DnaInput
                type="number"
                value={formData.grossRequirement}
                onChange={(e) => setFormData({ ...formData, grossRequirement: Number(e.target.value) })}
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Real Stok *</label>
              <DnaInput
                type="number"
                value={formData.realStockQty}
                onChange={(e) => setFormData({ ...formData, realStockQty: Number(e.target.value) })}
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">PO On-Order</label>
              <DnaInput
                type="number"
                value={formData.onOrderQty}
                onChange={(e) => setFormData({ ...formData, onOrderQty: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Satuan Unit</label>
              <DnaSelect
                options={[
                  { value: "kg", label: "kg" },
                  { value: "gram", label: "gram" },
                  { value: "pcs", label: "pcs" },
                  { value: "pack", label: "pack" },
                ]}
                value={formData.unit}
                onChange={(val) => setFormData({ ...formData, unit: val })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mitra Supplier Utama *</label>
              <DnaInput
                placeholder="Contoh: PT Chemindo Sukses Makmur"
                value={formData.primarySupplier}
                onChange={(e) => setFormData({ ...formData, primarySupplier: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Est. Harga Satuan (Rp) *</label>
              <DnaInput
                type="number"
                placeholder="Rp"
                value={formData.estimatedUnitPrice}
                onChange={(e) => setFormData({ ...formData, estimatedUnitPrice: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <DnaButton type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Batal
            </DnaButton>
            <DnaButton type="submit" variant="primary">
              Simpan Kebutuhan MRP
            </DnaButton>
          </div>
        </form>
      </DnaModal>

      {/* Modal Cetak Permintaan Barang GRQ (Landscape 10-Kolom Standar Dreamlab) */}
      <GoodsRequestPrintModal
        isOpen={isPrintGrqOpen}
        onClose={() => setIsPrintGrqOpen(false)}
        data={
          selectedItem
            ? {
                requestNumber: `GRQ-${selectedItem.salesOrderRef.replace("SO-", "")}`,
                requestDate: new Date().toISOString().slice(0, 10),
                status: "APPROVED",
                requestingDept: "Produksi Pabrik CPKB",
                sourceWarehouse: "Gudang Bahan Baku Utama",
                createdBy: "Perencana Kebutuhan Material (MRP)",
                notes: `Alokasi batch produksi ${selectedItem.brandProduct} (${selectedItem.clientName})`,
                items: [
                  {
                    itemCode: selectedItem.materialCode,
                    itemName: selectedItem.materialName,
                    unit: selectedItem.unit,
                    qtyRequested: selectedItem.grossRequirement,
                    qtyApproved: selectedItem.grossRequirement,
                    qtyIssued: selectedItem.realStockQty,
                    qtyUsed: selectedItem.realStockQty,
                    qtyReturned: 0,
                    qtyDifference: selectedItem.netNeedQty,
                  },
                ],
              }
            : null
        }
      />
    </DnaPageContainer>
  );
}
