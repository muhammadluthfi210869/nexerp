"use client";

import React from "react";
import { ExternalLink } from "lucide-react";
import {
  DnaDataTableCard,
  DnaTable,
  DnaBadge,
  type DnaDateMode,
  type DnaFilterColumnConfig,
} from "@/components/dna";
import { STATUS_OPTIONS } from "../_hooks/useChecklistProgressOperations";
import type { ChecklistProgress } from "../_types/checklist-progress.types";

interface ChecklistProgressTableProps {
  paginatedData: ChecklistProgress[];
  totalFiltered: number;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedStatus: string;
  onSelectStatus: (val: string) => void;
  filterColumns: DnaFilterColumnConfig[];
  selectedColumn?: string;
  onSelectColumn: (col: string | null) => void;
  filterValue: string;
  onFilterValueChange: (val: string) => void;
  dateMode: DnaDateMode;
  onDateModeChange: (mode: DnaDateMode) => void;
  onResetAll: () => void;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function ChecklistProgressTable({
  paginatedData,
  totalFiltered,
  searchQuery,
  onSearchChange,
  selectedStatus,
  onSelectStatus,
  filterColumns,
  selectedColumn,
  onSelectColumn,
  filterValue,
  onFilterValueChange,
  dateMode,
  onDateModeChange,
  onResetAll,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
}: ChecklistProgressTableProps) {
  return (
    <DnaDataTableCard
      title="Daftar Checklist Mutu QC"
      itemCount={totalFiltered}
      toolbarProps={{
        searchValue: searchQuery,
        onSearchChange,
        searchPlaceholder: "Cari kode QC, nama inspeksi, PIC, atau kategori...",
        statusOptions: STATUS_OPTIONS,
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
        onResetAll,
      }}
      paginationProps={{
        currentPage,
        totalPages,
        totalEntries: totalFiltered,
        pageSize,
        onPageChange,
      }}
    >
      <DnaTable className="w-full text-left border-collapse text-[12px]">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider select-none">
            <th className="p-3.5 w-10 text-slate-400 text-center">#</th>
            <th className="p-3.5 w-28">TANGGAL MULAI</th>
            <th className="p-3.5 w-32">NO. SALES</th>
            <th className="p-3.5">BRAND / PRODUK</th>
            <th className="p-3.5 w-44">CUSTOMER</th>
            <th className="p-3.5 w-28">KATEGORI</th>
            <th className="p-3.5 w-28">TANGGAL SELESAI</th>
            <th className="p-3.5 w-28 text-center">STATUS</th>
            <th className="p-3.5 w-36">IZIN BPOM (NA)</th>
            <th className="p-3.5 w-20 text-center">AKSI</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {paginatedData.length === 0 ? (
            <tr>
              <td colSpan={10} className="p-8 text-center text-slate-400">
                Tidak ada checklist yang sesuai kriteria filter.
              </td>
            </tr>
          ) : (
            paginatedData.map((item, idx) => (
              <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-3.5 text-center text-slate-400 tabular-nums text-[11px]">
                  {(currentPage - 1) * pageSize + idx + 1}
                </td>
                <td className="p-3.5 text-slate-700 font-mono text-xs tabular-nums whitespace-nowrap">
                  {item.startDate}
                </td>
                <td className="p-3.5 font-mono text-xs font-bold text-blue-600">
                  {item.salesOrderNo}
                </td>
                <td className="p-3.5">
                  <div className="font-bold text-slate-900">{item.brandProduct}</div>
                  <div className="text-[11px] text-slate-400">{item.code}</div>
                </td>
                <td className="p-3.5 text-xs text-slate-700 font-medium">
                  {item.customer}
                </td>
                <td className="p-3.5">
                  <DnaBadge variant="neutral">{item.category}</DnaBadge>
                </td>
                <td className="p-3.5 text-slate-700 font-mono text-xs tabular-nums whitespace-nowrap">
                  {item.endDate}
                </td>
                <td className="p-3.5 text-center">
                  <DnaBadge
                    variant={
                      item.status === "Completed"
                        ? "success"
                        : item.status === "Process"
                        ? "info"
                        : item.status === "Overdue"
                        ? "critical"
                        : "warning"
                    }
                  >
                    {item.status}
                  </DnaBadge>
                </td>
                <td className="p-3.5">
                  {item.bpomRegNumber ? (
                    <a
                      href={`https://cekbpom.pom.go.id/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-xs text-blue-600 hover:text-blue-800 hover:underline"
                      title="Verifikasi ke portal Cek BPOM"
                    >
                      {item.bpomRegNumber}
                      <ExternalLink className="w-3 h-3 text-blue-400" />
                    </a>
                  ) : (
                    <span className="text-slate-400 text-xs">—</span>
                  )}
                </td>
                <td className="p-3.5 text-center">
                  <button
                    type="button"
                    className="px-2.5 py-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Detail
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </DnaTable>
    </DnaDataTableCard>
  );
}
