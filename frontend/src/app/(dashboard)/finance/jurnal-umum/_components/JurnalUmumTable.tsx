"use client";

import React from "react";
import { Eye, FileText } from "lucide-react";
import {
  DnaDataTableCard,
  DnaTable,
  DnaTableHead,
  DnaTh,
  DnaTableBody,
  DnaTableRow,
  DnaTd,
  DnaCell,
  DnaButton,
  formatRupiah,
} from "@/components/dna";
import type { DnaFilterColumnConfig } from "@/components/dna";
import { JournalHeader } from "../_types/jurnal-umum.types";

interface JurnalUmumTableProps {
  filteredJournals: JournalHeader[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusOptions: { value: string; label: string; color?: "default" | "success" | "warning" | "critical" | "info" }[];
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
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
  onSelectJournal: (journal: JournalHeader) => void;
  onOpenCreateModal?: () => void;
}

export function JurnalUmumTable({
  filteredJournals,
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
  onSelectJournal,
  onOpenCreateModal,
}: JurnalUmumTableProps) {
  return (
    <DnaDataTableCard
      count={filteredJournals.length}
      toolbarProps={{
        searchValue: searchQuery,
        onSearchChange: onSearchChange,
        searchPlaceholder: "Cari nomor voucher, keterangan memo, atau no referensi...",
        statusOptions: statusOptions,
        selectedStatus: selectedStatus,
        onSelectStatus: onSelectStatus,
        statusPlaceholder: "Semua Status Posting",
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
        ...(onOpenCreateModal
          ? {
              actionButton: {
                label: "Buat Jurnal Baru",
                onClick: onOpenCreateModal,
              },
            }
          : {}),
      }}
    >
      <div className="overflow-x-auto">
        <DnaTable className="w-full text-left border-collapse text-[12px]">
          <DnaTableHead>
            <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider select-none">
              <DnaTh className="p-3.5 w-10 text-slate-400">#</DnaTh>
              <DnaTh className="p-3.5 min-w-[140px]">NO. VOUCHER JURNAL</DnaTh>
              <DnaTh className="p-3.5 min-w-[110px]">TANGGAL JURNAL</DnaTh>
              <DnaTh className="p-3.5 min-w-[120px]">TIPE REFERENSI</DnaTh>
              <DnaTh className="p-3.5 min-w-[140px]">NO. REFERENSI DOKUMEN</DnaTh>
              <DnaTh className="p-3.5 min-w-[200px]">KETERANGAN / MEMO</DnaTh>
              <DnaTh className="p-3.5 text-right min-w-[130px]">TOTAL DEBIT (RP)</DnaTh>
              <DnaTh className="p-3.5 text-right min-w-[130px]">TOTAL KREDIT (RP)</DnaTh>
              <DnaTh className="p-3.5 text-center min-w-[110px]">STATUS BALANCE</DnaTh>
              <DnaTh className="p-3.5 text-center min-w-[100px]">STATUS POSTING</DnaTh>
              <DnaTh align="center" className="p-3.5 text-center w-24">AKSI</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody className="divide-y divide-slate-100">
            {filteredJournals.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={11} className="py-12 text-center text-slate-400">
                  <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  Belum ada jurnal umum yang sesuai kriteria pencarian.
                </DnaTd>
              </DnaTableRow>
            ) : (
              filteredJournals.map((j, idx) => {
                const isBalanced = j.totalDebit === j.totalCredit && j.totalDebit > 0;
                return (
                  <DnaTableRow key={j.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* # */}
                    <DnaTd className="p-3.5 text-slate-400 tabular-nums text-[11px]">
                      {idx + 1}
                    </DnaTd>
                    {/* No. Voucher Jurnal */}
                    <DnaTd className="p-3.5">
                      <DnaCell.Code value={j.code} onClick={() => onSelectJournal(j)} />
                    </DnaTd>
                    {/* Tanggal Jurnal */}
                    <DnaTd className="p-3.5 text-slate-600 font-mono text-xs">
                      {j.date}
                    </DnaTd>
                    {/* Tipe Referensi */}
                    <DnaTd className="p-3.5">
                      <DnaCell.Badge
                        label={j.type}
                        status={
                          j.type === "AUTO_AR" ? "success" :
                          j.type === "AUTO_AP" ? "blue" :
                          j.type === "ADJUSTMENT" ? "orange" :
                          j.type === "AUTO_STOCK" ? "purple" : "slate"
                        }
                      />
                    </DnaTd>
                    {/* No. Referensi Dokumen */}
                    <DnaTd className="p-3.5 text-slate-700 font-mono text-xs font-medium">
                      {j.reference || "-"}
                    </DnaTd>
                    {/* Keterangan / Memo */}
                    <DnaTd className="p-3.5 text-slate-800 font-medium">
                      {j.description}
                    </DnaTd>
                    {/* Total Debit (Rp) */}
                    <DnaTd className="p-3.5 text-right font-semibold text-slate-900 tabular-nums">
                      {formatRupiah(j.totalDebit)}
                    </DnaTd>
                    {/* Total Kredit (Rp) */}
                    <DnaTd className="p-3.5 text-right font-semibold text-slate-900 tabular-nums">
                      {formatRupiah(j.totalCredit)}
                    </DnaTd>
                    {/* Status Balance */}
                    <DnaTd className="p-3.5 text-center">
                      <DnaCell.Badge
                        label={isBalanced ? "BALANCED" : "UNBALANCED"}
                        status={isBalanced ? "success" : "rose"}
                      />
                    </DnaTd>
                    {/* Status Posting */}
                    <DnaTd className="p-3.5 text-center">
                      <DnaCell.Badge
                        label={j.status || "POSTED"}
                        status={j.status === "DRAFT" ? "orange" : "success"}
                      />
                    </DnaTd>
                    {/* Aksi */}
                    <DnaTd align="center" className="p-3.5 text-center">
                      <DnaButton
                        variant="secondary"
                        size="sm"
                        onClick={() => onSelectJournal(j)}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Detail
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
