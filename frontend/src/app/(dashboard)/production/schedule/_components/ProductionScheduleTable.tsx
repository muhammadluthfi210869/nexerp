"use client";

import React from "react";
import { Eye, Plus, Calendar, Table as TableIcon, Printer } from "lucide-react";
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
  ProductionScheduleItem,
  STAGE_CONFIG,
  STATUS_CONFIG,
  ScheduleViewMode,
} from "../_types/schedule.types";

interface ProductionScheduleTableProps {
  filteredSchedules: ProductionScheduleItem[];
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
  viewMode: ScheduleViewMode;
  onToggleViewMode: () => void;
  onCreateClick: () => void;
  onViewDetail: (item: ProductionScheduleItem) => void;
  onPrint?: (item: ProductionScheduleItem) => void;
}

export function ProductionScheduleTable({
  filteredSchedules,
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
  viewMode,
  onToggleViewMode,
  onCreateClick,
  onViewDetail,
  onPrint,
}: ProductionScheduleTableProps) {
  return (
    <DnaDataTableCard
      count={filteredSchedules.length}
      totalItems={totalItems}
      toolbarProps={{
        searchValue: searchQuery,
        onSearchChange,
        searchPlaceholder: "Cari jadwal, SPK, SO, produk, klien, brand...",
        statusOptions,
        selectedStatus,
        onSelectStatus,
        statusPlaceholder: "Semua Status",
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
          label: "Buat Jadwal",
          onClick: onCreateClick,
          icon: <Plus className="w-4 h-4" />,
        },
        extraActions: (
          <DnaButton
            variant="secondary"
            size="sm"
            onClick={onToggleViewMode}
            className="flex items-center gap-1.5"
          >
            {viewMode === "GANTT" ? (
              <>
                <TableIcon className="w-3.5 h-3.5" />
                <span>Tampilan Tabel</span>
              </>
            ) : (
              <>
                <Calendar className="w-3.5 h-3.5" />
                <span>Tampilan Gantt</span>
              </>
            )}
          </DnaButton>
        ),
      }}
    >
      <div className="overflow-x-auto">
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
              <DnaTh className="px-3 py-3 h-[40px] w-[45px] text-center">#</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] w-[140px]">No. SPK / Jadwal</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] w-[110px]">Tanggal Mulai</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] w-[110px]">Target Selesai</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] w-[130px]">No. Sales Order (SO)</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] min-w-[150px]">Klien / Brand</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] min-w-[180px]">Nama Produk Jadi</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-right w-[150px]">Target Batch Qty (Pcs/Kg)</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-center w-[120px]">Tahapan Saat Ini</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-center w-[120px]">Status Produksi</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-right w-[65px]">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {filteredSchedules.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={11} className="py-12 text-center text-xs text-slate-400">
                  Tidak ada jadwal produksi yang sesuai kriteria pencarian & filter.
                </DnaTd>
              </DnaTableRow>
            ) : (
              filteredSchedules.map((item, idx) => {
                const stageInfo = STAGE_CONFIG[item.stage] || { label: item.stage, badge: "info" };
                const statusInfo = STATUS_CONFIG[item.status] || { label: item.status, badge: "default" };

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

                    {/* 2: No. SPK / Jadwal */}
                    <DnaTd className="px-3 py-2">
                      <DnaCell.Code value={item.code} />
                    </DnaTd>

                    {/* 3: Tanggal Mulai */}
                    <DnaTd className="px-3 py-2 text-slate-700 text-xs">
                      {item.startDate}
                    </DnaTd>

                    {/* 4: Target Selesai */}
                    <DnaTd className="px-3 py-2 text-slate-700 text-xs">
                      {item.endDate}
                    </DnaTd>

                    {/* 5: No. Sales Order (SO) */}
                    <DnaTd className="px-3 py-2">
                      <span className="font-mono text-[11.5px] text-slate-600 font-medium">
                        {item.soNumber}
                      </span>
                    </DnaTd>

                    {/* 6: Klien / Brand */}
                    <DnaTd className="px-3 py-2 text-slate-800 text-xs font-medium">
                      {item.customerName} ({item.brandName})
                    </DnaTd>

                    {/* 7: Nama Produk Jadi */}
                    <DnaTd className="px-3 py-2 text-slate-900 text-xs font-semibold">
                      {item.productName}
                    </DnaTd>

                    {/* 8: Target Batch Qty (Pcs/Kg) */}
                    <DnaTd className="px-3 py-2 text-right font-mono text-xs font-semibold text-slate-800">
                      {item.targetQty.toLocaleString("id-ID")} {item.unit}
                    </DnaTd>

                    {/* 9: Tahapan Saat Ini */}
                    <DnaTd className="px-3 py-2 text-center">
                      <DnaBadge variant={stageInfo.badge as any}>
                        {stageInfo.label}
                      </DnaBadge>
                    </DnaTd>

                    {/* 10: Status Produksi */}
                    <DnaTd className="px-3 py-2 text-center">
                      <DnaBadge variant={statusInfo.badge as any}>
                        {statusInfo.label}
                      </DnaBadge>
                    </DnaTd>

                    {/* 11: Aksi */}
                    <DnaTd className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {onPrint && (
                          <DnaButton
                            variant="ghost"
                            size="sm"
                            onClick={() => onPrint(item)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700"
                            title="Cetak SPK Produksi (A4)"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </DnaButton>
                        )}
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetail(item)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700"
                          title="Lihat Detail & SLA"
                        >
                          <Eye className="w-3.5 h-3.5" />
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
