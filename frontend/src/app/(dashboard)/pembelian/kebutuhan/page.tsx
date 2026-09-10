"use client";

/**
 * Kebutuhan Barang (Material Requirements Planning / MRP)
 * Screen ID: SCR-035 & SCR-036
 *
 * Sesuai Spesifikasi:
 * - Visual DNA Design System (DnaPageHeader, DnaKpiGrid, DnaDataTableCard, DnaModal, DnaCell, useDnaToast)
 * - Kalkulasi MRP Otomatis: Kebutuhan Bersih (Net Need) = Gross - Real Stok Gudang - PO On-Order
 * - Pemisahan Bahan Baku (Formula BOM) dan Bahan Kemas (Primer/Sekunder) per SO Maklon
 * - Aksi instan penerbitan Draft PO / PR untuk item dengan status defisit
 */

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Layers,
  Search,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Package,
  ShoppingCart,
  DollarSign,
  Eye,
  FileSpreadsheet,
  ArrowRight,
  Filter,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaButton,
  DnaInput,
  DnaSelect,
  DnaModal,
  DnaCell,
  useDnaToast,
} from "@/components/dna";
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

const INITIAL_MRP_DATA: MrpItemRecord[] = [
  {
    id: "mrp-1",
    materialCode: "RAW-ACT-001",
    materialName: "Niacinamide PC Grade (DSM)",
    category: "Bahan Baku",
    salesOrderRef: "SO-2026-001",
    clientName: "PT Cantika Jelita",
    brandProduct: "C-Jelita Serum 10%",
    grossRequirement: 50,
    realStockQty: 10,
    onOrderQty: 0,
    netNeedQty: 40,
    unit: "kg",
    primarySupplier: "PT Chemindo Natural Indonesia",
    estimatedUnitPrice: 350000,
    estimatedTotalCost: 14000000,
    status: "DEFICIT",
  },
  {
    id: "mrp-2",
    materialCode: "KEM-BOT-012",
    materialName: "Botol Dropper 30ml Frosted Amber",
    category: "Kemas Primer",
    salesOrderRef: "SO-2026-001",
    clientName: "PT Cantika Jelita",
    brandProduct: "C-Jelita Serum 10%",
    grossRequirement: 10000,
    realStockQty: 2000,
    onOrderQty: 8000,
    netNeedQty: 0,
    unit: "pcs",
    primarySupplier: "CV Packaging Primatama",
    estimatedUnitPrice: 4500,
    estimatedTotalCost: 0,
    status: "SAFE_STOCK",
  },
  {
    id: "mrp-3",
    materialCode: "RAW-EXT-004",
    materialName: "Centella Asiatica Extract 10:1",
    category: "Bahan Baku",
    salesOrderRef: "SO-2026-003",
    clientName: "CV Aura Natural",
    brandProduct: "AuraGlow Moisturizer Gel",
    grossRequirement: 35,
    realStockQty: 5,
    onOrderQty: 10,
    netNeedQty: 20,
    unit: "kg",
    primarySupplier: "PT Chemindo Natural Indonesia",
    estimatedUnitPrice: 450000,
    estimatedTotalCost: 9000000,
    status: "DEFICIT",
  },
  {
    id: "mrp-4",
    materialCode: "KEM-JAR-005",
    materialName: "Pot Cream Acrylic 50g Double Wall",
    category: "Kemas Primer",
    salesOrderRef: "SO-2026-003",
    clientName: "CV Aura Natural",
    brandProduct: "AuraGlow Moisturizer Gel",
    grossRequirement: 5000,
    realStockQty: 5200,
    onOrderQty: 0,
    netNeedQty: 0,
    unit: "pcs",
    primarySupplier: "CV Packaging Primatama",
    estimatedUnitPrice: 6200,
    estimatedTotalCost: 0,
    status: "SAFE_STOCK",
  },
  {
    id: "mrp-5",
    materialCode: "KEM-BOX-008",
    materialName: "Inner Box Hologram Ivory 350gsm",
    category: "Kemas Sekunder",
    salesOrderRef: "SO-2026-004",
    clientName: "PT Derma Estetika",
    brandProduct: "DermaGleam Sunscreen",
    grossRequirement: 15000,
    realStockQty: 0,
    onOrderQty: 5000,
    netNeedQty: 10000,
    unit: "pcs",
    primarySupplier: "PT Multi Bintang Printing",
    estimatedUnitPrice: 2300,
    estimatedTotalCost: 23000000,
    status: "DEFICIT",
  },
];

