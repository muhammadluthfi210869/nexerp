import React from "react";
import { Calendar, Search, Filter, Eye, Printer } from "lucide-react";
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
  formatRupiah,
} from "@/components/dna";
import type { DnaFilterColumnConfig } from "@/components/dna";
import { CashOutItem } from "../_types/cash-out.types";

interface CashOutTableProps {
  items: CashOutItem[];
  totalKasKeluar: number;
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
  onSelectDetail: (item: CashOutItem) => void;
  onPrintItem: (item: CashOutItem) => void;
}

export const CashOutTable: React.FC<CashOutTableProps> = ({
  items,
  totalKasKeluar,
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
  onSelectDetail,
  onPrintItem,
}) => {
  return (
    <DnaDataTableCard
      count={items.length}
      toolbarProps={{
        searchValue: searchQuery,
        onSearchChange: setSearchQuery,
        searchPlaceholder: "Cari no bukti, penerima, akun kas, atau nominal...",
        statusOptions: statusOptions,
        selectedStatus: selectedStatus,
        onSelectStatus: onSelectStatus,
        statusPlaceholder: "Semua Status Mutasi",
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
        <DnaTable className="min-w-[1250px]">
          <DnaTableHead>
            <DnaTableRow>
              <DnaTh className="w-[45px] text-center">#</DnaTh>
              <DnaTh className="w-[140px]">No. Bukti Kas Keluar</DnaTh>
              <DnaTh className="w-[110px]">Tanggal Pembayaran</DnaTh>
              <DnaTh className="w-[160px]">Akun Kas/Bank Sumber</DnaTh>
              <DnaTh className="w-[160px]">Kategori Beban</DnaTh>
              <DnaTh className="w-[160px]">Dibayar Kepada (Payee)</DnaTh>
              <DnaTh className="w-[140px]">No. Referensi PO/Tagihan</DnaTh>
              <DnaTh align="right" className="w-[140px]">Nominal Keluar (Rp)</DnaTh>
              <DnaTh align="center" className="w-[120px]">Status Rekonsiliasi</DnaTh>
              <DnaTh align="center" className="w-[110px]">Status Approval</DnaTh>
              <DnaTh align="center" className="w-[80px]">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {items.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={11} className="py-8 text-center text-slate-400">
                  Tidak ada data kas bank keluar untuk filter yang dipilih.
                </DnaTd>
              </DnaTableRow>
            ) : (
              items.map((item, idx) => (
                <DnaTableRow
                  key={item.id}
                  onClick={() => onSelectDetail(item)}
                  className="cursor-pointer hover:bg-slate-50/75 transition-colors"
                >
                  <DnaTd align="center" className="text-slate-400 font-mono text-[11px]">
                    {idx + 1}
                  </DnaTd>
                  <DnaTd>
                    <DnaCell.Code value={item.code} />
                  </DnaTd>
                  <DnaTd>
                    <DnaCell.Date value={item.date} />
                  </DnaTd>
                  <DnaTd>
                    <DnaCell.Text primary={item.account} />
                  </DnaTd>
                  <DnaTd isMuted>
                    <DnaCell.Text primary={item.category} />
                  </DnaTd>
                  <DnaTd isPrimary>
                    <DnaCell.Text primary={item.to} />
                  </DnaTd>
                  <DnaTd>
                    {item.billNo && item.billNo !== "-" ? (
                      <DnaCell.Code value={item.billNo} />
                    ) : (
                      <span className="text-slate-400 text-[11px]">-</span>
                    )}
                  </DnaTd>
                  <DnaTd align="right">
                    <DnaCell.Currency value={item.amount} className="font-semibold text-rose-700" />
                  </DnaTd>
                  <DnaTd align="center">
                    <DnaBadge variant={item.reconciliationStatus === "RECONCILED" ? "success" : "warning"}>
                      {item.reconciliationStatus}
                    </DnaBadge>
                  </DnaTd>
                  <DnaTd align="center">
                    <DnaBadge variant={item.approvalStatus === "POSTED" || item.approvalStatus === "APPROVED" ? "critical" : "default"}>
                      {item.approvalStatus}
                    </DnaBadge>
                  </DnaTd>
                  <DnaTd align="center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectDetail(item)}
                        title="Lihat Detail"
                        className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </DnaButton>
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => onPrintItem(item)}
                        title="Print Bukti"
                        className="h-7 w-7 p-0 text-slate-500 hover:text-blue-600"
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-600" />
                      </DnaButton>
                    </div>
                  </DnaTd>
                </DnaTableRow>
              ))
            )}
            <DnaTableRow className="bg-rose-50/75 font-semibold border-t-2 border-rose-300">
              <DnaTd colSpan={7} className="px-3.5 py-3 text-rose-950 font-bold text-right text-xs">
                TOTAL KAS KELUAR:
              </DnaTd>
              <DnaTd className="px-3.5 py-3 text-right text-rose-950 font-bold tabular-nums text-sm">
                {formatRupiah(totalKasKeluar)}
              </DnaTd>
              <DnaTd colSpan={3}></DnaTd>
            </DnaTableRow>
          </DnaTableBody>
        </DnaTable>
      </div>
    </DnaDataTableCard>
  );
};
