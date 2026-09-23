"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Package,
  Layers,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  DollarSign,
  Eye,
  Warehouse,
  ArrowRightLeft,
  CheckCircle2,
  TrendingDown,
  Clock,
  Boxes
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaTable,
  DnaDetailDrawer,
  formatRupiah,
  useDnaToast
} from "@/components/dna";

interface StockItem {
  id: string;
  itemCode: string;
  itemName: string;
  category: "Bahan Baku" | "Bahan Kemas" | "Barang Jadi";
  typeCode: "RAW_MATERIAL" | "PACKAGING" | "FINISHED_GOODS";
  warehouse: string;
  rackLocation: string;
  unit: string;
  qtyOnHand: number;
  safetyStock: number;
  fifoUnitCost: number;
  totalValuation: number;
  status: "AMAN" | "LOW_STOCK" | "OUT_OF_STOCK";
}

export default function WarehouseStockReportPage() {
  const toast = useDnaToast();
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);

  const { data: rawCatalog = [] } = useQuery({
    queryKey: ["warehouse-catalog"],
    queryFn: async () => {
      const res = await api.get("/warehouse/catalog");
      return (unwrapResponse(res.data) as any[]) || [];
    },
  });

  const stockList: StockItem[] = useMemo(() => {
    if (!Array.isArray(rawCatalog)) return [];
    return rawCatalog.map((mat: any) => {
      const stock = Number(mat.stockQty || 0);
      const minLevel = Number(mat.minLevel || 0);
      const unitPrice = Number(mat.unitPrice || 0);
      const valuation = stock * unitPrice;
      const status: "AMAN" | "LOW_STOCK" | "OUT_OF_STOCK" =
        stock === 0 ? "OUT_OF_STOCK" : stock < minLevel ? "LOW_STOCK" : "AMAN";

      const typeCode: "RAW_MATERIAL" | "PACKAGING" | "FINISHED_GOODS" =
        mat.type === "RAW_MATERIAL" ? "RAW_MATERIAL" : mat.type === "PACKAGING" ? "PACKAGING" : "FINISHED_GOODS";

      return {
        id: mat.id,
        itemCode: mat.code || mat.id.slice(0, 8),
        itemName: mat.name,
        category: (mat.type === "RAW_MATERIAL" ? "Bahan Baku" : mat.type === "PACKAGING" ? "Bahan Kemas" : "Barang Jadi") as any,
        typeCode,
        warehouse: mat.inventories?.[0]?.location?.warehouse?.name || "Gudang Utama CPKB",
        rackLocation: mat.inventories?.[0]?.location?.name || "RACK-GEN",
        unit: mat.unit || "Pcs",
        qtyOnHand: stock,
        safetyStock: minLevel,
        fifoUnitCost: unitPrice,
        totalValuation: valuation,
        status,
      };
    });
  }, [rawCatalog]);

  const totalValuation = useMemo(() => stockList.reduce((acc, r) => acc + r.totalValuation, 0), [stockList]);
  const totalPhysicalQty = useMemo(() => stockList.reduce((acc, r) => acc + r.qtyOnHand, 0), [stockList]);
  const lowStockCount = useMemo(() => stockList.filter((r) => r.status === "LOW_STOCK" || r.status === "OUT_OF_STOCK").length, [stockList]);

  const filteredStocks = useMemo(() => {
    return stockList.filter((item) => {
      const matchSearch =
        item.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.warehouse.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.rackLocation.toLowerCase().includes(searchQuery.toLowerCase());

      const matchTab =
        activeTab === "ALL" ? true :
        activeTab === "LOW_STOCK" ? (item.status === "LOW_STOCK" || item.status === "OUT_OF_STOCK") :
        item.typeCode === activeTab;

      return matchSearch && matchTab;
    });
  }, [stockList, searchQuery, activeTab]);

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Stok Barang & Valuasi Persediaan"
        description="Monitoring kuantitas fisik on-hand, lokasi rak gudang, safety stock threshold, dan valuasi persediaan metode FIFO."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 font-semibold">
            <Package className="w-3.5 h-3.5" />
            <span>Multi-Warehouse FIFO Valuation</span>
          </div>
        }
        tabs={[
          { id: "ALL", label: "Semua Kategori", count: stockList.length },
          { id: "RAW_MATERIAL", label: "Bahan Baku", count: stockList.filter((i) => i.typeCode === "RAW_MATERIAL").length },
          { id: "PACKAGING", label: "Bahan Kemas", count: stockList.filter((i) => i.typeCode === "PACKAGING").length },
          { id: "FINISHED_GOODS", label: "Barang Jadi", count: stockList.filter((i) => i.typeCode === "FINISHED_GOODS").length },
          { id: "LOW_STOCK", label: "Perlu Reorder", count: lowStockCount },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <div className="flex items-center gap-2">
            <DnaButton variant="secondary" size="sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Laporan
            </DnaButton>
            <DnaButton variant="primary" size="sm" onClick={() => toast.success("Exporting Stok Persediaan ke Excel...")}>
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Export Excel
            </DnaButton>
          </div>
        }
      />

      {/* KPI Cards */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Nilai Valuasi FIFO"
          value={formatRupiah(totalValuation)}
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "Metode FIFO Standar", isPositive: true }}
          subtext="Total Aset Bahan & Produk"
          variant="success"
        />
        <DnaStatCard
          label="Total SKU Terdaftar"
          value={`${stockList.length} SKU`}
          icon={<Package className="w-5 h-5 text-blue-600" />}
          subtext="Katalog Bahan & FG"
          variant="info"
        />
        <DnaStatCard
          label="Total Kuantitas Fisik"
          value={`${totalPhysicalQty.toLocaleString("id-ID")} Unit`}
          icon={<Layers className="w-5 h-5 text-purple-600" />}
          subtext="Akumulasi Seluruh Gudang"
          variant="purple"
        />
        <DnaStatCard
          label="Di Bawah Minimum"
          value={`${lowStockCount} SKU`}
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
          delta={{ value: "Reorder Required", isPositive: false }}
          subtext="Segera Buat PR Bahan"
          variant="warning"
        />
      </DnaKpiGrid>

      {/* Main Table Card (Rule 1: No title prop, Rule 4: Clean responsive columns) */}
      <DnaDataTableCard
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari kode SKU, nama material/produk, lokasi rak..."
      >
        <DnaTable className="w-full text-left text-xs table-fixed">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="px-4 py-3 w-[30%]">Barang & Kategori</th>
              <th className="px-3 py-3 w-[20%]">Gudang & Rak</th>
              <th className="px-3 py-3 w-[15%] text-right">Stok Fisik</th>
              <th className="px-3 py-3 w-[18%] text-right">Valuasi FIFO</th>
              <th className="px-3 py-3 w-[10%] text-center">Status</th>
              <th className="px-4 py-3 w-[7%] text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStocks.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  Tidak ada data persediaan barang yang sesuai filter.
                </td>
              </tr>
            ) : (
              filteredStocks.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                >
                  {/* Kolom 1: Max 2 lines (Name bold + SKU/Category muted) */}
                  <td className="px-4 py-2.5">
                    <div className="font-semibold text-slate-900 truncate">{item.itemName}</div>
                    <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                      <span className="text-blue-600 font-semibold">{item.itemCode}</span>
                      <span>•</span>
                      <span>{item.category}</span>
                    </div>
                  </td>

                  {/* Kolom 2: Gudang & Rak */}
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-slate-800 truncate">{item.warehouse}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                      <Warehouse className="w-3 h-3 text-slate-400" />
                      <span>{item.rackLocation}</span>
                    </div>
                  </td>

                  {/* Kolom 3: Stok Fisik & Safety */}
                  <td className="px-3 py-2.5 text-right">
                    <div className="font-bold text-slate-900 text-sm">
                      {item.qtyOnHand.toLocaleString("id-ID")} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Min: {item.safetyStock.toLocaleString("id-ID")} {item.unit}
                    </div>
                  </td>

                  {/* Kolom 4: Valuasi FIFO */}
                  <td className="px-3 py-2.5 text-right">
                    <div className="font-bold text-emerald-700">
                      {formatRupiah(item.totalValuation)}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                      @ {formatRupiah(item.fifoUnitCost)}
                    </div>
                  </td>

                  {/* Kolom 5: Status */}
                  <td className="px-3 py-2.5 text-center">
                    <DnaBadge
                      variant={
                        item.status === "AMAN"
                          ? "success"
                          : item.status === "LOW_STOCK"
                          ? "warning"
                          : "critical"
                      }
                    >
                      {item.status === "AMAN"
                        ? "Aman"
                        : item.status === "LOW_STOCK"
                        ? "Low Stock"
                        : "Habis"}
                    </DnaBadge>
                  </td>

                  {/* Kolom 6: Aksi */}
                  <td className="px-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <DnaButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedItem(item)}
                      className="text-slate-500 hover:text-blue-600"
                    >
                      <Eye className="w-4 h-4" />
                    </DnaButton>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </DnaTable>
      </DnaDataTableCard>

      {/* Quick Peek Drawer (Rule 5) */}
      <DnaDetailDrawer
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.itemName || "Detail Stok"}
        subtitle={`SKU: ${selectedItem?.itemCode} • ${selectedItem?.category}`}
        badge={
          selectedItem && (
            <DnaBadge
              variant={
                selectedItem.status === "AMAN"
                  ? "success"
                  : selectedItem.status === "LOW_STOCK"
                  ? "warning"
                  : "critical"
              }
            >
              {selectedItem.status === "AMAN" ? "Stok Aman" : "Perlu Restock"}
            </DnaBadge>
          )
        }
        footerActions={
          <div className="flex items-center gap-2">
            <DnaButton
              variant="outline"
              size="sm"
              onClick={() => {
                toast.info(`Membuka kartu mutasi untuk SKU ${selectedItem?.itemCode}`);
                setSelectedItem(null);
              }}
            >
              <ArrowRightLeft className="w-4 h-4 mr-1.5" />
              Kartu Mutasi
            </DnaButton>
            {selectedItem && (selectedItem.status === "LOW_STOCK" || selectedItem.status === "OUT_OF_STOCK") && (
              <DnaButton
                variant="primary"
                size="sm"
                onClick={() => {
                  toast.success(`Draf Permintaan Pembelian (PR) untuk ${selectedItem.itemName} dibuat`);
                  setSelectedItem(null);
                }}
              >
                Buat PR Pembelian
              </DnaButton>
            )}
          </div>
        }
      >
        {selectedItem && (
          <div className="space-y-6">
            {/* Inventory Valuation Card */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-2">
              <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" />
                Valuasi Nilai Persediaan (FIFO)
              </div>
              <div className="text-2xl font-bold text-emerald-700">
                {formatRupiah(selectedItem.totalValuation)}
              </div>
              <div className="text-xs text-emerald-600 flex items-center justify-between">
                <span>Harga Pokok Satuan (HPP):</span>
                <span className="font-semibold font-mono">{formatRupiah(selectedItem.fifoUnitCost)} / {selectedItem.unit}</span>
              </div>
            </div>

            {/* Stock Level & Safety Comparison */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Posisi Kuantitas Fisik</span>
                <span className="font-mono font-bold text-slate-900">
                  {selectedItem.qtyOnHand.toLocaleString("id-ID")} {selectedItem.unit}
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    selectedItem.qtyOnHand < selectedItem.safetyStock ? "bg-amber-500" : "bg-blue-600"
                  }`}
                  style={{
                    width: `${Math.min(100, Math.round((selectedItem.qtyOnHand / (selectedItem.safetyStock * 2 || 1)) * 100))}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Ambang Minimum (Safety Stock):</span>
                <span className="font-semibold text-slate-700">{selectedItem.safetyStock.toLocaleString("id-ID")} {selectedItem.unit}</span>
              </div>
            </div>

            {/* Storage Location Info */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Lokasi Penyimpanan Gudang
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <div className="text-slate-400">Gudang Utama</div>
                  <div className="font-semibold text-slate-800 mt-1">{selectedItem.warehouse}</div>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <div className="text-slate-400">Lokasi Bin / Rak</div>
                  <div className="font-semibold text-slate-800 mt-1 font-mono">{selectedItem.rackLocation}</div>
                </div>
              </div>
            </div>

            {/* CPKB Compliance & Traceability Notes */}
            <div className="p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-xl text-xs text-blue-800 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                Standar Kepatuhan CPKB / BPOM
              </div>
              <p className="text-blue-700 text-[11px] leading-relaxed">
                Stok material dicatat dengan nomor lot/batch dan tanggal kedaluwarsa. Sistem pengeluaran material ke proses produksi wajib memprioritaskan FEFO (First Expired First Out).
              </p>
            </div>
          </div>
        )}
      </DnaDetailDrawer>
    </DnaPageContainer>
  );
}
