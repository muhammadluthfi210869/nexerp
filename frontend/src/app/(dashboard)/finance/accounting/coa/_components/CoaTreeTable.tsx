"use client";

import React from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
  DnaDataTableCard,
  DnaCell,
  DnaCheckbox,
  DnaTable,
  formatRupiah,
} from "@/components/dna";
import { AccountModel, AccountType } from "../_types/coa.types";

interface CoaTreeTableProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusOptions: { value: string; label: string; color?: "default" | "success" | "warning" | "critical" | "info" }[];
  selectedStatus: string;
  onSelectStatus: (val: string) => void;
  selectedFilterColumn: string;
  onSelectColumn: (col: string) => void;
  filterColumnValue: string;
  onFilterValueChange: (value: string) => void;
  onResetAll: () => void;
  onOpenCreate: () => void;
  currentPage: number;
  totalPages: number;
  totalEntries: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  paginatedAccounts: AccountModel[];
  selectedRowIds: string[];
  toggleSelectAll: () => void;
  toggleSelectRow: (id: string) => void;
  sortColumn: string | null;
  sortDirection: "asc" | "desc";
  onHeaderSortToggle: (col: string) => void;
  onOpenView: (item: AccountModel) => void;
  onOpenEdit: (item: AccountModel) => void;
  onSelectDelete: (item: AccountModel) => void;
  getTypeBadgeStatus: (type: AccountType) => "blue" | "rose" | "purple" | "success" | "orange" | "slate";
}

