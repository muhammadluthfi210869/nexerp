"use client";

import React from "react";
import { Target, Eye, Edit2, Trash2 } from "lucide-react";
import {
  DnaDataTableCard,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaButton,
} from "@/components/dna";
import type { SalesTargetItem } from "../_types/sales-target.types";
import { MONTHS_ID } from "../_types/sales-target.types";
import type { useSalesTargetOperations } from "../_hooks/useSalesTargetOperations";

interface TargetTableProps {
  ops?: ReturnType<typeof useSalesTargetOperations>;
  targets?: SalesTargetItem[];
  totalItems?: number;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (value: string) => void;
  selectedMonth?: number;
  onMonthChange?: (month: number) => void;
  selectedYear?: number;
  onYearChange?: (year: number) => void;
  isLoading?: boolean;
  onViewDetail?: (target: SalesTargetItem) => void;
  onEdit?: (target: SalesTargetItem) => void;
  onDelete?: (target: SalesTargetItem) => void;
}

export function TargetTable(props: TargetTableProps) {
  const targets = props.targets ?? props.ops?.filteredTargets ?? [];
  const totalItems = props.totalItems ?? props.ops?.countAll ?? 0;
  const searchTerm = props.searchTerm ?? props.ops?.searchTerm ?? "";
  const onSearchChange = props.onSearchChange ?? props.ops?.setSearchTerm ?? (() => {});
  const statusFilter = props.statusFilter ?? props.ops?.statusFilter ?? "ALL";
  const onStatusFilterChange = props.onStatusFilterChange ?? props.ops?.setStatusFilter ?? (() => {});
  const selectedMonth = props.selectedMonth ?? props.ops?.selectedMonth ?? 1;
  const onMonthChange = props.onMonthChange ?? props.ops?.setSelectedMonth ?? (() => {});
  const selectedYear = props.selectedYear ?? props.ops?.selectedYear ?? 2026;
  const onYearChange = props.onYearChange ?? props.ops?.setSelectedYear ?? (() => {});
  const isLoading = props.isLoading ?? props.ops?.isLoadingTargets ?? false;
  const onViewDetail = props.onViewDetail ?? props.ops?.setDetailTarget ?? (() => {});
  const onEdit = props.onEdit ?? props.ops?.handleOpenEditTarget ?? (() => {});
  const onDelete = props.onDelete ?? props.ops?.setTargetToDelete ?? (() => {});

  return (
    <DnaDataTableCard
      count={targets.length}
      totalItems={totalItems}
      toolbarProps={{
        searchPlaceholder: "Cari nama marketing, email, atau catatan...",
        searchQuery: searchTerm,
        onSearchChange: onSearchChange,
        filterColumns: [
          {
            key: "status",
            label: "Status Capaian",
            type: "select",
            options: ["ALL", "REACHED", "ONTRACK", "UNDER"],
          },
        ],
        selectedColumn: "status",
        onSelectColumn: () => {},
        filterValue: statusFilter,
        onFilterValueChange: onStatusFilterChange,
      }}
      actions={
        <div className="flex items-center gap-2">
          <select
            className="text-xs p-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={selectedMonth}
            onChange={(e) => onMonthChange(Number(e.target.value))}
          >
            {MONTHS_ID.map((m, idx) => (
              <option key={m} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            className="text-xs p-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={selectedYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
          >
            {[2024, 2025, 2026, 2027, 2028].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      }
    >
      <div className="w-full overflow-x-auto">
        <DnaTable className="w-full text-left border-collapse text-xs">
          <DnaTableHead>
            <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold">
              <DnaTh className="py-3 px-3.5 w-10 text-slate-400">#</DnaTh>
              <DnaTh className="py-3 px-3.5 min-w-[200px]">MARKETING (SALES PIC)</DnaTh>
              <DnaTh className="py-3 px-3.5 min-w-[130px]">PERIODE</DnaTh>
              <DnaTh className="py-3 px-3.5 text-right min-w-[140px]">TARGET (RP)</DnaTh>
              <DnaTh className="py-3 px-3.5 text-right min-w-[140px]">ACHIEVEMENT (RP)</DnaTh>
              <DnaTh className="py-3 px-3.5 text-center min-w-[120px]">% CAPAIAN</DnaTh>
              <DnaTh className="py-3 px-3.5 min-w-[180px]">CATATAN</DnaTh>
              <DnaTh className="py-3 px-3.5 text-right w-24">AKSI</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {isLoading ? (
              <DnaTableRow>
                <DnaTd colSpan={8} className="text-center py-12 text-slate-400 font-medium">
                  Memuat data target penjualan...
                </DnaTd>
              </DnaTableRow>
            ) : targets.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={8} className="text-center py-12 text-slate-400">
                  <Target className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                  <p className="font-semibold text-slate-600">Tidak ada target penjualan pada periode ini</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Pilih bulan/tahun lain atau klik &quot;Alokasikan Target Baru&quot;.
                  </p>
                </DnaTd>
              </DnaTableRow>
            ) : (
              targets.map((t, idx) => {
                const isSuccess = t.achievementPercent >= 100;
                const isOnTrack = t.achievementPercent >= 70;

                return (
                  <DnaTableRow key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <DnaTd className="py-3 px-3.5 text-slate-400 tabular-nums text-[11px]">
                      {idx + 1}
                    </DnaTd>
                    <DnaTd className="py-3 px-3.5">
                      <p className="font-bold text-slate-900">{t.marketingName}</p>
                      <p className="text-[11px] text-slate-400 tabular-nums">{t.marketingEmail}</p>
                    </DnaTd>
                    <DnaTd className="py-3 px-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                        {MONTHS_ID[t.month - 1]} {t.year}
                      </span>
                    </DnaTd>
                    <DnaTd className="py-3 px-3.5 text-right font-bold text-slate-900 tabular-nums">
                      Rp {t.nominalTarget.toLocaleString("id-ID")}
                    </DnaTd>
                    <DnaTd className="py-3 px-3.5 text-right font-bold text-emerald-600 tabular-nums">
                      Rp {t.realizedRevenue.toLocaleString("id-ID")}
                    </DnaTd>
                    <DnaTd className="py-3 px-3.5 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span
                          className={`font-black text-xs ${
                            isSuccess ? "text-emerald-600" : isOnTrack ? "text-blue-600" : "text-amber-600"
                          }`}
                        >
                          {t.achievementPercent}%
                        </span>
                        <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full ${
                              isSuccess ? "bg-emerald-500" : isOnTrack ? "bg-blue-500" : "bg-amber-500"
                            }`}
                            style={{ width: `${Math.min(100, t.achievementPercent)}%` }}
                          />
                        </div>
                      </div>
                    </DnaTd>
                    <DnaTd className="py-3 px-3.5 text-slate-600 text-xs truncate max-w-[200px]">
                      {t.notes || <span className="text-slate-300">-</span>}
                    </DnaTd>
                    <DnaTd className="py-3 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetail(t)}
                          title="Lihat Detail"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                        </DnaButton>
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(t)}
                          title="Sunting Target"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                        </DnaButton>
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(t)}
                          title="Hapus Target"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
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
