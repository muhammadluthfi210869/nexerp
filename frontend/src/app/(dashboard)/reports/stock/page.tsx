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
import { DnaCell } from "@/components/dna/cells/DnaCell";
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
          label="Total Fisik Persediaan"
          value={totalPhysical.toLocaleString("id-ID")}
          icon={<Boxes className="w-5 h-5 text-indigo-600" />}
          variant="info"
          subtext="Total seluruh kuantitas di gudang"
        />
        <DnaStatCard
          label="Stok Bagus (Siap Pakai/Kirim)"
          value={totalGood.toLocaleString("id-ID")}
          icon={<PackageCheck className="w-5 h-5 text-emerald-600" />}
          variant="success"
          subtext="Lolos QC dan layak proses"
        />
        <DnaStatCard
          label="Stok Cacat / Reject"
          value={totalReject.toLocaleString("id-ID")}
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
          variant={totalReject > 0 ? "warning" : "default"}
          subtext="Rusak/reject dalam penampungan"
        />
        <DnaStatCard
          label="Item Menipis (Reorder Alert)"
          value={totalLowStock.toString()}
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
          variant={totalLowStock > 0 ? "warning" : "default"}
          subtext="Stok mendekati batas aman"
        />
      </DnaKpiGrid>

      {/* Main Table Card (Rule 1: No title prop, Rule 4: Clean responsive columns) */}
      <DnaDataTableCard
        toolbarProps={{
          searchQuery: searchTerm,
          onSearchChange: setSearchTerm,
          searchPlaceholder: "Cari kode, nama barang, gudang...",
          extraActions: (
            <div className="flex items-center gap-2">
              <select
                value={warehouseFilter}
                onChange={(e) => setWarehouseFilter(e.target.value)}
                className="text-[12px] border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                className="text-[12px] border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">Semua Kategori</option>
                <option value="Bahan Baku">Bahan Baku</option>
                <option value="Kemasan Primer">Kemasan Primer</option>
                <option value="Kemasan Sekunder">Kemasan Sekunder</option>
                <option value="Barang Jadi">Barang Jadi</option>
              </select>
            </div>
          ),
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-4 py-3 h-[40px] w-[130px]">Kode Barang</th>
                <th className="px-3 py-3 h-[40px]">Nama Barang</th>
                <th className="px-3 py-3 h-[40px] w-[140px]">Kategori</th>
                <th className="px-3 py-3 h-[40px]">Gudang</th>
                <th className="px-3 py-3 h-[40px] text-right w-[120px]">Stok Bagus</th>
                <th className="px-3 py-3 h-[40px] text-right w-[110px]">Stok Cacat</th>
                <th className="px-3 py-3 h-[40px] text-right w-[120px]">Total Fisik</th>
                <th className="px-3 py-3 h-[40px] text-right w-[110px]">Min. Stok</th>
                <th className="px-4 py-3 h-[40px] text-center w-[130px]">Status Stok</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Boxes className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada barang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/60 transition-colors group h-[48px]"
                  >
                    {/* Kolom 1: Kode Barang */}
                    <td className="px-4 py-2">
                      <DnaCell.Code value={item.code} />
                    </td>

                    {/* Kolom 2: Nama Barang */}
                    <td className="px-3 py-2 text-slate-900 font-medium truncate max-w-[220px]">
                      {item.name}
                    </td>

                    {/* Kolom 3: Kategori */}
                    <td className="px-3 py-2 text-slate-600">
                      {item.category}
                    </td>

                    {/* Kolom 4: Gudang */}
                    <td className="px-3 py-2 text-slate-800 truncate max-w-[160px]">
                      {item.warehouse}
                    </td>

                    {/* Kolom 5: Stok Bagus */}
                    <td className="px-3 py-2 text-right">
                      <DnaCell.Number
                        value={item.goodQty}
                        unit={item.unit}
                        colorClass="text-emerald-700 font-semibold"
                      />
                    </td>

                    {/* Kolom 6: Stok Cacat */}
                    <td className="px-3 py-2 text-right">
                      {item.rejectQty > 0 ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          {item.rejectQty.toLocaleString("id-ID")} {item.unit}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">0 {item.unit}</span>
                      )}
                    </td>

                    {/* Kolom 7: Total Fisik */}
                    <td className="px-3 py-2 text-right">
                      <DnaCell.Number
                        value={item.totalQty}
                        unit={item.unit}
                      />
                    </td>

                    {/* Kolom 8: Min. Stok */}
                    <td className="px-3 py-2 text-right">
                      <DnaCell.Number
                        value={item.minStock}
                        unit={item.unit}
                        colorClass="text-slate-600"
                      />
                    </td>

                    {/* Kolom 9: Status Stok */}
                    <td className="px-4 py-2 text-center">
                      {getStatusBadge(item.status)}
                    </td>
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
