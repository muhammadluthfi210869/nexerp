"use client";

import React, { useState, useMemo } from "react";
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
  CheckCircle2,
  Building2
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaSelect,
  DnaTable,
  DnaInput,
  formatRupiah,
  useDnaToast
} from "@/components/dna";

interface StockItem {
  id: string;
  itemCode: string;
  itemName: string;
  category: "Bahan Baku" | "Bahan Kemas" | "Barang Jadi";
  warehouse: string;
  rackLocation: string;
  unit: string;
  qtyOnHand: number;
  safetyStock: number;
  fifoUnitCost: number;
  totalValuation: number;
  status: "AMAN" | "LOW_STOCK" | "OUT_OF_STOCK";
}

const FALLBACK_STOCKS: StockItem[] = [
  { id: "1", itemCode: "RAW-NIC-01", itemName: "Niacinamide Pure Grade 99.8%", category: "Bahan Baku", warehouse: "Gudang Bahan Baku CPKB", rackLocation: "Rak A1-02", unit: "Kg", qtyOnHand: 250, safetyStock: 50, fifoUnitCost: 450000, totalValuation: 112500000, status: "AMAN" },
  { id: "2", itemCode: "RAW-HYA-02", itemName: "Hyaluronic Acid Multi-Molecular", category: "Bahan Baku", warehouse: "Gudang Suhu Dingin", rackLocation: "Chiller B-01", unit: "Kg", qtyOnHand: 15, safetyStock: 25, fifoUnitCost: 3200000, totalValuation: 48000000, status: "LOW_STOCK" },
  { id: "3", itemCode: "PCK-BOT-30", itemName: "Botol Kaca Serum 30ml Amber + Pipet", category: "Bahan Kemas", warehouse: "Gudang Kemasan", rackLocation: "Pallet C3", unit: "Pcs", qtyOnHand: 15000, safetyStock: 5000, fifoUnitCost: 3500, totalValuation: 52500000, status: "AMAN" },
  { id: "4", itemCode: "FG-SRM-001", itemName: "Brightening Glow Serum 30ml (Selesai QC)", category: "Barang Jadi", warehouse: "Gudang Barang Jadi", rackLocation: "Karantina Rilis D", unit: "Pcs", qtyOnHand: 4800, safetyStock: 1000, fifoUnitCost: 28500, totalValuation: 136800000, status: "AMAN" },
];

