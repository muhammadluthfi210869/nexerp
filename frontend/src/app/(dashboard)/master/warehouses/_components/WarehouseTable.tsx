"use client";

import React from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Eye } from "lucide-react";
import {
  DnaDataTableCard,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaButton,
  DnaCell,
} from "@/components/dna";
import type { MasterWarehouseItem } from "../_types/warehouse.types";

interface WarehouseTableProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedFilterColumn: string;
  onSelectFilterColumn: (col: string) => void;
  filterColumnValue: string;
  onFilterValueChange: (val: string) => void;
  onOpenCreateWarehouse: () => void;
  currentPage: number;
  totalPages: number;
  totalEntries: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoadingWarehouses: boolean;
  isErrorWarehouses: boolean;
  warehousesError: unknown;
  onRetryWarehouses: () => void;
  paginatedWarehouses: MasterWarehouseItem[];
  sortColumn: string | null;
  sortDirection: "asc" | "desc";
  onSortToggle: (colKey: string) => void;
  onSelectWarehouse: (item: MasterWarehouseItem) => void;
  onEditWarehouse: (item: MasterWarehouseItem) => void;
  onDeleteWarehouse: (item: MasterWarehouseItem) => void;
}

export function WarehouseTable({
  searchQuery,
  onSearchChange,
  selectedFilterColumn,
  onSelectFilterColumn,
  filterColumnValue,
  onFilterValueChange,
  onOpenCreateWarehouse,
  currentPage,
  totalPages,
  totalEntries,
  pageSize,
  onPageChange,
  isLoadingWarehouses,
  isErrorWarehouses,
  warehousesError,
  onRetryWarehouses,
  paginatedWarehouses,
  sortColumn,
  sortDirection,
  onSortToggle,
  onSelectWarehouse,
  onEditWarehouse,
  onDeleteWarehouse,
}: WarehouseTableProps) {
  return (
    <DnaDataTableCard
      toolbarProps={{
        searchQuery,
        onSearchChange,
        searchPlaceholder: "Cari kode gudang, nama, PIC, lokasi...",
        filterColumns: [
          {
            key: "lokasi",
            label: "Wilayah Lokasi",
            type: "select",
            options: ["Sidoarjo", "Pasuruan", "Surabaya"],
          },
          {
            key: "tipe",
            label: "Tipe Suhu",
            type: "select",
            options: [
              "Suhu Ruang (Ambient)",
              "Cool Storage (15-25Â°C)",
              "Chiller (2-8Â°C)",
              "Flammable / Precursor",
            ],
          },
        ],
        selectedColumn: selectedFilterColumn,
        onSelectColumn: (col) => {
          onSelectFilterColumn(col);
          onFilterValueChange("ALL");
        },
        filterValue: filterColumnValue,
        onFilterValueChange,
        actionButton: {
          label: "Tambah Gudang",
          onClick: onOpenCreateWarehouse,
        },
      }}
      paginationProps={{
        currentPage,
        totalPages,
        totalEntries,
        pageSize,
        onPageChange,
      }}
    >
      <div className="overflow-x-auto">
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
              <DnaTh className="px-3.5 py-2.5 w-10 text-slate-400">#</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[110px]">Kode Gudang</DnaTh>
              <DnaTh
                className="px-3.5 py-2.5 cursor-pointer hover:bg-slate-100/60"
                onClick={() => onSortToggle("namaGudang")}
              >
                <div className="flex items-center justify-between gap-1">
                  <span>Nama Gudang</span>
                  {sortColumn === "namaGudang" ? (
                    sortDirection === "asc" ? (
                      <ArrowUp className="w-3 h-3 text-blue-600" />
                    ) : (
                      <ArrowDown className="w-3 h-3 text-blue-600" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              </DnaTh>
              <DnaTh className="px-3.5 py-2.5">Tipe Penyimpanan</DnaTh>
              <DnaTh className="px-3.5 py-2.5 text-right w-[110px]">Kapasitas Bin</DnaTh>
              <DnaTh
                className="px-3.5 py-2.5 cursor-pointer hover:bg-slate-100/60"
                onClick={() => onSortToggle("lokasi")}
              >
                <div className="flex items-center justify-between gap-1">
                  <span>Lokasi & Wilayah</span>
                  {sortColumn === "lokasi" ? (
                    sortDirection === "asc" ? (
                      <ArrowUp className="w-3 h-3 text-blue-600" />
                    ) : (
                      <ArrowDown className="w-3 h-3 text-blue-600" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              </DnaTh>
              <DnaTh className="px-3.5 py-2.5">PIC Gudang</DnaTh>
              <DnaTh className="px-3.5 py-2.5">Kontak Telepon</DnaTh>
              <DnaTh className="px-3.5 py-2.5 text-center w-[100px] whitespace-nowrap">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {isLoadingWarehouses ? (
              <DnaTableRow>
                <DnaTd colSpan={9} className="p-8 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span>Memuat data gudang...</span>
                  </div>
                </DnaTd>
              </DnaTableRow>
            ) : isErrorWarehouses ? (
              <DnaTableRow>
                <DnaTd colSpan={9} className="p-8 text-center text-rose-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span>
                      Gagal memuat data gudang:{" "}
                      {(warehousesError as any)?.message || "Terjadi kesalahan"}
                    </span>
                    <button
                      onClick={onRetryWarehouses}
                      className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-medium rounded-md border border-rose-200 transition-colors"
                    >
                      Coba Lagi
                    </button>
                  </div>
                </DnaTd>
              </DnaTableRow>
            ) : paginatedWarehouses.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={9} className="p-8 text-center text-slate-400">
                  Tidak ada data gudang yang sesuai filter.
                </DnaTd>
              </DnaTableRow>
            ) : (
              paginatedWarehouses.map((w, idx) => {
                return (
                  <DnaTableRow
                    key={w.id}
                    className="h-[48px] hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => onSelectWarehouse(w)}
                  >
                    <DnaTd className="px-3.5 py-2.5 text-slate-400 tabular-nums">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5">
                      <DnaCell.Code>{w.kodeGudang}</DnaCell.Code>
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5">
                      <DnaCell.Text className="font-semibold text-slate-900">{w.namaGudang}</DnaCell.Text>
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5">
                      <DnaCell.Text className="text-slate-800">{w.tipePenyimpanan}</DnaCell.Text>
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5 text-right">
                      <DnaCell.Numeric value={w.totalBinLocations} suffix=" Slot" />
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5">
                      <DnaCell.NaturalPair
                        primary={w.lokasi}
                        secondary={w.provinsi}
                      />
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5">
                      <DnaCell.Text className="font-semibold text-slate-800">{w.picName}</DnaCell.Text>
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5">
                      <DnaCell.Text className="tabular-nums text-[11.5px] text-slate-600">{w.telepon || "-"}</DnaCell.Text>
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600"
                          onClick={() => onSelectWarehouse(w)}
                          title="Lihat Detail Fasilitas"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </DnaButton>
                        <DnaCell.Actions
                          onEdit={() => onEditWarehouse(w)}
                          onDelete={() => onDeleteWarehouse(w)}
                        />
                      </div>
                    </DnaTd>
                  </DnaTableRow>
                );
              })
            )}
          </DnaTableBody>
        </DnaTable>
      </div>
    </DnaDataTableCard>
  );
}
