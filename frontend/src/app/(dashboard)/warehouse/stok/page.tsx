"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Package,
  Boxes,
  Warehouse,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Eye,
  FileSpreadsheet,
  Layers,
  ArrowRightLeft,
  DollarSign,
  TrendingDown,
  ShieldCheck,
  History,
  Tag,
  Plus
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaModal,
  DnaTabNav,
  useDnaToast
} from "@/components/dna";

interface StockItem {
  id: string;
  itemCode: string;
  itemName: string;
  category: "BAHAN_BAKU" | "BAHAN_KEMAS" | "PRODUK_JADI" | "REAGEN_LAB" | "KARANTINA_REJECT";
  categoryLabel: string;
  warehouseName: string;
  warehouseCode: string;
  binLocation: string; // Lokasi Rak/Bin, e.g. "Rak A-02 / Level 2"
  realStock: number; // Kuantitas Bagus
  quarantineStock: number; // Kuantitas dalam uji QC
  minStockLevel: number;
  maxStockLevel: number;
  unit: string;
  hppPrice: number; // Moving average HPP
  totalValuation: number;
  stockStatus: "SAFE" | "LOW" | "CRITICAL";
  lastRestockDate: string;
  batchLot: string;
}

const INITIAL_STOCK_ITEMS: StockItem[] = [
  {
    id: "stk-1",
    itemCode: "BBK00028",
    itemName: "Super Moisturing Max (Raw Active)",
    category: "BAHAN_BAKU",
    categoryLabel: "Bahan Baku (110401)",
    warehouseName: "Gudang Bahan Baku Utama",
    warehouseCode: "WH-01",
    binLocation: "Aisle A / Rak 01-L2",
    realStock: 120.0,
    quarantineStock: 0,
    minStockLevel: 50.0,
    maxStockLevel: 500.0,
    unit: "Kg",
    hppPrice: 150000,
    totalValuation: 18000000,
    stockStatus: "SAFE",
    lastRestockDate: "2026-09-08",
    batchLot: "LOT-BB-2609-001"
  },
  {
    id: "stk-2",
    itemCode: "BBK00031",
    itemName: "Niacinamide PC (Vitamin B3 Grade A)",
    category: "BAHAN_BAKU",
    categoryLabel: "Bahan Baku (110401)",
    warehouseName: "Gudang Bahan Baku Utama",
    warehouseCode: "WH-01",
    binLocation: "Aisle A / Rak 02-L1",
    realStock: 18.5,
    quarantineStock: 25.0,
    minStockLevel: 30.0,
    maxStockLevel: 200.0,
    unit: "Kg",
    hppPrice: 280000,
    totalValuation: 5180000,
    stockStatus: "LOW",
    lastRestockDate: "2026-08-25",
    batchLot: "LOT-NC-2608-019"
  },
  {
    id: "stk-3",
    itemCode: "BBK00092",
    itemName: "Fragrance Sweet Vanilla Premium",
    category: "BAHAN_BAKU",
    categoryLabel: "Bahan Baku (110401)",
    warehouseName: "Gudang Bahan Baku Utama",
    warehouseCode: "WH-01",
    binLocation: "Aisle B / Rak 04-L3 (Cool Storage)",
    realStock: 3.2,
    quarantineStock: 0,
    minStockLevel: 10.0,
    maxStockLevel: 50.0,
    unit: "Kg",
    hppPrice: 500000,
    totalValuation: 1600000,
    stockStatus: "CRITICAL",
    lastRestockDate: "2026-08-10",
    batchLot: "LOT-FG-2608-004"
  },
  {
    id: "stk-4",
    itemCode: "KMS00012",
    itemName: "Botol Tube 100ml Doff White + Flip Cap",
    category: "BAHAN_KEMAS",
    categoryLabel: "Bahan Kemas (110402)",
    warehouseName: "Gudang Kemas & Box",
    warehouseCode: "WH-02",
    binLocation: "Zone K / Pallet P-12",
    realStock: 12500,
    quarantineStock: 0,
    minStockLevel: 5000,
    maxStockLevel: 50000,
    unit: "Pcs",
    hppPrice: 3500,
    totalValuation: 43750000,
    stockStatus: "SAFE",
    lastRestockDate: "2026-09-02",
    batchLot: "LOT-KM-2609-002"
  },
  {
    id: "stk-5",
    itemCode: "KMS00088",
    itemName: "Inner Box Printing Ivory 300gsm",
    category: "BAHAN_KEMAS",
    categoryLabel: "Bahan Kemas (110402)",
    warehouseName: "Gudang Kemas & Box",
    warehouseCode: "WH-02",
    binLocation: "Zone K / Rak 08-L1",
    realStock: 2400,
    quarantineStock: 0,
    minStockLevel: 5000,
    maxStockLevel: 30000,
    unit: "Pcs",
    hppPrice: 3000,
    totalValuation: 7200000,
    stockStatus: "LOW",
    lastRestockDate: "2026-08-20",
    batchLot: "LOT-BX-2608-088"
  },
  {
    id: "stk-6",
    itemCode: "PRD00109",
    itemName: "Brightening Day Cream SPF 30 (Netto 30g)",
    category: "PRODUK_JADI",
    categoryLabel: "Produk Jadi (110404)",
    warehouseName: "Gudang Produk Jadi",
    warehouseCode: "WH-03",
    binLocation: "Zone FG / Rak 01-L1",
    realStock: 4800,
    quarantineStock: 0,
    minStockLevel: 1000,
    maxStockLevel: 15000,
    unit: "Pcs",
    hppPrice: 18500,
    totalValuation: 88800000,
    stockStatus: "SAFE",
    lastRestockDate: "2026-09-07",
    batchLot: "BATCH-FG-2609-001"
  },
  {
    id: "stk-7",
    itemCode: "LAB00015",
    itemName: "Reagen Uji Mikroba & Buffer pH 7.0",
    category: "REAGEN_LAB",
    categoryLabel: "Reagen Lab & QC (510201)",
    warehouseName: "Gudang Karantina & QC",
    warehouseCode: "WH-04",
    binLocation: "QC-Lab / Lemari 02",
    realStock: 14,
    quarantineStock: 0,
    minStockLevel: 5,
    maxStockLevel: 50,
    unit: "Botol",
    hppPrice: 125000,
    totalValuation: 1750000,
    stockStatus: "SAFE",
    lastRestockDate: "2026-08-30",
    batchLot: "LOT-QC-2608-005"
  },
  {
    id: "stk-8",
    itemCode: "REJ00004",
    itemName: "Botol Tube Cacat Sablon (Klaim Retur)",
    category: "KARANTINA_REJECT",
    categoryLabel: "Karantina & Reject (WH-05)",
    warehouseName: "Gudang Retur & Reject",
    warehouseCode: "WH-05",
    binLocation: "Area Reject / Pallet R-01",
    realStock: 1200,
    quarantineStock: 0,
    minStockLevel: 0,
    maxStockLevel: 0,
    unit: "Pcs",
    hppPrice: 0, // Reject tidak dinilai HPP AP
    totalValuation: 0,
    stockStatus: "SAFE",
    lastRestockDate: "2026-09-06",
    batchLot: "LOT-REJ-2609-03"
  }
];

