"use client";

import React, { useState, useMemo } from "react";
import {
  CircleDollarSign,
  Search,
  Warehouse,
  Download,
  Boxes,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  useDnaToast,
} from "@/components/dna";
import { formatCurrency } from "@/lib/utils";

interface ValuationRecord {
  id: string;
  code: string;
  name: string;
  category: string;
  warehouse: string;
  physicalQty: number;
  unit: string;
  avgHpp: number;
  totalValuation: number;
  coaAccount: string;
}

const INITIAL_VALUATIONS: ValuationRecord[] = [
  {
    id: "VAL-001",
    code: "BBK-0001",
    name: "Hairdensyl Complex",
    category: "Bahan Baku",
    warehouse: "Gudang Bahan Baku",
    physicalQty: 498,
    unit: "gr",
    avgHpp: 85000,
    totalValuation: 42330000,
    coaAccount: "1410 - Persediaan Bahan Baku"
  },
  {
    id: "VAL-002",
    code: "BBK-0002",
    name: "Niacinamide PC Grade",
    category: "Bahan Baku",
    warehouse: "Gudang Bahan Baku",
    physicalQty: 250,
    unit: "gr",
    avgHpp: 45000,
    totalValuation: 11250000,
    coaAccount: "1410 - Persediaan Bahan Baku"
  },
  {
    id: "VAL-003",
    code: "BBK-0003",
    name: "IPM (Isopropyl Myristate)",
    category: "Bahan Baku",
    warehouse: "Gudang Bahan Baku",
    physicalQty: 300,
    unit: "gr",
    avgHpp: 28000,
    totalValuation: 8400000,
    coaAccount: "1410 - Persediaan Bahan Baku"
  },
  {
    id: "VAL-004",
    code: "KPR-0001",
    name: "Botol Dropper Amber 20ml",
    category: "Kemasan Primer",
    warehouse: "Gudang Kemasan",
    physicalQty: 10000,
    unit: "pcs",
    avgHpp: 3200,
    totalValuation: 32000000,
    coaAccount: "1420 - Persediaan Bahan Kemas"
  },
  {
    id: "VAL-005",
    code: "KSR-0001",
    name: "Dus Inner Box Serum Day",
    category: "Kemasan Sekunder",
    warehouse: "Gudang Kemasan",
    physicalQty: 1200,
    unit: "pcs",
    avgHpp: 1500,
    totalValuation: 1800000,
    coaAccount: "1420 - Persediaan Bahan Kemas"
  },
  {
    id: "VAL-006",
    code: "BJD-0001",
    name: "Day Cream SPF 30 (Farah Derma)",
    category: "Barang Jadi",
    warehouse: "Gudang Barang Jadi",
    physicalQty: 3000,
    unit: "pcs",
    avgHpp: 28000,
    totalValuation: 84000000,
    coaAccount: "1430 - Persediaan Barang Jadi"
  },
  {
    id: "VAL-007",
    code: "BJD-0002",
    name: "Facial Foam Charcoal 100ml (K-Skin)",
    category: "Barang Jadi",
    warehouse: "Gudang Surabaya",
    physicalQty: 5000,
    unit: "pcs",
    avgHpp: 25000,
    totalValuation: 125000000,
    coaAccount: "1430 - Persediaan Barang Jadi"
  }
];

export default function ReportStockValuationPage() {
  const { toast } = useDnaToast();
  const [valuations] = useState<ValuationRecord[]>(INITIAL_VALUATIONS);
  const [searchTerm, setSearchTerm] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const filteredData = useMemo(() => {
    return valuations.filter(item => {
      const matchSearch =
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.coaAccount.toLowerCase().includes(searchTerm.toLowerCase());
      const matchWh = warehouseFilter === "ALL" || item.warehouse === warehouseFilter;
      const matchCat = categoryFilter === "ALL" || item.category === categoryFilter;
      return matchSearch && matchWh && matchCat;
    });
  }, [valuations, searchTerm, warehouseFilter, categoryFilter]);

  const totalValuation = filteredData.reduce((sum, v) => sum + v.totalValuation, 0);
  const totalPhysicalItems = filteredData.reduce((sum, v) => sum + v.physicalQty, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <DnaPageHeader
        title="Laporan Valuasi Persediaan (Stock Valuation)"
        description="Analisis nilai moneter kapital persediaan aktif berdasarkan metode biaya rata-rata bergerak (Moving Average Cost HPP)"
        actions={
          <DnaButton
            variant="outline"
            icon={<Download className="h-4 w-4" />}
            onClick={() => {
              toast({
                title: "Ekspor Valuasi Stok",
                description: "Mengunduh file Excel Laporan Valuasi Persediaan...",
                variant: "success"
              });
            }}
          >
            Ekspor Excel
          </DnaButton>
        }
      />

      {/* KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          title="Total Nilai Persediaan (Asset)"
          value={formatCurrency(totalValuation)}
          icon={CircleDollarSign}
          variant="default"
          subtext="Total aset persediaan di neraca"
        />
        <DnaStatCard
          title="Total Kuantitas Fisik"
          value={totalPhysicalItems.toLocaleString("id-ID")}
          icon={Boxes}
          variant="success"
          subtext="Akumulasi seluruh lot material & produk"
        />
        <DnaStatCard
          title="Metode Kalkulasi HPP"
          value="Moving Average"
          icon={TrendingUp}
          variant="info"
          subtext="Sinkron dengan akun Buku Besar CoA"
        />
        <DnaStatCard
          title="Kesesuaian Neraca Keuangan"
          value="100% Balanced"
          icon={ShieldCheck}
          variant="default"
          subtext="Rekonsiliasi GL & inventory balance"
        />
      </DnaKpiGrid>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode, nama barang, akun CoA..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Semua Gudang</option>
            <option value="Gudang Bahan Baku">Gudang Bahan Baku</option>
            <option value="Gudang Kemasan">Gudang Kemasan</option>
            <option value="Gudang Barang Jadi">Gudang Barang Jadi</option>
            <option value="Gudang Surabaya">Gudang Surabaya</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="Bahan Baku">Bahan Baku</option>
            <option value="Kemasan Primer">Kemasan Primer</option>
            <option value="Kemasan Sekunder">Kemasan Sekunder</option>
            <option value="Barang Jadi">Barang Jadi</option>
          </select>
        </div>
      </div>

      {/* 1:1 Table (Exactly 9 columns matching legacy G-SERP) */}
      <DnaDataTableCard title="Daftar Valuasi Nilai Persediaan">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Kode Barang</th>
                <th className="py-3 px-4">Nama Barang</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-right">Qty Fisik</th>
                <th className="py-3 px-4 text-center">Satuan</th>
                <th className="py-3 px-4 text-right">HPP Satuan (Rp)</th>
                <th className="py-3 px-4 text-right">Total Nilai (Rp)</th>
                <th className="py-3 px-4">Akun Persediaan (CoA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada data valuasi persediaan sesuai filter
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-semibold text-blue-600">{item.code}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{item.name}</td>
                    <td className="py-3 px-4 text-slate-600">{item.category}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {item.physicalQty.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600 uppercase font-medium">{item.unit}</td>
                    <td className="py-3 px-4 text-right text-slate-700 font-medium">
                      {formatCurrency(item.avgHpp)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">
                      {formatCurrency(item.totalValuation)}
                    </td>
                    <td className="py-3 px-4 text-blue-600 font-medium">{item.coaAccount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>
    </div>
  );
}
