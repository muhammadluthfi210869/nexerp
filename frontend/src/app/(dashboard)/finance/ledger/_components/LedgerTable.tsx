"use client";

import React from "react";
import { Eye, BookOpen, Calendar, RefreshCw } from "lucide-react";
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
  DnaInput,
  formatRupiah,
} from "@/components/dna";
import type { DnaFilterColumnConfig } from "@/components/dna";
import {
  LedgerTransaction,
  LedgerAccountSummary,
} from "../_types/ledger.types";

interface LedgerTableProps {
  transactions: LedgerTransaction[];
  accounts: LedgerAccountSummary[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
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
  onSelectTransaction: (tx: LedgerTransaction) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export function LedgerTable({
  transactions,
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
  onSelectTransaction,
  onRefresh,
  isLoading,
}: LedgerTableProps) {
  return (
    <DnaDataTableCard
      count={transactions.length}
      toolbarProps={{
        searchValue: searchQuery,
        onSearchChange: onSearchChange,
        searchPlaceholder: "Cari nomor jurnal ref, kode akun, uraian transaksi...",
        statusOptions: statusOptions,
        selectedStatus: selectedStatus,
        onSelectStatus: onSelectStatus,
        statusPlaceholder: "Semua Status Rekon",
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
        actionButton: {
          label: "Refresh GL",
          onClick: onRefresh,
        },
      }}
    >
        <div className="overflow-x-auto">
          <DnaTable className="w-full text-left border-collapse text-[12px]">
            <DnaTableHead>
              <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider select-none">
                <DnaTh className="p-3.5 w-10 text-slate-400">#</DnaTh>
                <DnaTh className="p-3.5 min-w-[110px]">TANGGAL POSTING</DnaTh>
                <DnaTh className="p-3.5 min-w-[130px]">NO. JURNAL REF</DnaTh>
                <DnaTh className="p-3.5 min-w-[100px]">KODE AKUN</DnaTh>
                <DnaTh className="p-3.5 min-w-[180px]">NAMA AKUN COA</DnaTh>
                <DnaTh className="p-3.5 min-w-[200px]">KETERANGAN TRANSAKSI</DnaTh>
                <DnaTh className="p-3.5 text-right min-w-[120px]">DEBIT (RP)</DnaTh>
                <DnaTh className="p-3.5 text-right min-w-[120px]">KREDIT (RP)</DnaTh>
                <DnaTh className="p-3.5 text-right min-w-[140px]">SALDO BERJALAN (RP)</DnaTh>
                <DnaTh className="p-3.5 text-center min-w-[110px]">STATUS REKON</DnaTh>
                <DnaTh align="center" className="p-3.5 text-center w-20">AKSI</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody className="divide-y divide-slate-100">
              {transactions.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={11} className="py-12 text-center text-slate-400">
                    <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Belum ada transaksi jurnal buku besar pada rentang filter ini.
                  </DnaTd>
                </DnaTableRow>
              ) : (
                transactions.map((tx, idx) => (
                  <DnaTableRow key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* # */}
                    <DnaTd className="p-3.5 text-slate-400 tabular-nums text-[11px]">
                      {idx + 1}
                    </DnaTd>
                    {/* Tanggal Posting */}
                    <DnaTd className="p-3.5 text-slate-600 font-mono text-xs">
                      {tx.postingDate}
                    </DnaTd>
                    {/* No. Jurnal Ref */}
                    <DnaTd className="p-3.5">
                      <DnaCell.Code value={tx.journalRef} onClick={() => onSelectTransaction(tx)} />
                    </DnaTd>
                    {/* Kode Akun */}
                    <DnaTd className="p-3.5 font-mono text-xs font-semibold text-blue-700">
                      {tx.accountCode}
                    </DnaTd>
                    {/* Nama Akun CoA */}
                    <DnaTd className="p-3.5 font-medium text-slate-800">
                      {tx.accountName}
                    </DnaTd>
                    {/* Keterangan Transaksi */}
                    <DnaTd className="p-3.5 text-slate-700">
                      {tx.description}
                    </DnaTd>
                    {/* Debit (Rp) */}
                    <DnaTd className="p-3.5 text-right font-semibold text-emerald-700 tabular-nums">
                      {tx.debit > 0 ? formatRupiah(tx.debit) : "-"}
                    </DnaTd>
                    {/* Kredit (Rp) */}
                    <DnaTd className="p-3.5 text-right font-semibold text-rose-700 tabular-nums">
                      {tx.credit > 0 ? formatRupiah(tx.credit) : "-"}
                    </DnaTd>
                    {/* Saldo Berjalan (Rp) */}
                    <DnaTd className="p-3.5 text-right font-bold text-slate-900 tabular-nums">
                      {formatRupiah(tx.runningBalance)}
                    </DnaTd>
                    {/* Status Rekon */}
                    <DnaTd className="p-3.5 text-center">
                      <DnaCell.Badge
                        label={tx.reconciliationStatus}
                        status={tx.reconciliationStatus === "RECONCILED" ? "success" : "orange"}
                      />
                    </DnaTd>
                    {/* Aksi */}
                    <DnaTd align="center" className="p-3.5 text-center">
                      <DnaButton
                        variant="secondary"
                        size="sm"
                        onClick={() => onSelectTransaction(tx)}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Detail
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
