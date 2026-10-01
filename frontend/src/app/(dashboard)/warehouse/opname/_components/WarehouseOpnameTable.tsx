"use client";

import React from "react";
import { ClipboardCheck, Eye, Lock, Unlock } from "lucide-react";
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
  DnaBadge,
  formatRupiah,
} from "@/components/dna";
import type { OpnameSession } from "../_types/opname.types";

interface WarehouseOpnameTableProps {
  filteredSessions: OpnameSession[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  selectedColumn: string;
  onSelectColumn: (col: string) => void;
  filterValue: string;
  onFilterValueChange: (val: string) => void;
  dateMode: any;
  onDateModeChange: (mode: any) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  warehouseOptions: string[];
  auditorOptions: string[];
  onResetAll: () => void;
  onSelectSession: (session: OpnameSession) => void;
}

export function WarehouseOpnameTable({
  filteredSessions,
  searchQuery,
  onSearchChange,
  selectedStatus,
  onSelectStatus,
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
  warehouseOptions,
  auditorOptions,
  onResetAll,
  onSelectSession,
}: WarehouseOpnameTableProps) {
  const getStatusBadge = (status: OpnameSession["status"]) => {
    switch (status) {
      case "DRAFT_FREEZE":
        return <DnaBadge variant="warning">Persiapan / Frozen</DnaBadge>;
      case "IN_COUNT":
        return <DnaBadge variant="info">Sedang Dihitung</DnaBadge>;
      case "RECONCILED_CLOSED":
        return <DnaBadge variant="success">Selesai & Rekonsiliasi</DnaBadge>;
      default:
        return <DnaBadge variant="neutral">{status}</DnaBadge>;
    }
  };

  return (
    <DnaDataTableCard
      toolbarProps={{
        searchQuery,
        onSearchChange,
        searchPlaceholder: "Cari No. Sesi Opname, Gudang, Auditor...",
        statusOptions: [
          { value: "DRAFT_FREEZE", label: "Persiapan / Frozen", dotColor: "bg-amber-500" },
          { value: "IN_COUNT", label: "Sedang Dihitung", dotColor: "bg-blue-500" },
          { value: "RECONCILED_CLOSED", label: "Selesai & Rekonsiliasi", dotColor: "bg-emerald-500" },
        ],
        selectedStatus,
        onSelectStatus,
        statusPlaceholder: "Semua Status Sesi",
        filterColumns: [
          {
            key: "warehouseName",
            label: "Gudang Audit",
            type: "select",
            options: warehouseOptions,
          },
          {
            key: "auditorLead",
            label: "Lead Auditor",
            type: "select",
            options: auditorOptions,
          },
        ],
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
            <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
              <DnaTh className="px-3 py-3 h-[40px] w-[50px] text-center">#</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] w-[140px]">No. Sesi Opname</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] w-[110px]">Tanggal Opname</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px]">Gudang Audit</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px]">Lead Auditor</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-right w-[110px]">Total SKU Target</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-right w-[110px]">SKU Terhitung</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-right w-[120px]">Progres Hitung (%)</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-right w-[150px]">Varians Bersih (Rp)</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-center w-[130px]">Status Freeze</DnaTh>
              <DnaTh className="px-4 py-3 h-[40px] text-right w-[60px]">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {filteredSessions.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={11} className="py-12 text-center text-slate-400">
                  <ClipboardCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  Tidak ada sesi stok opname yang sesuai filter.
                </DnaTd>
              </DnaTableRow>
            ) : (
              filteredSessions.map((s, index) => {
                const progressPct = Math.round(
                  (s.countedSkus / (s.totalSkus || 1)) * 100
                );

                return (
                  <DnaTableRow
                    key={s.id}
                    onClick={() => onSelectSession(s)}
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer group h-[48px]"
                  >
                    {/* # */}
                    <DnaTd className="px-3 py-2 text-center text-slate-400 text-xs tabular-nums">
                      {index + 1}
                    </DnaTd>

                    {/* No. Sesi Opname */}
                    <DnaTd className="px-3 py-2">
                      <DnaCell.Code value={s.sessionCode} />
                    </DnaTd>

                    {/* Tanggal Opname */}
                    <DnaTd className="px-3 py-2 text-slate-600 whitespace-nowrap text-xs">
                      {s.sessionDate}
                    </DnaTd>

                    {/* Gudang Audit */}
                    <DnaTd className="px-3 py-2 text-slate-800 font-medium text-xs truncate max-w-[160px]" title={s.warehouseName}>
                      {s.warehouseName}
                    </DnaTd>

                    {/* Lead Auditor */}
                    <DnaTd className="px-3 py-2 text-slate-800 text-xs truncate max-w-[140px]" title={s.auditorLead}>
                      {s.auditorLead}
                    </DnaTd>

                    {/* Total SKU Target */}
                    <DnaTd className="px-3 py-2 text-right">
                      <span className="font-medium text-slate-700 tabular-nums text-xs">
                        {s.totalSkus} SKU
                      </span>
                    </DnaTd>

                    {/* SKU Terhitung */}
                    <DnaTd className="px-3 py-2 text-right">
                      <span className="font-semibold text-blue-700 tabular-nums text-xs">
                        {s.countedSkus} SKU
                      </span>
                    </DnaTd>

                    {/* Progres Hitung (%) */}
                    <DnaTd className="px-3 py-2 text-right">
                      <span
                        className={`tabular-nums font-bold text-xs ${
                          progressPct >= 100
                            ? "text-emerald-700"
                            : progressPct > 0
                            ? "text-blue-700"
                            : "text-slate-400"
                        }`}
                      >
                        {progressPct}%
                      </span>
                    </DnaTd>

                    {/* Varians Bersih (Rp) */}
                    <DnaTd className="px-3 py-2 text-right">
                      <span
                        className={`tabular-nums font-semibold text-xs ${
                          s.netVarianceValuation < 0
                            ? "text-rose-600"
                            : s.netVarianceValuation > 0
                            ? "text-emerald-700"
                            : "text-slate-700"
                        }`}
                      >
                        {formatRupiah(s.netVarianceValuation)}
                      </span>
                    </DnaTd>

                    {/* Status Freeze */}
                    <DnaTd className="px-3 py-2 text-center">
                      {s.isInventoryFrozen ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <Lock className="w-3 h-3 text-amber-600" /> FROZEN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          <Unlock className="w-3 h-3 text-slate-400" /> NORMAL
                        </span>
                      )}
                    </DnaTd>

                    {/* Aksi */}
                    <DnaTd className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectSession(s)}
                        className="text-slate-400 hover:text-blue-600"
                      >
                        <Eye className="w-4 h-4" />
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
