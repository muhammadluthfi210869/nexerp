"use client";

import React from "react";
import { ArrowUpRight, Wallet, Eye, Printer } from "lucide-react";
import {
  DnaDataTableCard,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaCell,
  DnaButton,
} from "@/components/dna";
import { statusBadgeConfig, type DpRecord } from "../_types/down-payment.types";

interface DpTableProps {
  filteredRecords: DpRecord[];
  totalRecords: number;
  searchTerm: string;
  onSearchChange: (val: string) => void;
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
  onOpenCreate: () => void;
  onSelectRecord: (record: DpRecord) => void;
  onAllocate: (record: DpRecord) => void;
  onPrint?: (record: DpRecord) => void;
}

export function DpTable({
  filteredRecords,
  totalRecords,
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
  onOpenCreate,
  onSelectRecord,
  onAllocate,
  onPrint,
}: DpTableProps) {
  return (
    <DnaDataTableCard
      count={filteredRecords.length}
      totalItems={totalRecords}
      toolbarProps={{
        searchValue: searchTerm,
        onSearchChange: onSearchChange,
        searchPlaceholder: "Cari nomor DP, klien, brand, atau ref...",
        statusOptions,
        selectedStatus,
        onSelectStatus,
        statusPlaceholder: "Status Penggunaan DP",
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
      <div className="overflow-x-auto">
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
              <DnaTh className="px-3.5 py-2.5 w-[45px] text-center text-slate-400">#</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[160px]">No. DP Penjualan</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[110px]">Tanggal DP</DnaTh>
              <DnaTh className="px-3.5 py-2.5 min-w-[170px]">Pelanggan / Klien</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[130px]">Nama Brand</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[150px]">No. Referensi (SO/NPF)</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[150px] text-right">Total Nominal DP (Rp)</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[150px] text-right">Sisa Saldo DP (Rp)</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[130px] text-center">Kategori DP</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[120px] text-center">Status</DnaTh>
              <DnaTh className="pr-4 py-2.5 w-[110px] text-right">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {filteredRecords.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={11} className="text-center py-12 text-slate-400">
                  <Wallet className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                  <p className="font-semibold text-slate-600">Tidak ada data uang muka pada kategori ini</p>
                  <p className="text-xs text-slate-400">Pilih tab lain atau klik tombol Terima Uang Muka Baru.</p>
                </DnaTd>
              </DnaTableRow>
            ) : (
              filteredRecords.map((dp, idx) => (
                <DnaTableRow
                  key={dp.id}
                  onClick={() => onSelectRecord(dp)}
                  className="h-[48px] hover:bg-slate-50/60 transition-colors cursor-pointer group"
                >
                  <DnaTd className="px-3.5 py-2.5 text-center text-slate-400 tabular-nums text-[12px]">{idx + 1}</DnaTd>
                  <DnaTd className="px-3.5 py-2.5">
                    <DnaCell.Code code={dp.code} />
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5">
                    <DnaCell.Text text={dp.date} />
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5">
                    <span className="font-semibold text-slate-900 text-[12px] line-clamp-1">{dp.customerName}</span>
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5">
                    <span className="text-slate-600 text-[12px] line-clamp-1">{dp.brandName}</span>
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5">
                    <DnaCell.Code code={dp.refNumber || "—"} />
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5 text-right">
                    <DnaCell.Numeric value={dp.amount} prefix="Rp " />
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5 text-right tabular-nums">
                    <span className="font-bold text-emerald-600 text-[12px]">
                      Rp {dp.remainingAmount.toLocaleString("id-ID")}
                    </span>
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5 text-center">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {dp.category === "sample"
                        ? "Sample R&D"
                        : dp.category === "legalitas"
                        ? "Legalitas"
                        : "PO Produksi"}
                    </span>
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5 text-center">
                    <DnaCell.Badge
                      status={statusBadgeConfig[dp.status]?.status || "default"}
                      label={statusBadgeConfig[dp.status]?.label || dp.status}
                    />
                  </DnaTd>
                  <DnaTd className="pr-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {onPrint && (
                        <DnaButton
                          variant="ghost"
                          className="h-7 w-7 p-0 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                          onClick={() => onPrint(dp)}
                          title="Cetak Kwitansi DP (A4)"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </DnaButton>
                      )}
                      <DnaButton
                        variant="ghost"
                        className="h-7 w-7 p-0 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                        onClick={() => onSelectRecord(dp)}
                        title="Lihat Detail Uang Muka"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </DnaButton>
                      {dp.remainingAmount > 0 && (
                        <DnaButton
                          variant="ghost"
                          className="h-7 w-7 p-0 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600"
                          onClick={() => onAllocate(dp)}
                          title="Alokasikan ke Faktur"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </DnaButton>
                      )}
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
