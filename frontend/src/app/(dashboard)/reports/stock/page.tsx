"use client";

import React, { useState, useMemo } from "react";
import {
  Boxes,
  Search,
  Warehouse,
  Download,
  Filter,
  PackageCheck,
  AlertTriangle,
  Gift,
  Eye,
} from "lucide-react";
import {
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  useDnaToast,
} from "@/components/dna";
import { formatCurrency } from "@/lib/utils";

interface StockRecord {
  id: string;
  code: string;
  name: string;
  category: string;
  warehouse: string;
  goodQty: number;
  rejectQty: number;
  totalQty: number;
  unit: string;
  minStock: number;
  status: "NORMAL" | "LOW_STOCK" | "OVERSTOCK";
}

const INITIAL_STOCKS: StockRecord[] = [
  {
    id: "STK-001",
    code: "BBK-0001",
    name: "Hairdensyl Complex",
    category: "Bahan Baku",
    warehouse: "Gudang Bahan Baku",
    goodQty: 498,
    rejectQty: 0,
    totalQty: 498,
    unit: "gr",
    minStock: 100,
    status: "NORMAL"
  },
  {
    id: "STK-002",
    code: "BBK-0002",
    name: "Niacinamide PC Grade",
    category: "Bahan Baku",
    warehouse: "Gudang Bahan Baku",
    goodQty: 248,
    rejectQty: 2,
    totalQty: 250,
    unit: "gr",
    minStock: 300,
    status: "LOW_STOCK"
  },
  {
    id: "STK-003",
    code: "BBK-0003",
    name: "IPM (Isopropyl Myristate)",
    category: "Bahan Baku",
    warehouse: "Gudang Bahan Baku",
    goodQty: 285,
    rejectQty: 15,
    totalQty: 300,
    unit: "gr",
    minStock: 50,
    status: "NORMAL"
  },
  {
    id: "STK-004",
    code: "KPR-0001",
    name: "Botol Dropper Amber 20ml",
    category: "Kemasan Primer",
    warehouse: "Gudang Kemasan",
    goodQty: 9980,
    rejectQty: 20,
    totalQty: 10000,
    unit: "pcs",
    minStock: 2000,
    status: "NORMAL"
  },
  {
    id: "STK-005",
    code: "KSR-0001",
    name: "Dus Inner Box Serum Day",
    category: "Kemasan Sekunder",
    warehouse: "Gudang Kemasan",
    goodQty: 1200,
    rejectQty: 0,
    totalQty: 1200,
    unit: "pcs",
    minStock: 3000,
    status: "LOW_STOCK"
  },
  {
    id: "STK-006",
    code: "BJD-0001",
    name: "Day Cream SPF 30 (Farah Derma)",
    category: "Barang Jadi",
    warehouse: "Gudang Barang Jadi",
    goodQty: 3000,
    rejectQty: 0,
    totalQty: 3000,
    unit: "pcs",
    minStock: 500,
    status: "NORMAL"
  },
  {
    id: "STK-007",
    code: "BJD-0002",
    name: "Facial Foam Charcoal 100ml (K-Skin)",
    category: "Barang Jadi",
    warehouse: "Gudang Surabaya",
    goodQty: 5000,
    rejectQty: 0,
    totalQty: 5000,
    unit: "pcs",
    minStock: 1000,
    status: "NORMAL"
  }
];

export default function ReportStockPage() {
  const { toast } = useDnaToast();
  const [stocks] = useState<StockRecord[]>(INITIAL_STOCKS);
  const [searchTerm, setSearchTerm] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const filteredData = useMemo(() => {
    return stocks.filter(item => {
      const matchSearch =
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.warehouse.toLowerCase().includes(searchTerm.toLowerCase());
      const matchWh = warehouseFilter === "ALL" || item.warehouse === warehouseFilter;
      const matchCat = categoryFilter === "ALL" || item.category === categoryFilter;
      return matchSearch && matchWh && matchCat;
    });
  }, [stocks, searchTerm, warehouseFilter, categoryFilter]);

  const totalPhysical = filteredData.reduce((sum, s) => sum + s.totalQty, 0);
  const totalGood = filteredData.reduce((sum, s) => sum + s.goodQty, 0);
  const totalReject = filteredData.reduce((sum, s) => sum + s.rejectQty, 0);
  const totalLowStock = filteredData.filter(s => s.status === "LOW_STOCK").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NORMAL":
        return <DnaBadge status="success">Stok Aman</DnaBadge>;
      case "LOW_STOCK":
        return <DnaBadge status="danger">Di Bawah Min</DnaBadge>;
      case "OVERSTOCK":
        return <DnaBadge status="warning">Overstock</DnaBadge>;
      default:
        return <DnaBadge status="default">{status}</DnaBadge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <DnaPageHeader
        title="Laporan Posisi Stok Gudang (Stock Balance)"
        description="Monitoring kuantitas fisik real-time persediaan bahan baku, kemasan, dan produk jadi lintas seluruh fasilitas gudang"
        actions={
          <DnaButton
            variant="outline"
            icon={<Download className="h-4 w-4" />}
            onClick={() => {
              toast({
                title: "Ekspor Laporan Stok",
                description: "Mengunduh file Excel Laporan Stok Real-Time...",
                variant: "success"
              });
            }}
          >
            Ekspor Excel
          </DnaButton>
        }
      />

      {/* KPI Cards 3-Pilar */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          title="Total Fisik Persediaan"
          value={totalPhysical.toLocaleString("id-ID")}
          icon={Boxes}
          variant="default"
          subtext="Total seluruh kuantitas di gudang"
        />
        <DnaStatCard
          title="Stok Bagus (Siap Pakai/Kirim)"
          value={totalGood.toLocaleString("id-ID")}
          icon={PackageCheck}
          variant="success"
          subtext="Lolos QC dan layak proses"
        />
        <DnaStatCard
          title="Stok Cacat / Reject"
          value={totalReject.toLocaleString("id-ID")}
          icon={AlertTriangle}
          variant="danger"
          subtext="Rusak/reject dalam penampungan"
        />
        <DnaStatCard
          title="Item Menipis (Reorder Alert)"
          value={totalLowStock.toString()}
          icon={AlertTriangle}
          variant="warning"
          subtext="Stok mendekati batas aman"
        />
      </DnaKpiGrid>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode, nama barang, gudang..."
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

      {/* 1:1 Table (Exactly 10 columns matching legacy G-SERP) */}
      <DnaDataTableCard title="Daftar Saldo Stok Barang">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Kode Barang</th>
                <th className="py-3 px-4">Nama Barang</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Gudang</th>
                <th className="py-3 px-4 text-right">Stok Bagus</th>
                <th className="py-3 px-4 text-right">Stok Cacat</th>
                <th className="py-3 px-4 text-right">Total Fisik</th>
                <th className="py-3 px-4 text-center">Satuan</th>
                <th className="py-3 px-4 text-center">Status Stok</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Tidak ada barang sesuai filter
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-semibold text-blue-600">{item.code}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{item.name}</td>
                    <td className="py-3 px-4 text-slate-600">{item.category}</td>
                    <td className="py-3 px-4 text-slate-700">{item.warehouse}</td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                      {item.goodQty.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-4 text-right text-rose-600 font-medium">
                      {item.rejectQty.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {item.totalQty.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600 uppercase font-medium">{item.unit}</td>
                    <td className="py-3 px-4 text-center">{getStatusBadge(item.status)}</td>
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
