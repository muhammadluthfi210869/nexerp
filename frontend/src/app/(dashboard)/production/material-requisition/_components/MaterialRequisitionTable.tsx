"use client";

import React from "react";
import Link from "next/link";
import { Eye, Plus, Warehouse } from "lucide-react";
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
  MaterialRequisitionItem,
  MR_STATUS_CONFIG,
} from "../_types/material-requisition.types";

interface MaterialRequisitionTableProps {
  filteredList: MaterialRequisitionItem[];
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
  onViewDetail: (item: MaterialRequisitionItem) => void;
}

export function MaterialRequisitionTable({
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
}: MaterialRequisitionTableProps) {
  return (
    <DnaDataTableCard
      count={filteredList.length}
      totalItems={totalItems}
      toolbarProps={{
        searchValue: searchQuery,
        onSearchChange,
        searchPlaceholder: "Cari No. MR, No. SPK, produk, gudang, pemohon...",
        statusOptions,
        selectedStatus,
        onSelectStatus,
        statusPlaceholder: "Semua Status MR",
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
          label: "Buat Permintaan (MR)",
          onClick: onCreateClick,
          icon: <Plus className="w-4 h-4" />,
        },
        extraActions: (
          <Link href="/warehouse/stok">
            <DnaButton variant="secondary" size="sm">
              <Warehouse className="w-3.5 h-3.5 mr-1.5" />
              Cek Stok Gudang
            </DnaButton>
          </Link>
        ),
      }}
    >
      <div className="overflow-x-auto">
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
              <DnaTh className="px-3 py-3 h-[40px] w-[45px] text-center">#</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] w-[150px]">No. Permintaan (MR)</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] w-[120px]">Tanggal Pengajuan</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] w-[130px]">No. SPK Ref</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] min-w-[180px]">Nama Produk Target</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] min-w-[160px]">Gudang Asal Bahan</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-center w-[130px]">Total Macam Bahan</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-right w-[130px]">Total Qty (Kg/L)</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] w-[140px]">PIC Pemohon</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-center w-[140px]">Status Pengeluaran</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-right w-[65px]">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {filteredList.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={11} className="py-12 text-center text-xs text-slate-400">
                  Tidak ada Permintaan Bahan (MR) yang sesuai kriteria pencarian & filter.
                </DnaTd>
              </DnaTableRow>
            ) : (
              filteredList.map((item, idx) => {
                const statusInfo = MR_STATUS_CONFIG[item.status] || {
                  label: item.status,
                  badge: "default",
                };

                return (
                  <DnaTableRow
                    key={item.id}
                    onClick={() => onViewDetail(item)}
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer group h-[48px]"
                  >
                    {/* 1: # Index */}
                    <DnaTd className="px-3 py-2 text-center text-slate-400 font-mono text-[11px]">
                      {idx + 1}
                    </DnaTd>

                    {/* 2: No. Permintaan (MR) */}
                    <DnaTd className="px-3 py-2">
                      <DnaCell.Code value={item.requisitionCode} />
                    </DnaTd>

                    {/* 3: Tanggal Pengajuan */}
                    <DnaTd className="px-3 py-2 text-slate-700 text-xs">
                      {item.requestDate}
                    </DnaTd>

                    {/* 4: No. SPK Ref */}
                    <DnaTd className="px-3 py-2">
                      <span className="font-mono text-[11.5px] text-blue-700 font-semibold">
                        {item.spkRef}
                      </span>
                    </DnaTd>

                    {/* 5: Nama Produk Target */}
                    <DnaTd className="px-3 py-2 text-slate-900 text-xs font-semibold">
                      {item.targetProduct}
                    </DnaTd>

                    {/* 6: Gudang Asal Bahan */}
                    <DnaTd className="px-3 py-2 text-slate-700 text-xs">
                      {item.sourceWarehouse}
                    </DnaTd>

                    {/* 7: Total Macam Bahan */}
                    <DnaTd className="px-3 py-2 text-center font-mono text-xs font-semibold text-slate-800">
                      {item.totalMaterialTypes} Macam
                    </DnaTd>

                    {/* 8: Total Qty (Kg/L) */}
                    <DnaTd className="px-3 py-2 text-right font-mono text-xs font-bold text-slate-900">
                      {item.totalQty.toLocaleString("id-ID")} {item.qtyUnit}
                    </DnaTd>

                    {/* 9: PIC Pemohon */}
                    <DnaTd className="px-3 py-2 text-slate-800 text-xs">
                      <DnaCell.Avatar name={item.requesterPic} />
                    </DnaTd>

                    {/* 10: Status Pengeluaran */}
                    <DnaTd className="px-3 py-2 text-center">
                      <DnaBadge variant={statusInfo.badge as any}>
                        {statusInfo.label}
                      </DnaBadge>
                    </DnaTd>

                    {/* 11: Aksi */}
                    <DnaTd className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetail(item)}
                        className="h-8 w-8 p-0"
                        title="Lihat Detail MR"
                      >
                        <Eye className="w-4 h-4 text-slate-600" />
                      </DnaButton>
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