export default function KebutuhanBarangMRPPage() {
  const router = useRouter();
  const toast = useDnaToast();
  const [mrpList, setMrpList] = useState<MrpItemRecord[]>(INITIAL_MRP_DATA);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<MrpItemRecord | null>(null);

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
    <div className="min-h-screen bg-[#F8FAFC] pb-20 text-slate-900 font-sans">
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <DnaPageHeader
          title="Kebutuhan Barang (Material Requirements Planning / MRP)"
          description="Kalkulasi Otomatis Defisit Bahan Baku Formula & Kemasan Berdasarkan Sales Order Aktif Pabrik (Gross vs Real Stok Gudang vs PO On-Order)"
          tabs={[
            { key: "all", label: "Semua Kebutuhan MRP", count: mrpList.length },
            { key: "deficit", label: "Defisit (Perlu PO)", count: deficitItems.length },
            { key: "safe", label: "Stok Aman (Siap Produksi)", count: safeItemsCount },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          actions={
            <DnaButton
              variant="primary"
              icon={<ShoppingCart className="w-4 h-4" />}
              onClick={() => {
                toast.success("Batch PO Ready", "Semua item defisit siap diterbitkan PO massal.");
                router.push("/scm/pembelian/create");
              }}
            >
              + Terbitkan PO dari Defisit MRP
            </DnaButton>
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

        {/* Search Toolbar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="w-80">
            <DnaInput
              placeholder="Cari kode bahan, SO ref, nama supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
          <div className="text-xs font-bold text-slate-500">
            Menampilkan <span className="text-slate-900 font-bold">{filteredList.length}</span> dari {mrpList.length} Item MRP
          </div>
        </div>

        {/* MRP Data Table */}
        <DnaDataTableCard
          title="Tabel Analisis Kebutuhan Bersih Material (MRP Engine)"
          count={filteredList.length}
          description="Rumus: Kebutuhan Bersih (Net Need) = Kebutuhan Gross SO - Real Stok Gudang - PO Sedang Berjalan."
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold uppercase tracking-wider select-none whitespace-nowrap text-[10px]">
                  <th className="py-3 px-3 w-8 text-center">#</th>
                  <th className="py-3 px-3">KODE BAHAN</th>
                  <th className="py-3 px-3">NAMA BAHAN / KEMASAN</th>
                  <th className="py-3 px-3">KATEGORI</th>
                  <th className="py-3 px-3">SO REFERENSI</th>
                  <th className="py-3 px-2 text-right">GROSS NEED</th>
                  <th className="py-3 px-2 text-right text-emerald-700 bg-emerald-50/50">REAL STOK</th>
                  <th className="py-3 px-2 text-right text-blue-700 bg-blue-50/50">ON-ORDER</th>
                  <th className="py-3 px-3 text-right font-black text-rose-600 bg-rose-50/60">NET DEFISIT</th>
                  <th className="py-3 px-3">SUPPLIER UTAMA</th>
                  <th className="py-3 px-3 text-right">EST. BIAYA PO</th>
                  <th className="py-3 px-3 text-center">STATUS</th>
                  <th className="py-3 px-3 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="text-center py-12 text-slate-400">
                      Tidak ada data kebutuhan barang pada filter ini.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item, idx) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="hover:bg-slate-50/90 transition-colors cursor-pointer"
                    >
                      <td className="py-2.5 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-600 whitespace-nowrap">
                        {item.materialCode}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                        {item.materialName}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-slate-800">{item.salesOrderRef}</span>
                        <p className="text-[9px] text-slate-400">{item.clientName}</p>
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold text-slate-700 whitespace-nowrap">
                        {item.grossRequirement} {item.unit}
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold text-emerald-700 bg-emerald-50/30 whitespace-nowrap">
                        {item.realStockQty} {item.unit}
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold text-blue-700 bg-blue-50/30 whitespace-nowrap">
                        {item.onOrderQty} {item.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-rose-600 bg-rose-50/40 whitespace-nowrap font-mono text-xs">
                        {item.netNeedQty > 0 ? `${item.netNeedQty} ${item.unit}` : "0 (Aman)"}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-700">
                        {item.primarySupplier}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                        {item.netNeedQty > 0 ? formatCurrency(item.estimatedTotalCost) : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            item.status === "SAFE_STOCK"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : "bg-rose-100 text-rose-800 border-rose-300"
                          }`}
                        >
                          {item.status === "SAFE_STOCK" ? "STOK AMAN" : "DEFISIT PO"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          {item.netNeedQty > 0 && (
                            <DnaButton
                              size="sm"
                              variant="primary"
                              onClick={() => handleGeneratePo(item)}
                              className="text-[10px] h-7 px-2 bg-blue-600"
                            >
                              + Buat PO
                            </DnaButton>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedItem(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Lihat Detail Formula MRP"
                          >
                            <Eye className="w-3.5 h-3.5" />
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
      </div>

      {/* Modal Detail Item MRP */}
      <DnaModal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title="Detail Analisis Kebutuhan MRP"
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-5 text-sm">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  {selectedItem.materialCode}
                </span>
                <h3 className="text-base font-bold text-slate-900">{selectedItem.materialName}</h3>
                <p className="text-xs text-slate-500">
                  Untuk SO: <span className="font-semibold text-slate-700">{selectedItem.salesOrderRef}</span> • Produk:{" "}
                  <span className="font-semibold text-slate-700">{selectedItem.brandProduct}</span>
                </p>
              </div>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  selectedItem.status === "SAFE_STOCK"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : "bg-rose-100 text-rose-800 border-rose-300"
                }`}
              >
                {selectedItem.status === "SAFE_STOCK" ? "Kebutuhan Terpenuhi" : "Perlu Pengadaan"}
              </span>
            </div>

            {/* Matrix Perhitungan MRP */}
            <div className="grid grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block mb-0.5">Kebutuhan Gross SO</span>
                <span className="font-bold text-slate-900 text-sm">
                  {selectedItem.grossRequirement} {selectedItem.unit}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block mb-0.5">Real Stok Gudang</span>
                <span className="font-bold text-emerald-700 text-sm">
                  {selectedItem.realStockQty} {selectedItem.unit}
                </span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block mb-0.5">PO Sedang Dikirim</span>
                <span className="font-bold text-blue-700 text-sm">
                  {selectedItem.onOrderQty} {selectedItem.unit}
                </span>
              </div>
              <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-200">
                <span className="text-rose-600 block mb-0.5 font-bold">Kekurangan (Defisit PO)</span>
                <span className="font-black text-rose-700 text-sm">
                  {selectedItem.netNeedQty} {selectedItem.unit}
                </span>
              </div>
            </div>

            {/* Rekomendasi Pengadaan Supplier */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">
                Rekomendasi Mitra Supplier & Estimasi Biaya
              </span>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-600">Supplier Utama:</span>
                <span className="font-bold text-slate-900">{selectedItem.primarySupplier}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-600">Estimasi Harga Satuan:</span>
                <span className="font-mono text-slate-800">{formatCurrency(selectedItem.estimatedUnitPrice)} / {selectedItem.unit}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-600 font-semibold">Total Biaya Pengadaan Defisit:</span>
                <span className="font-mono font-black text-blue-600 text-sm">{formatCurrency(selectedItem.estimatedTotalCost)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <DnaButton variant="secondary" onClick={() => setSelectedItem(null)}>
                Tutup
              </DnaButton>
              {selectedItem.netNeedQty > 0 && (
                <DnaButton variant="primary" onClick={() => handleGeneratePo(selectedItem)}>
                  Lanjut Buat Purchase Order
                </DnaButton>
              )}
            </div>
          </div>
        )}
      </DnaModal>
    </div>
  );
}
