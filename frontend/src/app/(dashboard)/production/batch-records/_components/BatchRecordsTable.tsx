"use client";

import React from "react";
import { Eye, Plus, Printer } from "lucide-react";
import {
  DnaDataTableCard,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaBadge,
  DnaButton,
  DnaCell,
} from "@/components/dna";
import {
  BatchRecordItem,
  BMR_STATUS_CONFIG,
} from "../_types/batch-records.types";

interface BatchRecordsTableProps {
  filteredList: BatchRecordItem[];
  totalItems?: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusOptions: Array<{ value: string; label: string; color?: "default" | "warning" | "critical" | "info" | "purple" | "success" }>;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  filterColumns: Array<{ key: string; label: string; type: "select" | "sort_numeric" | "sort_alpha"; options?: string[] }>;
  selectedColumn: string;
  onSelectColumn: (col: string) => void;
  filterValue: string;
  onFilterValueChange: (val: string) => void;
  dateMode: "ALL" | "1_DAY" | "1_WEEK" | "1_MONTH" | "1_YEAR" | "CUSTOM";
  onDateModeChange: (mode: "ALL" | "1_DAY" | "1_WEEK" | "1_MONTH" | "1_YEAR" | "CUSTOM") => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  onResetAll: () => void;
  onCreateClick: () => void;
  onViewDetail: (item: BatchRecordItem) => void;
  onPrintItem?: (item: BatchRecordItem) => void;
}

export function BatchRecordsTable({
  filteredList,
  totalItems,
  searchQuery,
  onSearchChange,
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
  onCreateClick,
  onViewDetail,
  onPrintItem,
}: BatchRecordsTableProps) {
  return (
    <DnaDataTableCard
      count={filteredList.length}
      totalItems={totalItems}
      toolbarProps={{
        searchValue: searchQuery,
        onSearchChange,
        searchPlaceholder: "Cari No. BMR, No. SPK, kode formula, nama produk, formulator...",
        statusOptions,
        selectedStatus,
        onSelectStatus,
        statusPlaceholder: "Semua Status QC",
        filterColumns,
        selectedColumn,
        onSelectColumn,
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
        actionButton: {
          label: "Buat BMR Baru",
          onClick: onCreateClick,
          icon: <Plus className="w-4 h-4" />,
        },
      }}
    >
      <div className="overflow-x-auto">
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold uppercase tracking-wider select-none h-[40px]">
              <DnaTh className="px-4 py-2.5 w-[50px] text-center">#</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[120px]">Tanggal Olah</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[140px]">No. Batch Record</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[130px]">No. SPK Ref</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[150px]">Kode Formulasi Ref</DnaTh>
              <DnaTh className="px-4 py-2.5 min-w-[180px]">Nama Produk</DnaTh>
              <DnaTh className="px-4 py-2.5 text-right w-[130px]">Ukuran Batch (Kg)</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[160px]">Nama Formulator / PIC</DnaTh>
              <DnaTh className="px-4 py-2.5 text-right w-[130px]">Yield Realisasi (%)</DnaTh>
              <DnaTh className="px-4 py-2.5 text-center w-[130px]">Status Release QC</DnaTh>
              <DnaTh className="pr-4 py-2.5 text-right w-[65px]">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {filteredList.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={11} className="py-12 text-center text-xs text-slate-400">
                  Tidak ada data Batch Record (BMR) yang sesuai kriteria pencarian & filter.
                </DnaTd>
              </DnaTableRow>
            ) : (
              filteredList.map((item, idx) => {
                const statusInfo = BMR_STATUS_CONFIG[item.qcReleaseStatus] || {
                  label: item.qcReleaseStatus,
                  badge: "default",
                };

                return (
                  <DnaTableRow
                    key={item.id}
                    onClick={() => onViewDetail(item)}
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer group h-[48px]"
                  >
                    {/* 1: # Index */}
                    <DnaTd className="px-4 py-2.5 text-center text-slate-400 tabular-nums text-xs font-mono">
                      {idx + 1}
                    </DnaTd>

                    {/* 2: Tanggal Mulai Olah */}
                    <DnaTd className="px-4 py-2.5 text-slate-700 text-xs whitespace-nowrap">
                      {item.startDate}
                    </DnaTd>

                    {/* 3: No. Batch Record */}
                    <DnaTd className="px-4 py-2.5">
                      <DnaCell.Code value={item.batchRecordCode} />
                    </DnaTd>

                    {/* 4: No. SPK Ref */}
                    <DnaTd className="px-4 py-2.5">
                      <span className="text-[11.5px] text-slate-700 font-medium">
                        {item.spkRef}
                      </span>
                    </DnaTd>

                    {/* 5: Kode Formulasi Ref */}
                    <DnaTd className="px-4 py-2.5">
                      <span className="text-[11.5px] text-blue-700 font-semibold">
                        {item.formulaRef}
                      </span>
                    </DnaTd>

                    {/* 6: Nama Produk */}
                    <DnaTd className="px-4 py-2.5 text-slate-900 text-xs font-medium">
                      {item.productName}
                    </DnaTd>

                    {/* 7: Ukuran Batch (Kg) */}
                    <DnaTd className="px-4 py-2.5 text-right tabular-nums text-xs font-semibold text-slate-800">
                      {item.batchSizeKg.toLocaleString("id-ID")} Kg
                    </DnaTd>

                    {/* 8: Nama Formulator / PIC */}
                    <DnaTd className="px-4 py-2.5 text-slate-800 text-xs">
                      <DnaCell.Avatar name={item.formulatorPic} />
                    </DnaTd>

                    {/* 9: Yield Realisasi (%) */}
                    <DnaTd className="px-4 py-2.5 text-right tabular-nums text-xs font-bold text-emerald-700">
                      {item.yieldPct}%
                    </DnaTd>

                    {/* 10: Status Release QC */}
                    <DnaTd className="px-4 py-2.5 text-center">
                      <DnaBadge variant={statusInfo.badge as any}>
                        {statusInfo.label}
                      </DnaBadge>
                    </DnaTd>

                    {/* 11: Aksi */}
                    <DnaTd className="pr-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {onPrintItem && (
                          <DnaButton
                            variant="ghost"
                            size="sm"
                            onClick={() => onPrintItem(item)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600"
                            title="Cetak Dokumen BMR CPKB"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </DnaButton>
                        )}
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetail(item)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
                          title="Lihat Detail BMR"
                        >
                          <Eye className="w-4 h-4" />
                        </DnaButton>
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