export default function StokBarangPage() {
  const toast = useDnaToast();
  const [dataList, setDataList] = useState<StockItem[]>(INITIAL_STOCK_ITEMS);

  // Filters & State
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Query Backend
  const { data: apiData } = useQuery({
    queryKey: ["warehouse-catalog-stok"],
    queryFn: async () => {
      try {
        const res = await api.get("/warehouse/catalog");
        return unwrapResponse(res);
      } catch {
        return null;
      }
    },
    retry: false
  });

  // Calculate KPIs
  const kpis = useMemo(() => {
    const list = dataList;
    const totalSku = list.length;
    const totalValuation = list.reduce((sum, item) => sum + item.totalValuation, 0);
    const criticalCount = list.filter(item => item.stockStatus === "CRITICAL" || item.stockStatus === "LOW").length;
    const quarantineCount = list.filter(item => item.quarantineStock > 0 || item.category === "KARANTINA_REJECT").length;

    return {
      totalSku,
      totalValuation,
      criticalCount,
      quarantineCount
    };
  }, [dataList]);

  // Filtered List
  const filteredList = useMemo(() => {
    return dataList.filter(item => {
      const matchSearch =
        item.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.binLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.batchLot.toLowerCase().includes(searchQuery.toLowerCase());

      const matchTab =
        activeTab === "ALL" ? true :
        activeTab === "BAHAN_BAKU" ? item.category === "BAHAN_BAKU" :
        activeTab === "BAHAN_KEMAS" ? item.category === "BAHAN_KEMAS" :
        activeTab === "PRODUK_JADI" ? item.category === "PRODUK_JADI" :
        activeTab === "REAGEN_LAB" ? item.category === "REAGEN_LAB" :
        activeTab === "KARANTINA_REJECT" ? item.category === "KARANTINA_REJECT" : true;

      const matchWarehouse = warehouseFilter === "ALL" ? true : item.warehouseCode === warehouseFilter;
      const matchStatus = statusFilter === "ALL" ? true : item.stockStatus === statusFilter;

      return matchSearch && matchTab && matchWarehouse && matchStatus;
    });
  }, [dataList, searchQuery, activeTab, warehouseFilter, statusFilter]);

  const getStatusBadge = (status: StockItem["stockStatus"]) => {
    switch (status) {
      case "SAFE":
        return <DnaBadge variant="success">Stok Aman</DnaBadge>;
      case "LOW":
        return <DnaBadge variant="warning">Stok Menipis (Min)</DnaBadge>;
      case "CRITICAL":
        return <DnaBadge variant="critical">Stok Kritis / Reorder</DnaBadge>;
    }
  };

  return (
    <DnaPageContainer>
      {/* Header */}
      <DnaPageHeader
        title="Stok Barang & Bahan (Inventory Master)"
        description="Pusat pemantauan persediaan bahan baku, bahan kemas, produk jadi, dan valuasi stok real-time (Poin 53-55)."
        badge={<DnaBadge variant="neutral">SCR-029 / WH-INV-MASTER</DnaBadge>}
        actions={
          <div className="flex items-center gap-2.5">
            <DnaButton
              variant="outline"
              size="sm"
              icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
              onClick={() => toast.success("Laporan Persediaan diexport ke Excel")}
            >
              Export Laporan Stok
            </DnaButton>
          </div>
        }
      />

      {/* KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total SKU Aktif"
          value={`${kpis.totalSku} Item`}
          icon={<Boxes className="w-5 h-5 text-indigo-600" />}
          delta={{ value: "+8 SKU baru bulan ini", isPositive: true }}
        />
        <DnaStatCard
          label="Total Valuasi Stok"
          value={`Rp ${kpis.totalValuation.toLocaleString("id-ID")}`}
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
        />
        <DnaStatCard
          label="Item Stok Kritis / Min Alert"
          value={`${kpis.criticalCount} SKU`}
          icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
          variant={kpis.criticalCount > 0 ? "warning" : "default"}
        />
        <DnaStatCard
          label="Karantina / Reject QC"
          value={`${kpis.quarantineCount} SKU`}
          icon={<ShieldCheck className="w-5 h-5 text-purple-600" />}
        />
      </DnaKpiGrid>

      {/* Navigation Tabs */}
      <div className="mb-4">
        <DnaTabNav
          tabs={[
            { id: "ALL", label: "Semua Kategori", count: dataList.length },
            { id: "BAHAN_BAKU", label: "Bahan Baku (110401)", count: dataList.filter(d => d.category === "BAHAN_BAKU").length },
            { id: "BAHAN_KEMAS", label: "Bahan Kemas (110402)", count: dataList.filter(d => d.category === "BAHAN_KEMAS").length },
            { id: "PRODUK_JADI", label: "Produk Jadi (110404)", count: dataList.filter(d => d.category === "PRODUK_JADI").length },
            { id: "REAGEN_LAB", label: "Reagen Lab & QC", count: dataList.filter(d => d.category === "REAGEN_LAB").length },
            { id: "KARANTINA_REJECT", label: "Karantina & Reject", count: dataList.filter(d => d.category === "KARANTINA_REJECT").length }
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Main Table Card */}
      <DnaDataTableCard
        title="Daftar Saldo Persediaan Barang & Bahan Fisik"
        description="Kuantitas stok real hanya mencakup barang kondisi bagus yang lolos verifikasi Quality Control."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari Kode Barang, Nama Bahan, Rak/Bin, Lot..."
        actions={
          <div className="flex items-center gap-2">
            <select
              aria-label="Filter Gudang"
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">Semua Fasilitas Gudang</option>
              <option value="WH-01">Gudang Bahan Baku (WH-01)</option>
              <option value="WH-02">Gudang Kemas & Box (WH-02)</option>
              <option value="WH-03">Gudang Produk Jadi (WH-03)</option>
              <option value="WH-04">Gudang Karantina & QC (WH-04)</option>
              <option value="WH-05">Gudang Retur & Reject (WH-05)</option>
            </select>

            <select
              aria-label="Filter Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">Semua Status Stok</option>
              <option value="SAFE">Stok Aman</option>
              <option value="LOW">Stok Menipis (Min Alert)</option>
              <option value="CRITICAL">Stok Kritis</option>
            </select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Kode Item</th>
                <th className="py-3 px-4">Nama Bahan / Barang</th>
                <th className="py-3 px-4">Kategori COA</th>
                <th className="py-3 px-4">Gudang & Lokasi Rak</th>
                <th className="py-3 px-4 text-right">Real Stok (Bagus)</th>
                <th className="py-3 px-4 text-center">Satuan</th>
                <th className="py-3 px-4 text-right">HPP Satuan</th>
                <th className="py-3 px-4 text-right">Valuasi Stok (Rp)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada item persediaan yang sesuai filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredList.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 text-xs">
                      {row.itemCode}
                      <div className="text-[11px] text-slate-400 font-normal font-sans">Lot: {row.batchLot}</div>
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-900">
                      <div>{row.itemName}</div>
                      <div className="text-[11px] text-slate-400 font-normal">Min: {row.minStockLevel} | Max: {row.maxStockLevel}</div>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                        {row.categoryLabel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-800">
                      <div className="font-semibold">{row.warehouseName}</div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <Tag className="w-3 h-3 text-slate-400" /> {row.binLocation}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-xs font-mono font-bold text-indigo-700">
                      {row.realStock.toLocaleString("id-ID")}
                      {row.quarantineStock > 0 && (
                        <div className="text-[10px] text-purple-600 font-normal">(+{row.quarantineStock} QC)</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center text-xs text-slate-500 font-medium">
                      {row.unit}
                    </td>
                    <td className="py-3 px-4 text-right text-xs font-mono text-slate-700">
                      Rp {row.hppPrice.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-4 text-right text-xs font-mono font-bold text-slate-900">
                      Rp {row.totalValuation.toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(row.stockStatus)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        icon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => {
                          setSelectedItem(row);
                          setIsDetailOpen(true);
                        }}
                      >
                        Kartu Stok
                      </DnaButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* Modal Kartu Stok Detail */}
      {selectedItem && (
        <DnaModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Kartu Stok: ${selectedItem.itemName}`}
          description={`Kode [${selectedItem.itemCode}] - Lokasi ${selectedItem.warehouseName} (${selectedItem.binLocation})`}
          size="xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="text-xs text-slate-500">
                Restock Terakhir: <span className="font-semibold text-slate-700">{selectedItem.lastRestockDate}</span>
              </div>
              <DnaButton variant="outline" size="sm" onClick={() => setIsDetailOpen(false)}>
                Tutup
              </DnaButton>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Header Cards */}
            <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500 block">Stok Real Tersedia</span>
                <span className="font-bold text-indigo-700 font-mono text-base">
                  {selectedItem.realStock.toLocaleString("id-ID")} {selectedItem.unit}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">HPP Rata-Rata</span>
                <span className="font-bold text-slate-900 font-mono text-sm">
                  Rp {selectedItem.hppPrice.toLocaleString("id-ID")}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Total Valuasi Stok</span>
                <span className="font-bold text-emerald-600 font-mono text-sm">
                  Rp {selectedItem.totalValuation.toLocaleString("id-ID")}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Status Ketersediaan</span>
                <div className="mt-1">{getStatusBadge(selectedItem.stockStatus)}</div>
              </div>
            </div>

            {/* Riwayat Mutasi Kartu Stok */}
            <div>
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">Riwayat Mutasi Terakhir (Buku Pembantu)</h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Tanggal</th>
                      <th className="py-2.5 px-3">No. Referensi Dokumen</th>
                      <th className="py-2.5 px-3">Jenis Mutasi</th>
                      <th className="py-2.5 px-3 text-right">Masuk (+)</th>
                      <th className="py-2.5 px-3 text-right">Keluar (-)</th>
                      <th className="py-2.5 px-3 text-right">Saldo Akhir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-3">2026-09-08</td>
                      <td className="py-2.5 px-3 text-indigo-600">GRN-202609-0021 (PO-202608-000033)</td>
                      <td className="py-2.5 px-3 font-sans"><DnaBadge variant="info">Penerimaan PO</DnaBadge></td>
                      <td className="py-2.5 px-3 text-right text-emerald-600 font-bold">+100.0</td>
                      <td className="py-2.5 px-3 text-right text-slate-400">0</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">120.0</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-3">2026-09-05</td>
                      <td className="py-2.5 px-3 text-indigo-600">REQ-202609-0004 (SPK-2026-09-002)</td>
                      <td className="py-2.5 px-3 font-sans"><DnaBadge variant="warning">Pengeluaran Produksi</DnaBadge></td>
                      <td className="py-2.5 px-3 text-right text-slate-400">0</td>
                      <td className="py-2.5 px-3 text-right text-red-600 font-bold">-35.5</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">20.0</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-3">2026-08-25</td>
                      <td className="py-2.5 px-3 text-indigo-600">TRF-WH-202608-0012</td>
                      <td className="py-2.5 px-3 font-sans"><DnaBadge variant="neutral">Transfer Masuk</DnaBadge></td>
                      <td className="py-2.5 px-3 text-right text-emerald-600 font-bold">+55.5</td>
                      <td className="py-2.5 px-3 text-right text-slate-400">0</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">55.5</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </DnaModal>
      )}
    </DnaPageContainer>
  );
}
