"use client";

import React from "react";
import { SlidersHorizontal, Eye } from "lucide-react";
import {
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaCell,
  formatRupiah,
} from "@/components/dna";
import type { StockAdjustment } from "../_types/adjustment.types";

interface WarehouseAdjustmentTableProps {
  filteredAdjustments: StockAdjustment[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
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
  onSelectAdjustment: (adjustment: StockAdjustment) => void;
}

export function WarehouseAdjustmentTable({
  filteredAdjustments,
  searchQuery,
  onSearchChange,
  selectedStatus,
  onSelectStatus,
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
  onSelectAdjustment,
}: WarehouseAdjustmentTableProps) {
  const getStatusBadge = (status: StockAdjustment["status"]) => {
    switch (status) {
      case "DRAFT":
        return <DnaBadge variant="neutral">Draft</DnaBadge>;
      case "PENDING":
      case "PENDING_APPROVAL":
        return <DnaBadge variant="warning">Menunggu Approval</DnaBadge>;
      case "APPROVED":
        return <DnaBadge variant="success">Disetujui (Jurnal Terbit)</DnaBadge>;
      case "REJECTED":
        return <DnaBadge variant="critical">Ditolak</DnaBadge>;
      default:
        return <DnaBadge variant="neutral">{status}</DnaBadge>;
    }
  };

  return (
    <DnaDataTableCard
      toolbarProps={{
        searchQuery,
        onSearchChange,
        searchPlaceholder: "Cari No. Adjustment, Gudang, PIC, Akun CoA...",
        statusOptions: [
          { value: "PENDING_APPROVAL", label: "Menunggu Approval", dotColor: "bg-amber-500" },
          { value: "APPROVED", label: "Disetujui (Jurnal Terbit)", dotColor: "bg-emerald-500" },
          { value: "REJECTED", label: "Ditolak", dotColor: "bg-rose-500" },
          { value: "DRAFT", label: "Draft", dotColor: "bg-zinc-400" },
        ],
        selectedStatus,
        onSelectStatus,
        statusPlaceholder: "Semua Status Approval",
        filterColumns: [
          {
            key: "adjustmentType",
            label: "Tipe Penyesuaian",
            type: "select",
            options: ["CORRECTION", "WRITE_OFF", "DISPOSAL", "QC_SAMPLING"],
          },
          {
            key: "warehouseName",
            label: "Gudang Lokasi",
            type: "select",
            options: warehouseOptions,
          },
        ],
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
      <div className="overflow-x-auto">
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
              <DnaTh className="px-3 py-3 h-[40px] w-[50px] text-center">#</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] w-[140px]">No. Adjustment</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] w-[130px]">Tanggal Pengajuan</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px]">Gudang Lokasi</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px]">Tipe Penyesuaian</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] w-[120px]">Akun Beban CoA</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px]">PIC Pengaju</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-right w-[120px]">Total Varians Qty</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-right w-[150px]">Varians Finansial (Rp)</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-center w-[140px]">Status Approval</DnaTh>
              <DnaTh className="px-4 py-3 h-[40px] text-right w-[60px]">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {filteredAdjustments.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={11} className="py-12 text-center text-slate-400">
                  <SlidersHorizontal className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  Tidak ada data penyesuaian stok yang sesuai filter.
                </DnaTd>
              </DnaTableRow>
            ) : (
              filteredAdjustments.map((adj, index) => (
                <DnaTableRow
                  key={adj.id}
                  onClick={() => onSelectAdjustment(adj)}
                  className="hover:bg-slate-50/60 transition-colors cursor-pointer group h-[48px]"
                >
                  {/* # */}
                  <DnaTd className="px-3 py-2 text-center text-slate-400 text-xs tabular-nums">
                    {index + 1}
                  </DnaTd>

                  {/* No. Adjustment */}
                  <DnaTd className="px-3 py-2">
                    <DnaCell.Code value={adj.adjustmentNumber} />
                  </DnaTd>

                  {/* Tanggal Pengajuan */}
                  <DnaTd className="px-3 py-2 text-slate-600 whitespace-nowrap text-xs">
                    {adj.adjustmentDate}
                  </DnaTd>

                  {/* Gudang Lokasi */}
                  <DnaTd className="px-3 py-2 text-slate-800 font-medium text-xs truncate max-w-[160px]" title={adj.warehouseName}>
                    {adj.warehouseName}
                  </DnaTd>

                  {/* Tipe Penyesuaian */}
                  <DnaTd className="px-3 py-2 text-slate-700 text-xs">
                    {adj.adjustmentTypeLabel}
                  </DnaTd>

                  {/* Akun Beban CoA */}
                  <DnaTd className="px-3 py-2">
                    <DnaCell.Code value={adj.adjustmentAccountCode} />
                  </DnaTd>

                  {/* PIC Pengaju */}
                  <DnaTd className="px-3 py-2 text-slate-800 text-xs truncate max-w-[130px]" title={adj.createdBy}>
                    {adj.createdBy}
                  </DnaTd>

                  {/* Total Varians Qty */}
                  <DnaTd className="px-3 py-2 text-right">
                    <span
                      className={`tabular-nums font-semibold text-xs ${
                        adj.totalVarianceQty < 0
                          ? "text-rose-600"
                          : adj.totalVarianceQty > 0
                          ? "text-emerald-700"
                          : "text-slate-600"
                      }`}
                    >
                      {adj.totalVarianceQty > 0 ? `+${adj.totalVarianceQty}` : adj.totalVarianceQty} Unit
                    </span>
                  </DnaTd>

                  {/* Varians Finansial (Rp) */}
                  <DnaTd className="px-3 py-2 text-right">
                    <span
                      className={`tabular-nums font-semibold text-xs ${
                        adj.totalVarianceValuation < 0 ? "text-rose-600" : "text-emerald-700"
                      }`}
                    >
                      {formatRupiah(adj.totalVarianceValuation)}
                    </span>
                  </DnaTd>

                  {/* Status Approval */}
                  <DnaTd className="px-3 py-2 text-center">
                    {getStatusBadge(adj.status)}
                  </DnaTd>

                  {/* Aksi */}
                  <DnaTd className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                    <DnaButton
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectAdjustment(adj)}
                      className="text-slate-400 hover:text-blue-600"
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
