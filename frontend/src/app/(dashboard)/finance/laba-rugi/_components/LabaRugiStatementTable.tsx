"use client";

import React from "react";
import { Calendar, Eye } from "lucide-react";
import {
  DnaDataTableCard,
  DnaBadge,
  DnaInput,
  DnaCheckbox,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  formatRupiah
} from "@/components/dna";
import type { StatementRow, DateRange } from "../_types/laba-rugi.types";

interface LabaRugiStatementTableProps {
  rows: StatementRow[];
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  showComparison: boolean;
  setShowComparison: (show: boolean) => void;
  onSelectRow: (row: StatementRow) => void;
}

export const LabaRugiStatementTable: React.FC<LabaRugiStatementTableProps> = ({
  rows,
  dateRange,
  setDateRange,
  showComparison,
  setShowComparison,
  onSelectRow
}) => {
  return (
    <DnaDataTableCard
      title="Laporan Laba Rugi Komparatif (Format G-SERP)"
      badge={<DnaBadge variant="purple">Periode: {dateRange.start} s/d {dateRange.end}</DnaBadge>}
      customToolbar={
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1" />
            <DnaInput
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="bg-transparent border-0 text-xs focus:ring-0 text-slate-700 font-medium"
            />
            <span className="text-slate-400 font-semibold">s/d</span>
            <DnaInput
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="bg-transparent border-0 text-xs focus:ring-0 text-slate-700 font-medium"
            />
          </div>
          <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer">
            <DnaCheckbox
              checked={showComparison}
              onChange={(e) => setShowComparison(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>Tampilkan Komparasi Bulan Lalu</span>
          </label>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <DnaTable className="w-full text-left text-xs">
          <DnaTableHead>
            <DnaTableRow>
              <DnaTh className="w-28">Kode Akun</DnaTh>
              <DnaTh>Uraian / Deskripsi Akun (Hierarki G-SERP)</DnaTh>
              <DnaTh className="text-right">Periode Berjalan (Rp)</DnaTh>
              {showComparison && <DnaTh className="text-right">Periode Lalu (Rp)</DnaTh>}
              {showComparison && <DnaTh className="text-right">Pertumbuhan (%)</DnaTh>}
              <DnaTh className="text-center w-12">#</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {rows.map((row, idx) => {
              const isHeader = row.isHeader;
              const isTotal = row.isTotal;

              return (
                <DnaTableRow
                  key={idx}
                  className={`transition-colors ${
                    isHeader
                      ? "bg-slate-100/80 font-bold text-slate-900 border-t border-slate-200"
                      : isTotal
                      ? "bg-emerald-50/60 font-black text-slate-900 border-t border-b border-emerald-300"
                      : "hover:bg-slate-50/50 text-slate-700"
                  }`}
                >
                  <DnaTd className="text-[11px] text-slate-500 font-semibold tabular-nums">
                    {row.code.startsWith("TOT_") || row.code === "GROSS_PRF" || row.code.startsWith("NET_") ? "" : row.code}
                  </DnaTd>
                  <DnaTd className={row.level === 1 ? "pl-8 text-slate-800" : "font-extrabold text-slate-900"}>
                    {row.name}
                  </DnaTd>
                  <DnaTd className={`text-right tabular-nums ${isTotal ? "font-black text-sm text-slate-900" : "font-semibold"}`}>
                    {isHeader ? "" : formatRupiah(row.currentAmount)}
                  </DnaTd>
                  {showComparison && (
                    <DnaTd className="text-right text-slate-500 font-medium tabular-nums">
                      {isHeader ? "" : formatRupiah(row.prevAmount)}
                    </DnaTd>
                  )}
                  {showComparison && (
                    <DnaTd className="text-right font-bold text-emerald-700 tabular-nums">
                      {isHeader ? "" : `${row.growthPct >= 0 ? "+" : ""}${row.growthPct}%`}
                    </DnaTd>
                  )}
                  <DnaTd className="text-center">
                    {!isHeader && !isTotal && (
                      <button
                        onClick={() => onSelectRow(row)}
                        className="text-slate-400 hover:text-emerald-600 p-0.5 rounded"
                        title="Drilldown ke Buku Besar"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </DnaTd>
                </DnaTableRow>
              );
            })}
          </DnaTableBody>
        </DnaTable>
      </div>
    </DnaDataTableCard>
  );
};
