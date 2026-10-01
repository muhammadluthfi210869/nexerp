"use client";

import React from "react";
import { Package, Eye } from "lucide-react";
import {
  DnaDataTableCard,
  DnaBadge,
  DnaButton,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaCell,
} from "@/components/dna";
import {
  SampleOrder,
  statusBadgeMap,
  statusLabelMap,
} from "../_types/sample-sales.types";

interface SampleTableProps {
  filteredOrders: SampleOrder[];
  totalCount: number;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusOptions: any[];
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  filterColumns: any[];
  selectedColumn: string;
  onSelectColumn: (col: string) => void;
  filterValue: string;
  onFilterValueChange: (val: string) => void;
  dateMode: "ALL" | "1_DAY" | "1_WEEK" | "1_MONTH" | "1_YEAR" | "CUSTOM";
  onDateModeChange: (mode: any) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  onResetAll: () => void;
  onSelectDetail: (order: SampleOrder) => void;
  onOpenCreate: () => void;
}

export function SampleTable({
  filteredOrders,
  totalCount,
  searchTerm,
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
  onSelectDetail,
  onOpenCreate,
}: SampleTableProps) {
  return (
    <DnaDataTableCard
      count={filteredOrders.length}
      totalItems={totalCount}
      toolbarProps={{
        searchPlaceholder: "Cari kode sample, pelanggan, brand, produk, formulator...",
        searchValue: searchTerm,
        onSearchChange: onSearchChange,
        statusOptions,
        selectedStatus,
        onSelectStatus,
        statusPlaceholder: "Status Sample",
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
      }}
    >
      <div className="w-full overflow-x-auto">
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-slate-600 text-[11px] font-bold uppercase tracking-wider select-none">
              <DnaTh className="px-3 py-2.5 w-[45px] text-center text-slate-400">#</DnaTh>
              <DnaTh className="px-3 py-2.5 min-w-[130px]">Kode Sample</DnaTh>
              <DnaTh className="px-3 py-2.5 min-w-[120px]">Tanggal Permintaan</DnaTh>
              <DnaTh className="px-3 py-2.5 min-w-[160px]">Pelanggan / Klien</DnaTh>
              <DnaTh className="px-3 py-2.5 min-w-[130px]">Nama Brand</DnaTh>
              <DnaTh className="px-3 py-2.5 min-w-[180px]">Nama Produk Sample</DnaTh>
              <DnaTh className="px-3 py-2.5 min-w-[140px]">Bentuk Fisik & Netto</DnaTh>
              <DnaTh className="px-3 py-2.5 min-w-[130px]">Formulator Lab</DnaTh>
              <DnaTh className="px-3 py-2.5 min-w-[110px]">Target Selesai</DnaTh>
              <DnaTh className="px-3 py-2.5 min-w-[120px] text-center">Status</DnaTh>
              <DnaTh className="pr-3 py-2.5 w-[65px] text-right">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {filteredOrders.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={11} className="text-center py-12 text-slate-400">
                  <Package className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                  <p className="font-semibold text-slate-600">Tidak ada sample ditemukan</p>
                  <p className="text-xs text-slate-400">Coba sesuaikan kata kunci pencarian atau filter status.</p>
                </DnaTd>
              </DnaTableRow>
            ) : (
              filteredOrders.map((sample, idx) => (
                <DnaTableRow
                  key={sample.id}
                  onClick={() => onSelectDetail(sample)}
                  className="h-[48px] hover:bg-slate-50/80 transition-colors cursor-pointer"
                >
                  <DnaTd className="px-3 py-2.5 text-center text-slate-400 tabular-nums text-[12px]">
                    {idx + 1}
                  </DnaTd>
                  <DnaTd className="px-3 py-2.5">
                    <DnaCell.Code code={sample.code} />
                  </DnaTd>
                  <DnaTd className="px-3 py-2.5">
                    <span className="tabular-nums text-[12px] text-slate-700">{sample.createdAt}</span>
                  </DnaTd>
                  <DnaTd className="px-3 py-2.5">
                    <span className="font-semibold text-slate-900 text-[12px] block truncate">{sample.customerName}</span>
                  </DnaTd>
                  <DnaTd className="px-3 py-2.5">
                    <span className="text-slate-700 text-[12px] block truncate">{sample.brandName || "Private Label"}</span>
                  </DnaTd>
                  <DnaTd className="px-3 py-2.5">
                    <span className="font-medium text-slate-800 text-[12px] block truncate">{sample.productName}</span>
                  </DnaTd>
                  <DnaTd className="px-3 py-2.5">
                    <span className="text-slate-600 text-[11.5px]">{sample.physicalForm} • {sample.volumeNetto}</span>
                  </DnaTd>
                  <DnaTd className="px-3 py-2.5">
                    <span className="text-slate-700 font-medium text-[12px]">{sample.formulator || "R&D Lab"}</span>
                  </DnaTd>
                  <DnaTd className="px-3 py-2.5">
                    <span className="tabular-nums text-slate-700 text-[11.5px]">{sample.targetDate || "—"}</span>
                  </DnaTd>
                  <DnaTd className="px-3 py-2.5 text-center">
                    <DnaBadge
                      variant={
                        sample.status === "COMPLETED"
                          ? "emerald"
                          : sample.status === "PROCESS"
                          ? "blue"
                          : sample.status === "SHIPPED"
                          ? "purple"
                          : sample.status === "PENDING"
                          ? "amber"
                          : "rose"
                      }
                    >
                      {statusLabelMap[sample.status] || sample.status}
                    </DnaBadge>
                  </DnaTd>
                  <DnaTd className="pr-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end">
                      <DnaButton
                        variant="ghost"
                        className="h-7 w-7 p-0 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                        onClick={() => onSelectDetail(sample)}
                        title="Lihat Detail"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </DnaButton>
                    </div>
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