export default function WarehouseStockReportPage() {
  const toast = useDnaToast();
  const [warehouseFilter, setWarehouseFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const totalValuation = useMemo(() => FALLBACK_STOCKS.reduce((acc, r) => acc + r.totalValuation, 0), []);
  const totalPhysicalQty = useMemo(() => FALLBACK_STOCKS.reduce((acc, r) => acc + r.qtyOnHand, 0), []);
  const lowStockCount = useMemo(() => FALLBACK_STOCKS.filter((r) => r.status === "LOW_STOCK").length, []);

  const filteredStocks = useMemo(() => {
    return FALLBACK_STOCKS.filter((item) => {
      const matchSearch =
        item.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.rackLocation.toLowerCase().includes(searchQuery.toLowerCase());
      const matchWh = warehouseFilter === "ALL" || item.warehouse === warehouseFilter;
      const matchCat = categoryFilter === "ALL" || item.category === categoryFilter;
      return matchSearch && matchWh && matchCat;
    });
  }, [searchQuery, warehouseFilter, categoryFilter]);

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Laporan Stok & Valuasi Persediaan (Inventory Valuation)"
        description="Monitoring kuantitas fisik on-hand, lokasi rak gudang, safety stock threshold, dan valuasi persediaan metode FIFO."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 font-semibold">
            <Package className="w-3.5 h-3.5" />
            <span>Spesifikasi SCR-168 & SCR-169: Multi-Warehouse Valuation</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" size="md" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Laporan Stok
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={() => toast.success("Exporting Stok Persediaan ke Excel...")}>
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Export Excel
            </DnaButton>
          </div>
        }
      />

      {/* KPI CARDS PERSIS SCR-168/169 */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Nilai Valuasi FIFO"
          value={formatRupiah(totalValuation)}
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "Metode FIFO Standar", isPositive: true }}
          subtext="Total Nilai Aset Bahan & Produk"
          variant="success"
        />
        <DnaStatCard
          label="Total SKU Terdaftar"
          value={`${FALLBACK_STOCKS.length} SKU`}
          icon={<Package className="w-5 h-5 text-blue-600" />}
          subtext="Bahan Baku, Kemas & FG"
          variant="info"
        />
        <DnaStatCard
          label="Total Kuantitas Fisik"
          value={`${totalPhysicalQty.toLocaleString()} Unit`}
          icon={<Layers className="w-5 h-5 text-purple-600" />}
          subtext="Akumulasi Stok Seluruh Gudang"
          variant="purple"
        />
        <DnaStatCard
          label="Stok di Bawah Batas Minimum"
          value={`${lowStockCount} SKU`}
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
          delta={{ value: "Reorder Required", isPositive: false }}
          subtext="Segera Buat Permintaan PR"
          variant="warning"
        />
      </DnaKpiGrid>

      {/* TABLE LIST FORMAT PERSIS SCR-168/169 */}
      <DnaDataTableCard
        title="Daftar Posisi Fisik & Valuasi Stok Gudang"
        badge={<DnaBadge variant="default">{filteredStocks.length} Item</DnaBadge>}
        customToolbar={
          <div className="flex flex-wrap items-center gap-2.5">
<DnaSelect 
              value={warehouseFilter}
              onChange={setWarehouseFilter}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-medium"
            >
              <option value="ALL">Gudang: * (Semua Gudang)</option>
              <option value="Gudang Bahan Baku CPKB">Gudang Bahan Baku CPKB</option>
              <option value="Gudang Suhu Dingin">Gudang Suhu Dingin (Chiller)</option>
              <option value="Gudang Kemasan">Gudang Kemasan</option>
              <option value="Gudang Barang Jadi">Gudang Barang Jadi</option>
            </DnaSelect>
<DnaSelect 
              value={categoryFilter}
              onChange={setCategoryFilter}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-medium"
            >
              <option value="ALL">Tampilkan: Semua Kategori</option>
              <option value="Bahan Baku">Bahan Baku (Raw)</option>
              <option value="Bahan Kemas">Bahan Kemas (Packaging)</option>
              <option value="Barang Jadi">Barang Jadi (Finished Goods)</option>
            </DnaSelect>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <DnaInput
                type="text"
                placeholder="Cari SKU / nama / rak..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-52 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <DnaTable className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-3.5 py-3">Kode Barang</th>
                <th className="px-3.5 py-3">Nama Barang</th>
                <th className="px-3.5 py-3">Kategori</th>
                <th className="px-3.5 py-3">Gudang & Lokasi Rak</th>
                <th className="px-3.5 py-3 text-right">Stok Fisik</th>
                <th className="px-3.5 py-3 text-right">Safety Stock</th>
                <th className="px-3.5 py-3 text-right">Harga FIFO (Rp)</th>
                <th className="px-3.5 py-3 text-right">Total Valuasi (Rp)</th>
                <th className="px-3.5 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStocks.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3.5 py-2.5 font-mono text-blue-700 font-bold">{item.itemCode}</td>
                  <td className="px-3.5 py-2.5 font-semibold text-slate-900">{item.itemName}</td>
                  <td className="px-3.5 py-2.5">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-600 text-[11px]">
                    <div>{item.warehouse}</div>
                    <span className="font-mono text-slate-400 font-bold">{item.rackLocation}</span>
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-slate-900">
                    {item.qtyOnHand.toLocaleString()} {item.unit}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-medium text-slate-500">
                    {item.safetyStock.toLocaleString()} {item.unit}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-medium text-slate-700">{formatRupiah(item.fifoUnitCost)}</td>
                  <td className="px-3.5 py-2.5 text-right font-extrabold text-emerald-700">{formatRupiah(item.totalValuation)}</td>
                  <td className="px-3.5 py-2.5 text-center">
                    <DnaBadge variant={item.status === "AMAN" ? "success" : "warning"}>
                      {item.status === "AMAN" ? "Aman" : "Low Stock"}
                    </DnaBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </DnaTable>
        </div>
      </DnaDataTableCard>
    </DnaPageContainer>
  );
}
