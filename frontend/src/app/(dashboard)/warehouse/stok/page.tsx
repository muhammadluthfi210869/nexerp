"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Package,
  Layers,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  Search,
  Filter,
  DollarSign,
  Eye,
  CheckCircle2
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  formatRupiah,
  useDnaToast
} from "@/components/dna";

interface InventoryItem {
  id: string;
  code: string;
  name: string;
  category: "RAW" | "PACKAGING" | "WIP" | "FINISHED";
  unit: string;
  qtyOnHand: number;
  minQty: number;
  unitCost: number;
  totalValuation: number;
  warehouseLocation: string;
  status: "SAFE" | "LOW" | "OUT";
}

const FALLBACK_INVENTORY: InventoryItem[] = [
  { id: "1", code: "RAW-NIC-01", name: "Niacinamide Pure Grade 99.8%", category: "RAW", unit: "Kg", qtyOnHand: 250, minQty: 50, unitCost: 450000, totalValuation: 112500000, warehouseLocation: "Gudang Bahan Baku - Rak A1", status: "SAFE" },
  { id: "2", code: "RAW-HYA-02", name: "Hyaluronic Acid Multi-Molecular", category: "RAW", unit: "Kg", qtyOnHand: 15, minQty: 25, unitCost: 3200000, totalValuation: 48000000, warehouseLocation: "Gudang Suhu Terkontrol - Chiller B", status: "LOW" },
  { id: "3", code: "PCK-BOT-30", name: "Botol Kaca Serum 30ml Amber + Pipet", category: "PACKAGING", unit: "Pcs", qtyOnHand: 15000, minQty: 5000, unitCost: 3500, totalValuation: 52500000, warehouseLocation: "Gudang Kemasan - Pallet C3", status: "SAFE" },
  { id: "4", code: "PCK-BOX-01", name: "Folding Inner Box Holographic UV", category: "PACKAGING", unit: "Pcs", qtyOnHand: 2200, minQty: 5000, unitCost: 1800, totalValuation: 3960000, warehouseLocation: "Gudang Kemasan - Rak D1", status: "LOW" },
  { id: "5", code: "FG-SRM-001", name: "Brightening Glow Serum 30ml (Selesai QC)", category: "FINISHED", unit: "Pcs", qtyOnHand: 4800, minQty: 1000, unitCost: 28500, totalValuation: 136800000, warehouseLocation: "Gudang Barang Jadi - Karantina Rilis", status: "SAFE" },
];

export default function WarehouseStockReportPage() {
  const toast = useDnaToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const totalValuation = FALLBACK_INVENTORY.reduce((acc, r) => acc + r.totalValuation, 0);
  const totalItems = FALLBACK_INVENTORY.length;
  const lowStockCount = FALLBACK_INVENTORY.filter((r) => r.status === "LOW" || r.status === "OUT").length;

  const filteredItems = FALLBACK_INVENTORY.filter((item) => {
    const matchSearch = item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = categoryFilter === "ALL" || item.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Laporan Stok & Valuasi Persediaan (Inventory Valuation)"
        description="Laporan kuantitas on-hand, safety stock threshold, lokasi gudang, dan total nilai valuasi aset bahan baku & produk."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 font-semibold">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Valuasi Stok: {formatRupiah(totalValuation)}</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" size="md" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={() => toast.success("Exporting Laporan Stok ke Excel...")}>
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Export Excel
            </DnaButton>
          </div>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Valuasi Persediaan"
          value={formatRupiah(totalValuation)}
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "Asset Value", isPositive: true }}
          subtext="Metode FIFO Standard Cost"
          variant="success"
        />
        <DnaStatCard
          label="Total Item Terdaftar"
          value={`${totalItems} SKU`}
          icon={<Package className="w-5 h-5 text-blue-600" />}
          subtext="Bahan Baku, Kemas & FG"
          variant="info"
        />
        <DnaStatCard
          label="Stok di Bawah Batas Minimum"
          value={`${lowStockCount} SKU`}
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
          delta={{ value: "Perlu Reorder (PO)", isPositive: false }}
          subtext="Segera Buat Permintaan PR"
          variant="warning"
        />
        <DnaStatCard
          label="Akurasi Stok Opname"
          value="99.4%"
          icon={<CheckCircle2 className="w-5 h-5 text-purple-600" />}
          delta={{ value: "Sangat Akurat", isPositive: true }}
          subtext="Audit Siklus Terakhir"
          variant="purple"
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        title="Daftar Valuasi & Posisi Fisik Stok Gudang"
        badge={<DnaBadge variant="default">{filteredItems.length} Item</DnaBadge>}
        customToolbar={
          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="RAW">Bahan Baku (Raw)</option>
              <option value="PACKAGING">Bahan Kemas (Packaging)</option>
              <option value="FINISHED">Barang Jadi (Finished)</option>
            </select>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari SKU / nama barang..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-3.5 py-3">Kode SKU</th>
                <th className="px-3.5 py-3">Nama Bahan / Produk</th>
                <th className="px-3.5 py-3">Kategori</th>
                <th className="px-3.5 py-3 text-right">Stok Fisik</th>
                <th className="px-3.5 py-3 text-right">Min Qty</th>
                <th className="px-3.5 py-3 text-right">Harga Satuan (FIFO)</th>
                <th className="px-3.5 py-3 text-right">Total Valuasi</th>
                <th className="px-3.5 py-3">Lokasi Gudang</th>
                <th className="px-3.5 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3.5 py-2.5 font-mono text-blue-700 font-bold">{item.code}</td>
                  <td className="px-3.5 py-2.5 font-semibold text-slate-900">{item.name}</td>
                  <td className="px-3.5 py-2.5">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-600">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-slate-900">
                    {item.qtyOnHand.toLocaleString()} {item.unit}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-medium text-slate-500">
                    {item.minQty.toLocaleString()} {item.unit}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-medium text-slate-700">
                    {formatRupiah(item.unitCost)}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-extrabold text-emerald-700">
                    {formatRupiah(item.totalValuation)}
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-600 text-[11px]">{item.warehouseLocation}</td>
                  <td className="px-3.5 py-2.5 text-center">
                    <DnaBadge variant={item.status === "SAFE" ? "success" : "warning"}>
                      {item.status === "SAFE" ? "Aman" : "Low Stock"}
                    </DnaBadge>
                  </td>
                </tr>
              ))}
              <tr className="bg-emerald-50/75 font-black border-t-2 border-emerald-300">
                <td colSpan={6} className="px-3.5 py-3 text-emerald-950 font-black text-right">TOTAL NILAI VALUASI STOK:</td>
                <td className="px-3.5 py-3 text-right text-emerald-950 font-black text-sm">{formatRupiah(totalValuation)}</td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>
    </DnaPageContainer>
  );
}
