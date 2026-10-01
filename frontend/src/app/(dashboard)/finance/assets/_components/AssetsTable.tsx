import React from "react";
import { Search, Eye } from "lucide-react";
import {
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaInput,
  DnaTable,
  DnaTableHead,
  DnaTh,
  DnaTableBody,
  DnaTableRow,
  DnaTd,
  DnaCell,
} from "@/components/dna";
import type { DnaFilterColumnConfig } from "@/components/dna";
import type { AssetRegisterItem } from "../_types/assets.types";

interface AssetsTableProps {
  assets: AssetRegisterItem[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusOptions: { value: string; label: string; color?: "default" | "success" | "warning" | "critical" | "info" }[];
  selectedStatus: string;
  onSelectStatus: (val: string) => void;
  filterColumns: DnaFilterColumnConfig[];
  selectedColumn: string;
  onSelectColumn: (col: string) => void;
  filterValue: string;
  onFilterValueChange: (val: string) => void;
  dateMode: "ALL" | "1_DAY" | "1_WEEK" | "1_MONTH" | "1_YEAR" | "CUSTOM";
  onDateModeChange: (mode: "ALL" | "1_DAY" | "1_WEEK" | "1_MONTH" | "1_YEAR" | "CUSTOM") => void;
  startDate: string;
  onStartDateChange: (val: string) => void;
  endDate: string;
  onEndDateChange: (val: string) => void;
  onResetAll: () => void;
  onSelectAsset: (asset: AssetRegisterItem) => void;
}

export function AssetsTable({
  assets,
  searchQuery,
  setSearchQuery,
  statusOptions,
  selectedStatus,
  onSelectStatus,
  filterColumns,
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
  onResetAll,
  onSelectAsset,
}: AssetsTableProps) {
  return (
    <DnaDataTableCard
      count={assets.length}
      toolbarProps={{
        searchValue: searchQuery,
        onSearchChange: setSearchQuery,
        searchPlaceholder: "Cari kode aset, nama aset, lokasi, atau departemen...",
        statusOptions: statusOptions,
        selectedStatus: selectedStatus,
        onSelectStatus: onSelectStatus,
        statusPlaceholder: "Semua Status Aset",
        filterColumns: filterColumns,
        selectedColumn: selectedColumn,
        onSelectColumn: onSelectColumn,
        filterValue: filterValue,
        onFilterValueChange: onFilterValueChange,
        enableDateFilter: true,
        dateMode: dateMode,
        onDateModeChange: onDateModeChange,
        startDate: startDate,
        onStartDateChange: onStartDateChange,
        endDate: endDate,
        onEndDateChange: onEndDateChange,
        onResetAll: onResetAll,
      }}
    >
      <div className="overflow-x-auto">
        <DnaTable className="min-w-[1300px]">
          <DnaTableHead>
            <DnaTableRow>
              <DnaTh className="w-[45px] text-center">#</DnaTh>
              <DnaTh className="w-[140px]">Kode Aset</DnaTh>
              <DnaTh className="w-[200px]">Nama Aset Tetap</DnaTh>
              <DnaTh className="w-[140px]">Kategori Aset</DnaTh>
              <DnaTh className="w-[110px]">Tanggal Perolehan</DnaTh>
              <DnaTh align="right" className="w-[150px]">Harga Perolehan (Rp)</DnaTh>
              <DnaTh className="w-[160px]">Metode Depresiasi</DnaTh>
              <DnaTh align="center" className="w-[120px]">Masa Manfaat (Thn)</DnaTh>
              <DnaTh align="right" className="w-[160px]">Akumulasi Depresiasi (Rp)</DnaTh>
              <DnaTh align="right" className="w-[150px]">Nilai Buku (Rp)</DnaTh>
              <DnaTh align="center" className="w-[100px]">Status</DnaTh>
              <DnaTh align="center" className="w-[70px]">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {assets.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={12} className="py-8 text-center text-slate-400">
                  Tidak ada aset tetap yang sesuai dengan kriteria filter.
                </DnaTd>
              </DnaTableRow>
            ) : (
              assets.map((a, idx) => (
                <DnaTableRow
                  key={a.id}
                  onClick={() => onSelectAsset(a)}
                  className="hover:bg-slate-50/75 transition-colors cursor-pointer"
                >
                  <DnaTd align="center" className="text-slate-400 font-mono text-[11px]">
                    {idx + 1}
                  </DnaTd>
                  <DnaTd>
                    <DnaCell.Code value={a.assetCode} />
                  </DnaTd>
                  <DnaTd isPrimary>
                    <DnaCell.Text primary={a.name} secondary={`${a.location} • ${a.department}`} />
                  </DnaTd>
                  <DnaTd>
                    <DnaBadge variant="secondary">
                      {a.category}
                    </DnaBadge>
                  </DnaTd>
                  <DnaTd>
                    <DnaCell.Date value={a.acquisitionDate} />
                  </DnaTd>
                  <DnaTd align="right">
                    <DnaCell.Currency value={a.acquisitionCost} className="font-semibold text-slate-900" />
                  </DnaTd>
                  <DnaTd isMuted>
                    <DnaCell.Text primary={a.depreciationMethod} />
                  </DnaTd>
                  <DnaTd align="center">
                    <span className="font-semibold tabular-nums text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs">
                      {a.usefulLifeYears} Tahun
                    </span>
                  </DnaTd>
                  <DnaTd align="right">
                    <DnaCell.Currency value={a.accumDepreciation} className="font-semibold text-amber-700" />
                  </DnaTd>
                  <DnaTd align="right">
                    <DnaCell.Currency value={a.bookValue} className="font-bold text-emerald-700" />
                  </DnaTd>
                  <DnaTd align="center">
                    <DnaBadge
                      variant={
                        a.status === "AKTIF"
                          ? "success"
                          : a.status === "DISPOSAL"
                          ? "critical"
                          : "warning"
                      }
                    >
                      {a.status}
                    </DnaBadge>
                  </DnaTd>
                  <DnaTd align="center" onClick={(e) => e.stopPropagation()}>
                    <DnaButton
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectAsset(a)}
                      title="Lihat Detail & Riwayat"
                      className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
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
