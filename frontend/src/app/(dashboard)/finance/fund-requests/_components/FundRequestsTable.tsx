import React from "react";
import { Eye } from "lucide-react";
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
} from "@/components/dna";
import type { DnaFilterColumnConfig } from "@/components/dna";
import type { FundRequestItem } from "../_types/fund-requests.types";

interface FundRequestsTableProps {
  items: FundRequestItem[];
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
  onSelectRequest: (item: FundRequestItem) => void;
}

export const FundRequestsTable: React.FC<FundRequestsTableProps> = ({
  items,
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
  onSelectRequest,
}) => {
  return (
    <DnaDataTableCard
      count={items.length}
      toolbarProps={{
        searchValue: searchQuery,
        onSearchChange: setSearchQuery,
        searchPlaceholder: "Cari nomor pengajuan, pemohon, keperluan, atau akun...",
        statusOptions: statusOptions,
        selectedStatus: selectedStatus,
        onSelectStatus: onSelectStatus,
        statusPlaceholder: "Semua Status",
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
              <DnaTh className="w-[140px]">No. Pengajuan</DnaTh>
              <DnaTh className="w-[110px]">Tanggal Pengajuan</DnaTh>
              <DnaTh className="w-[160px]">Departemen / Unit</DnaTh>
              <DnaTh className="w-[150px]">PIC Pemohon</DnaTh>
              <DnaTh className="min-w-[200px]">Keperluan / Rincian</DnaTh>
              <DnaTh align="right" className="w-[140px]">Total Nominal (Rp)</DnaTh>
              <DnaTh className="w-[180px]">Akun Anggaran CoA</DnaTh>
              <DnaTh align="center" className="w-[140px]">3-Tier Approval</DnaTh>
              <DnaTh align="center" className="w-[130px]">Status Pencairan</DnaTh>
              <DnaTh align="center" className="w-[70px]">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {items.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={11} className="py-8 text-center text-slate-400">
                  Tidak ada pengajuan dana yang cocok dengan kriteria pencarian.
                </DnaTd>
              </DnaTableRow>
            ) : (
              items.map((r, idx) => (
                <DnaTableRow
                  key={r.id}
                  onClick={() => onSelectRequest(r)}
                  className="cursor-pointer hover:bg-slate-50/75 transition-colors"
                >
                  <DnaTd align="center" className="text-slate-400 font-mono text-[11px]">
                    {idx + 1}
                  </DnaTd>
                  <DnaTd>
                    <DnaCell.Code value={r.requestNo} />
                  </DnaTd>
                  <DnaTd>
                    <DnaCell.Date value={r.requestDate} />
                  </DnaTd>
                  <DnaTd>
                    <DnaCell.Text primary={r.department} />
                  </DnaTd>
                  <DnaTd isPrimary>
                    <DnaCell.Text primary={r.applicant} secondary={r.level} />
                  </DnaTd>
                  <DnaTd>
                    <span className="text-[12px] font-medium text-slate-800 line-clamp-1">
                      {r.purpose}
                    </span>
                  </DnaTd>
                  <DnaTd align="right">
                    <DnaCell.Currency value={r.amount} className="font-semibold text-blue-700" />
                  </DnaTd>
                  <DnaTd isMuted>
                    <DnaCell.Text primary={r.coaAccount} />
                  </DnaTd>
                  <DnaTd align="center">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                      {r.approvalTier}
                    </span>
                  </DnaTd>
                  <DnaTd align="center">
                    <DnaBadge
                      variant={
                        r.disbursementStatus === "DICAIRKAN"
                          ? "success"
                          : r.status === "APPROVED"
                          ? "info"
                          : r.status === "PENDING_APPROVAL"
                          ? "warning"
                          : "critical"
                      }
                    >
                      {r.disbursementStatus}
                    </DnaBadge>
                  </DnaTd>
                  <DnaTd align="center" onClick={(e) => e.stopPropagation()}>
                    <DnaButton
                      variant="ghost"
                      className="h-7 w-7 p-0 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                      onClick={() => onSelectRequest(r)}
                      title="Lihat Detail"
                    >
                      <Eye className="w-3.5 h-3.5" />
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
};