export function CoaTreeTable({
  searchQuery,
  onSearchChange,
  statusOptions,
  selectedStatus,
  onSelectStatus,
  selectedFilterColumn,
  onSelectColumn,
  filterColumnValue,
  onFilterValueChange,
  onResetAll,
  onOpenCreate,
  currentPage,
  totalPages,
  totalEntries,
  pageSize,
  onPageChange,
  paginatedAccounts,
  selectedRowIds,
  toggleSelectAll,
  toggleSelectRow,
  sortColumn,
  sortDirection,
  onHeaderSortToggle,
  onOpenView,
  onOpenEdit,
  onSelectDelete,
  getTypeBadgeStatus,
}: CoaTreeTableProps) {
  return (
    <DnaDataTableCard
      count={paginatedAccounts.length}
      totalItems={totalEntries}
      toolbarProps={{
        searchValue: searchQuery,
        onSearchChange: onSearchChange,
        searchPlaceholder: "Cari nomor kode akun, nama rekening, atau kategori...",
        statusOptions: statusOptions,
        selectedStatus: selectedStatus,
        onSelectStatus: onSelectStatus,
        statusPlaceholder: "Semua Status Akun",
        filterColumns: [
          {
            key: "type",
            label: "Klasifikasi Akun",
            type: "select",
            options: [
              "ASSET",
              "LIABILITY",
              "EQUITY",
              "REVENUE",
              "EXPENSE",
            ],
          },
          {
            key: "category",
            label: "Kategori Rekening",
            type: "select",
            options: [
              "Kas & Bank",
              "Piutang",
              "Uang Muka",
              "Persediaan",
              "Pajak Dibayar Dimuka",
              "Aset Tetap",
              "Hutang Lancar",
              "Hutang Pajak",
              "Ekuitas",
              "Pendapatan Operasional",
              "Pengurang Pendapatan",
              "Harga Pokok Penjualan",
              "Beban Operasional",
            ],
          },
          {
            key: "normalBalance",
            label: "Posisi Normal",
            type: "select",
            options: ["DEBIT", "CREDIT"],
          },
        ],
        selectedColumn: selectedFilterColumn,
        onSelectColumn,
        filterValue: filterColumnValue,
        onFilterValueChange,
        onResetAll,
        actionButton: {
          label: "Tambah Akun",
          onClick: onOpenCreate,
        },
      }}
      paginationProps={{
        currentPage,
        totalPages,
        totalEntries,
        pageSize,
        onPageChange,
      }}
    >
      <div className="overflow-x-auto">
        <DnaTable className="w-full text-left border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider select-none">
              {/* Select All Checkbox */}
              <th className="p-3.5 w-10 text-center">
                <DnaCheckbox
                  checked={paginatedAccounts.length > 0 && selectedRowIds.length === paginatedAccounts.length}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
              <th className="p-3.5 w-10 text-slate-400">#</th>
              <th
                className="p-3.5 cursor-pointer hover:bg-slate-100/60 min-w-[110px]"
                onClick={() => onHeaderSortToggle("code")}
              >
                <div className="flex items-center justify-between gap-1">
                  <span>KODE AKUN</span>
                  {sortColumn === "code" ? (
                    sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              </th>
              <th
                className="p-3.5 cursor-pointer hover:bg-slate-100/60 min-w-[200px]"
                onClick={() => onHeaderSortToggle("name")}
              >
                <div className="flex items-center justify-between gap-1">
                  <span>NAMA AKUN COA</span>
                  {sortColumn === "name" ? (
                    sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              </th>
              <th
                className="p-3.5 cursor-pointer hover:bg-slate-100/60 min-w-[130px]"
                onClick={() => onHeaderSortToggle("type")}
              >
                <div className="flex items-center justify-between gap-1">
                  <span>KLASIFIKASI AKUN</span>
                  {sortColumn === "type" ? (
                    sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              </th>
              <th
                className="p-3.5 cursor-pointer hover:bg-slate-100/60 min-w-[130px] text-center"
                onClick={() => onHeaderSortToggle("normalBalance")}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>POSISI NORMAL (D/K)</span>
                  {sortColumn === "normalBalance" ? (
                    sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              </th>
              <th className="p-3.5 text-center min-w-[130px]">TIPE AKUN (HEADER/DETAIL)</th>
              <th className="p-3.5 text-center min-w-[90px]">MATA UANG</th>
              <th className="p-3.5 min-w-[160px]">AKUN INDUK (PARENT)</th>
              <th className="p-3.5 text-right min-w-[140px]">SALDO SAAT INI (RP)</th>
              <th className="p-3.5 text-center min-w-[90px]">STATUS</th>
              <th className="p-3.5 text-right w-24">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedAccounts.length === 0 ? (
              <tr>
                <td colSpan={12} className="p-12 text-center text-slate-400 font-medium">
                  Tidak ada akun COA yang sesuai filter pencarian.
                </td>
              </tr>
            ) : (
              paginatedAccounts.map((acc, idx) => {
                const isSelected = selectedRowIds.includes(acc.id);
                return (
                  <tr
                    key={acc.id}
                    className={`transition-colors hover:bg-slate-50/80 ${
                      isSelected ? "bg-blue-50/40" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-3.5 text-center">
                      <DnaCheckbox
                        checked={isSelected}
                        onChange={() => toggleSelectRow(acc.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    {/* Number */}
                    <td className="p-3.5 text-slate-400 tabular-nums text-[11px]">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>
                    {/* Kode Akun */}
                    <td className="p-3.5">
                      <DnaCell.Code value={acc.code} onClick={() => onOpenView(acc)} />
                    </td>
                    {/* Nama Akun CoA */}
                    <td className="p-3.5 font-medium text-slate-800">
                      {acc.name}
                    </td>
                    {/* Klasifikasi Akun */}
                    <td className="p-3.5">
                      <DnaCell.Badge
                        label={acc.type}
                        status={getTypeBadgeStatus(acc.type)}
                      />
                    </td>
                    {/* Posisi Normal (D/K) */}
                    <td className="p-3.5 text-center">
                      <DnaCell.Badge
                        label={acc.normalBalance === "DEBIT" ? "DEBIT (D)" : "KREDIT (K)"}
                        status={acc.normalBalance === "DEBIT" ? "blue" : "purple"}
                      />
                    </td>
                    {/* Tipe Akun (Header/Detail) */}
                    <td className="p-3.5 text-center">
                      {acc.isHeader || acc.allowManualJournal === false ? (
                        <DnaCell.Badge label="HEADER" status="purple" />
                      ) : (
                        <DnaCell.Badge label="DETAIL" status="blue" />
                      )}
                    </td>
                    {/* Mata Uang */}
                    <td className="p-3.5 text-center text-xs font-semibold text-slate-600">
                      {acc.currency || "IDR"}
                    </td>
                    {/* Akun Induk (Parent) */}
                    <td className="p-3.5 text-slate-600 text-xs">
                      {acc.parent ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200/60">
                          <span className="font-mono text-slate-500">{acc.parent.code}</span>
                          <span>{acc.parent.name}</span>
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    {/* Saldo Saat Ini (Rp) */}
                    <td className="p-3.5 text-right font-semibold text-slate-900 tabular-nums">
                      {formatRupiah(acc.balance || 0)}
                    </td>
                    {/* Status */}
                    <td className="p-3.5 text-center">
                      <DnaCell.Badge
                        label={acc.isActive ? "ACTIVE" : "INACTIVE"}
                        status={acc.isActive ? "success" : "slate"}
                      />
                    </td>
                    {/* Aksi */}
                    <td className="p-3.5 text-right">
                      <DnaCell.Actions
                        onView={() => onOpenView(acc)}
                        onEdit={() => onOpenEdit(acc)}
                        onDelete={() => onSelectDelete(acc)}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </DnaTable>
      </div>
    </DnaDataTableCard>
  );
}
