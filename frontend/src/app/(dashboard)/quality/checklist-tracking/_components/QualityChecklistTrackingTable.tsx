"use client";

import React from "react";
import { Download, Eye } from "lucide-react";
import {
  DnaDataTableCard,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaButton,
  DnaCell,
} from "@/components/dna";
import { IpqcChecklistTracking as ChecklistTracking } from "../_types/checklist-tracking.types";

interface QualityChecklistTrackingTableProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  categories: string[];
  pics: string[];
  filterCategory: string;
  filterMilestoneStatus: string;
  filterPIC: string;
  onFilterValueChange: (val: string) => void;
  onExportSummary: () => void;
  currentPage: number;
  totalPages: number;
  totalFilteredEntries: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  isError: boolean;
  paginatedData: ChecklistTracking[];
  onSelectChecklist: (item: ChecklistTracking) => void;
}

export function QualityChecklistTrackingTable({
  searchTerm,
  onSearchChange,
  categories,
  pics,
  filterCategory,
  filterMilestoneStatus,
  filterPIC,
  onFilterValueChange,
  onExportSummary,
  currentPage,
  totalPages,
  totalFilteredEntries,
  pageSize,
  onPageChange,
  isLoading,
  isError,
  paginatedData,
  onSelectChecklist,
}: QualityChecklistTrackingTableProps) {
  return (
    <DnaDataTableCard
      toolbarProps={{
        searchQuery: searchTerm,
        onSearchChange,
        searchPlaceholder: "Cari kode QC, judul audit, PIC, atau kategori...",
        filterColumns: [
          {
            key: "category",
            label: "Kategori",
            type: "select",
            options: categories,
          },
          {
            key: "status",
            label: "Status Milestone",
            type: "select",
            options: ["VERIFIED", "COMPLETED"],
          },
          {
            key: "pic",
            label: "PIC Bertugas",
            type: "select",
            options: pics,
          },
        ],
        selectedColumn:
          filterCategory !== "ALL"
            ? "category"
            : filterMilestoneStatus !== "ALL"
            ? "status"
            : "pic",
        onSelectColumn: () => {},
        filterValue:
          filterCategory !== "ALL"
            ? filterCategory
            : filterMilestoneStatus !== "ALL"
            ? filterMilestoneStatus
            : filterPIC,
        onFilterValueChange,
        extraActions: (
          <DnaButton
            variant="outline"
            size="sm"
            icon={<Download className="w-3.5 h-3.5" />}
            onClick={onExportSummary}
          >
            Export Rekap Mutu
          </DnaButton>
        ),
      }}
      paginationProps={{
        currentPage,
        totalPages,
        totalEntries: totalFilteredEntries,
        pageSize,
        onPageChange,
      }}
    >
      <DnaTable className="w-full text-left border-collapse text-[12px]">
        <DnaTableHead>
          <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider select-none h-[40px]">
            <DnaTh className="px-4 py-2.5 w-[50px] text-slate-400 text-center">#</DnaTh>
            <DnaTh className="px-4 py-2.5 w-[120px]">TANGGAL</DnaTh>
            <DnaTh className="px-4 py-2.5 w-[140px]">KODE QC</DnaTh>
            <DnaTh className="px-4 py-2.5 min-w-[200px]">JUDUL AUDIT CHECKLIST</DnaTh>
            <DnaTh className="px-4 py-2.5 w-[130px]">KATEGORI</DnaTh>
            <DnaTh className="px-4 py-2.5 w-[150px]">PIC ANALIS</DnaTh>
            <DnaTh className="px-4 py-2.5 w-[160px]">VERIFIKATOR</DnaTh>
            <DnaTh className="px-4 py-2.5 w-[140px]">PASS RATE</DnaTh>
            <DnaTh className="px-4 py-2.5 w-[110px]">STATUS</DnaTh>
            <DnaTh className="pr-4 py-2.5 w-12 text-center">AKSI</DnaTh>
          </DnaTableRow>
        </DnaTableHead>
        <DnaTableBody>
          {isLoading ? (
            <DnaTableRow>
              <DnaTd colSpan={10} className="p-8 text-center text-slate-400">
                Memuat data tracking checklist...
              </DnaTd>
            </DnaTableRow>
          ) : isError ? (
            <DnaTableRow>
              <DnaTd colSpan={10} className="p-8 text-center text-rose-500">
                Gagal memuat data tracking checklist.
              </DnaTd>
            </DnaTableRow>
          ) : paginatedData.length === 0 ? (
            <DnaTableRow>
              <DnaTd colSpan={10} className="p-8 text-center text-slate-400">
                Tidak ada checklist yang sesuai kriteria pencarian.
              </DnaTd>
            </DnaTableRow>
          ) : (
            paginatedData.map((item, idx) => {
              const passPct =
                item.totalItems > 0
                  ? Math.round((item.passedItems / item.totalItems) * 100)
                  : 100;
              return (
                <DnaTableRow
                  key={item.id}
                  className="h-[48px] hover:bg-slate-50/80 transition-colors cursor-pointer"
                  onClick={() => onSelectChecklist(item)}
                >
                  <DnaTd className="px-4 py-2.5 text-center text-slate-400 tabular-nums text-xs font-mono">
                    {(currentPage - 1) * pageSize + idx + 1}
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5">
                    <DnaCell.Date
                      value={
                        item.completedAt
                          ? new Date(item.completedAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"
                      }
                    />
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5">
                    <DnaCell.Code value={item.code} />
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5">
                    <DnaCell.Text primary={item.name} />
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5">
                    <DnaCell.Badge status={item.category} />
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5">
                    <DnaCell.Avatar name={item.pic || item.inspectorName || "QC"} />
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5">
                    <span className="text-[12px] font-medium text-slate-700">
                      {item.verifiedBy}
                    </span>
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5">
                    <DnaCell.Progress
                      value={passPct}
                      colorClass={passPct >= 90 ? "bg-emerald-500" : "bg-amber-500"}
                    />
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5">
                    <DnaCell.Badge status={item.status} />
                  </DnaTd>
                  <DnaTd className="pr-4 py-2.5 text-center" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onSelectChecklist(item)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                      title="Inspeksi Milestone Detail"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </DnaTd>
                </DnaTableRow>
              );
            })
          )}
        </DnaTableBody>
      </DnaTable>
    </DnaDataTableCard>
  );
}
