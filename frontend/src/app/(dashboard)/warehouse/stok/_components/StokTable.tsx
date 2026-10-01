import React from "react";
import { Package, Eye } from "lucide-react";
import {
  DnaDataTableCard,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaCell,
  DnaBadge,
  DnaButton,
  formatRupiah,
} from "@/components/dna";
import type { StockItem } from "../_types/stok.types";

interface StokTableProps {
  filteredList: StockItem[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  selectedColumn: string;
  onSelectColumn: (col: string) => void;
  filterValue: string;
  onFilterValueChange: (val: string) => void;
  dateMode: any;
  onDateModeChange: (mode: any) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  warehouseOptions: string[];
  onResetAll: () => void;
  onSelectItem: (item: StockItem) => void;
}

export function StokTable({
  filteredList,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  selectedColumn,
  onSelectColumn,
  filterValue,
  onFilterValueChange,
  dateMode,
  onDateModeChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  warehouseOptions,
  onResetAll,
  onSelectItem,
}: StokTableProps) {
  return (
    <DnaDataTableCard
      toolbarProps={{
        searchQuery,
        onSearchChange,
        searchPlaceholder: "Cari SKU, nama material, spesifikasi, rak...",
        statusOptions: [
          { label: "Aman", value: "AMAN", dotColor: "bg-emerald-500" },
          { label: "Low Stock", value: "LOW_STOCK", dotColor: "bg-amber-500" },
          { label: "Habis", value: "OUT_OF_STOCK", dotColor: "bg-rose-500" },
        ],
        selectedStatus: statusFilter,
        onSelectStatus: onStatusFilterChange,
        statusPlaceholder: "Status Stok",
        filterColumns: [
          {
            key: "category",
            label: "Kategori Material",
            options: ["Bahan Baku", "Bahan Kemas", "Barang Jadi"],
          },
          {
            key: "warehouse",
            label: "Lokasi Gudang",
            options: warehouseOptions,
          },
          {
            key: "stock_qty",
            label: "Kuantitas Fisik",
            type: "sort_numeric",
          },
          {
            key: "valuation",
            label: "Valuasi FIFO",
            type: "sort_numeric",
          },
        ],
        selectedColumn,
        onSelectColumn: (col) => {
          onSelectColumn(col);
          onFilterValueChange("ALL");
        },
        filterValue,
        onFilterValueChange,
        enableDateFilter: true,
        dateMode,
        onDateModeChange,
        startDate,
        onStartDateChange,
        endDate,
        onEndDateChange,
        onResetAll,
      }}
    >
        <div className="overflow-x-auto">
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
              <DnaTh className="px-3 py-3 h-[40px] w-[45px] text-center">#</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] w-[130px]">Kode SKU / Bahan</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] min-w-[200px]">Nama Barang & Spesifikasi</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] w-[130px]">Kategori Material</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] min-w-[160px]">Gudang Penyimpanan</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] w-[130px]">Lokasi Bin / Rak</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-right w-[120px]">Kuantitas Fisik</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-center w-[75px]">Satuan</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-right w-[110px]">Safety Stock</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-right w-[150px]">Valuasi Nilai FIFO (Rp)</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-center w-[110px]">Status</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-right w-[65px]">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {filteredList.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={12} className="py-12 text-center text-slate-400">
                  <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  Tidak ada data persediaan barang yang sesuai kriteria pencarian & filter.
                </DnaTd>
              </DnaTableRow>
            ) : (
              filteredList.map((item, idx) => (
                <DnaTableRow
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className="hover:bg-slate-50/60 transition-colors cursor-pointer group h-[48px]"
                >
                  {/* 1: # Index */}
                  <DnaTd className="px-3 py-2 text-center text-slate-400 font-mono text-[11px]">
                    {idx + 1}
                  </DnaTd>

                  {/* 2: Kode SKU / Bahan */}
                  <DnaTd className="px-3 py-2 font-mono text-xs font-bold text-blue-700">
                    {item.itemCode}
                  </DnaTd>

                  {/* 3: Nama Barang & Spesifikasi */}
                  <DnaTd className="px-3 py-2 text-slate-900 font-medium">
                    <div className="truncate max-w-[260px] font-semibold">{item.itemName}</div>
                    {item.specifications && item.specifications !== "-" && (
                      <div className="truncate max-w-[260px] text-[11px] text-slate-400 font-normal">
                        {item.specifications}
                      </div>
                    )}
                  </DnaTd>

                  {/* 4: Kategori Material */}
                  <DnaTd className="px-3 py-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                      {item.category}
                    </span>
                  </DnaTd>

                  {/* 5: Gudang Penyimpanan */}
                  <DnaTd className="px-3 py-2 text-slate-700 truncate max-w-[180px]">
                    {item.warehouse}
                  </DnaTd>

                  {/* 6: Lokasi Bin / Rak */}
                  <DnaTd className="px-3 py-2 font-mono text-xs text-slate-600">
                    {item.rackLocation}
                  </DnaTd>

                  {/* 7: Kuantitas Fisik */}
                  <DnaTd className="px-3 py-2 text-right font-bold text-slate-900">
                    {item.qtyOnHand.toLocaleString("id-ID")}
                  </DnaTd>

                  {/* 8: Satuan */}
                  <DnaTd className="px-3 py-2 text-center text-slate-600 text-xs">
                    {item.unit}
                  </DnaTd>

                  {/* 9: Safety Stock */}
                  <DnaTd className="px-3 py-2 text-right text-slate-500 text-xs tabular-nums">
                    {item.safetyStock.toLocaleString("id-ID")}
                  </DnaTd>

                  {/* 10: Valuasi Nilai FIFO (Rp) */}
                  <DnaTd className="px-3 py-2 text-right font-bold text-emerald-700 tabular-nums">
                    {formatRupiah(item.totalValuation)}
                  </DnaTd>

                  {/* 11: Status */}
                  <DnaTd className="px-3 py-2 text-center">
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
                  </DnaTd>

                  {/* 12: Aksi */}
                  <DnaTd
                    className="px-3 py-2 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DnaButton
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectItem(item)}
                      className="text-slate-400 hover:text-blue-600 h-7 w-7 p-0"
                    >
                      <Eye className="w-4 h-4" />
                    </DnaButton>
                  </DnaTd>
                </DnaTableRow>
              ))
            )}
          </DnaTableBody>
        </DnaTable>
      </div>
    </DnaDataTableCard>
  );
}

