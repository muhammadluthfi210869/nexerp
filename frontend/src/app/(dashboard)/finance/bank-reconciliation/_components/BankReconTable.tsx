import React from "react";
import { Eye, CheckCircle2, RefreshCw } from "lucide-react";
import {
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaTable,
  DnaTableHead,
  DnaTh,
  DnaTableBody,
  DnaTableRow,
  DnaTd,
  DnaCell,
  formatRupiah,
} from "@/components/dna";
import type { DnaFilterColumnConfig } from "@/components/dna";
import {
  ReconciliationSessionItem,
  BankStatementLine,
  SystemTransaction,
} from "../_types/bank-reconciliation.types";

interface BankReconTableProps {
  sessions: ReconciliationSessionItem[];
  bankLines: BankStatementLine[];
  systemLines: SystemTransaction[];
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
  onSelectSession: (session: ReconciliationSessionItem) => void;
  onAutoMatch: () => void;
  isAutoMatching: boolean;
}

export const BankReconTable: React.FC<BankReconTableProps> = ({
  sessions,
  bankLines,
  systemLines,
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
  onSelectSession,
  onAutoMatch,
  isAutoMatching,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. MAIN RECONCILIATION SESSIONS TABLE */}
      <DnaDataTableCard
        title="Daftar Sesi Rekonsiliasi Bank"
        description="Ringkasan status keseimbangan buku kas/bank vs rekening koran pihak ketiga"
        count={sessions.length}
        toolbarProps={{
          searchValue: searchQuery,
          onSearchChange: setSearchQuery,
          searchPlaceholder: "Cari nomor rekon, nama bank, atau no rekening...",
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
        }}
      >
        <div className="overflow-x-auto">
          <DnaTable className="min-w-[1100px]">
            <DnaTableHead>
              <DnaTableRow>
                <DnaTh className="w-[45px] text-center">#</DnaTh>
                <DnaTh className="w-[150px]">No. Rekonsiliasi</DnaTh>
                <DnaTh className="w-[160px]">Periode Rekon</DnaTh>
                <DnaTh className="w-[220px]">Nama Bank & No. Rekening</DnaTh>
                <DnaTh align="right" className="w-[160px]">Saldo Rek Koran Bank (Rp)</DnaTh>
                <DnaTh align="right" className="w-[160px]">Saldo Buku Kas Sistem (Rp)</DnaTh>
                <DnaTh align="right" className="w-[150px]">Selisih / Varians (Rp)</DnaTh>
                <DnaTh align="center" className="w-[120px]">Jumlah Unmatched</DnaTh>
                <DnaTh align="center" className="w-[120px]">Status Rekon</DnaTh>
                <DnaTh align="center" className="w-[80px]">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {sessions.map((session, idx) => (
                <DnaTableRow
                  key={session.id}
                  onClick={() => onSelectSession(session)}
                  className="cursor-pointer hover:bg-slate-50/75 transition-colors"
                >
                  <DnaTd align="center" className="text-slate-400 font-mono text-[11px]">
                    {idx + 1}
                  </DnaTd>
                  <DnaTd>
                    <DnaCell.Code value={session.reconNo} />
                  </DnaTd>
                  <DnaTd>
                    <DnaCell.Text primary={session.period} />
                  </DnaTd>
                  <DnaTd isPrimary>
                    <DnaCell.Text
                      primary={session.bankName}
                      secondary={session.accountNumber}
                    />
                  </DnaTd>
                  <DnaTd align="right">
                    <DnaCell.Currency value={session.statementBalance} className="font-semibold text-blue-700" />
                  </DnaTd>
                  <DnaTd align="right">
                    <DnaCell.Currency value={session.bookBalance} className="font-semibold text-slate-800" />
                  </DnaTd>
                  <DnaTd align="right">
                    <DnaCell.Currency
                      value={session.difference}
                      className={`font-bold ${session.difference === 0 ? "text-emerald-700" : "text-amber-700"}`}
                    />
                  </DnaTd>
                  <DnaTd align="center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      session.unmatchedCount === 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    }`}>
                      {session.unmatchedCount} Item
                    </span>
                  </DnaTd>
                  <DnaTd align="center">
                    <DnaBadge variant={session.reconStatus === "RECONCILED" ? "success" : "warning"}>
                      {session.reconStatus}
                    </DnaBadge>
                  </DnaTd>
                  <DnaTd align="center" onClick={(e) => e.stopPropagation()}>
                    <DnaButton
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectSession(session)}
                      title="Lihat Rincian Matching"
                      className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </DnaButton>
                  </DnaTd>
                </DnaTableRow>
              ))}
            </DnaTableBody>
          </DnaTable>
        </div>
      </DnaDataTableCard>

      {/* 2. SIDE-BY-SIDE MATCHING ENGINE (Clean separate columns per table) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* KOLOM KIRI: BANK STATEMENT LINES */}
        <DnaDataTableCard
          customToolbar={
            <div className="flex items-center justify-between w-full py-1">
              <span className="text-xs font-bold text-slate-700 uppercase">Rekening Koran Bank</span>
              <span className="text-[11px] text-slate-500 font-medium">{bankLines.length} baris mutasi</span>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <DnaTable className="w-full text-left text-xs">
              <DnaTableHead>
                <DnaTableRow>
                  <DnaTh className="w-[100px]">Tanggal</DnaTh>
                  <DnaTh>Keterangan Bank</DnaTh>
                  <DnaTh align="right" className="w-[120px]">Nominal (Rp)</DnaTh>
                  <DnaTh align="center" className="w-[100px]">Status</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {bankLines.length === 0 ? (
                  <DnaTableRow>
                    <DnaTd colSpan={4} className="py-6 text-center text-slate-400">
                      Belum ada mutasi rekening koran yang diimpor.
                    </DnaTd>
                  </DnaTableRow>
                ) : (
                  bankLines.map((b) => (
                    <DnaTableRow key={b.id}>
                      <DnaTd>
                        <DnaCell.Date value={b.date} />
                      </DnaTd>
                      <DnaTd isPrimary>
                        <DnaCell.Text primary={b.description} secondary={b.systemTxId || "Statement Line"} />
                      </DnaTd>
                      <DnaTd align="right">
                        <DnaCell.Currency
                          value={b.amount}
                          className={`font-bold ${b.amount >= 0 ? "text-emerald-700" : "text-rose-700"}`}
                        />
                      </DnaTd>
                      <DnaTd align="center">
                        <DnaBadge variant={b.matched ? "success" : "warning"}>
                          {b.matched ? "MATCHED" : "UNMATCHED"}
                        </DnaBadge>
                      </DnaTd>
                    </DnaTableRow>
                  ))
                )}
              </DnaTableBody>
            </DnaTable>
          </div>
        </DnaDataTableCard>

        {/* KOLOM KANAN: SYSTEM LEDGER TRANSACTIONS */}
        <DnaDataTableCard
          customToolbar={
            <div className="flex items-center justify-between w-full py-1">
              <span className="text-xs font-bold text-slate-700 uppercase">Buku Kas & Bank ERP</span>
              <span className="text-[11px] text-slate-500 font-medium">{systemLines.length} transaksi sistem</span>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <DnaTable className="w-full text-left text-xs">
              <DnaTableHead>
                <DnaTableRow>
                  <DnaTh className="w-[120px]">No. Dokumen</DnaTh>
                  <DnaTh className="w-[100px]">Tanggal</DnaTh>
                  <DnaTh>Deskripsi Sistem</DnaTh>
                  <DnaTh align="right" className="w-[120px]">Nominal (Rp)</DnaTh>
                  <DnaTh align="center" className="w-[100px]">Status</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {systemLines.length === 0 ? (
                  <DnaTableRow>
                    <DnaTd colSpan={5} className="py-6 text-center text-slate-400">
                      Tidak ada transaksi kas/bank pada periode ini.
                    </DnaTd>
                  </DnaTableRow>
                ) : (
                  systemLines.map((s) => (
                    <DnaTableRow key={s.id}>
                      <DnaTd>
                        <DnaCell.Code value={s.docNo} />
                      </DnaTd>
                      <DnaTd>
                        <DnaCell.Date value={s.date} />
                      </DnaTd>
                      <DnaTd isPrimary>
                        <DnaCell.Text primary={s.description} />
                      </DnaTd>
                      <DnaTd align="right">
                        <DnaCell.Currency
                          value={s.amount}
                          className={`font-bold ${s.amount >= 0 ? "text-emerald-700" : "text-rose-700"}`}
                        />
                      </DnaTd>
                      <DnaTd align="center">
                        <DnaBadge variant={s.matched ? "success" : "warning"}>
                          {s.matched ? "MATCHED" : "UNMATCHED"}
                        </DnaBadge>
                      </DnaTd>
                    </DnaTableRow>
                  ))
                )}
              </DnaTableBody>
            </DnaTable>
          </div>
        </DnaDataTableCard>
      </div>
    </div>
  );
};
