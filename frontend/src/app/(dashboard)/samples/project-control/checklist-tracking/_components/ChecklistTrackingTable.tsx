"use client";

import React from "react";
import {
  Search,
  Package,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
} from "lucide-react";
import {
  DnaDataTableCard,
  DnaTable,
  DnaTableHead,
  DNA_TABLE_CLASSES,
  DnaCell,
  DnaPagination,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaBadge,
} from "@/components/dna";
import { cn } from "@/lib/utils";
import {
  SampleTrackingItem,
  STAGE_VARIANT,
  STAGE_LABEL,
  STATUS_VARIANT,
  formatDate,
} from "../_types/checklist-tracking.types";

interface ChecklistTrackingTableProps {
  paginatedProjects: SampleTrackingItem[];
  filteredCount: number;
  totalDataCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  page: number;
  pageSize: number;
  totalPages: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  expandedRowIds: string[];
  toggleRowExpansion: (id: string) => void;
  onViewTimeline: (id: string) => void;
}

export function ChecklistTrackingTable({
  paginatedProjects,
  filteredCount,
  totalDataCount,
  searchQuery,
  setSearchQuery,
  page,
  pageSize,
  totalPages,
  setPage,
  setPageSize,
  expandedRowIds,
  toggleRowExpansion,
  onViewTimeline,
}: ChecklistTrackingTableProps) {
  return (
    <DnaDataTableCard
      title="MATRIKS CHECKLIST TRACKING PROJEK"
      count={filteredCount}
      badge={<DnaBadge variant="neutral">TRACKING MATRIX</DnaBadge>}
      actions={
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kode sampel, klien, produk, PIC..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="h-8 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500/20 w-64 placeholder:text-slate-400 font-medium"
          />
        </div>
      }
    >
      <DnaTable>
        <DnaTableHead>
          <DnaTableRow>
            <DnaTh className={cn(DNA_TABLE_CLASSES.th, "w-10 text-center")}>#</DnaTh>
            <DnaTh className={DNA_TABLE_CLASSES.th}>Kode Sampel & Klien</DnaTh>
            <DnaTh className={DNA_TABLE_CLASSES.th}>Brand / Produk</DnaTh>
            <DnaTh className={DNA_TABLE_CLASSES.th}>Kemasan Disarankan</DnaTh>
            <DnaTh className={DNA_TABLE_CLASSES.th}>Sales PIC & R&D PIC</DnaTh>
            <DnaTh className={DNA_TABLE_CLASSES.th}>Target Deadline</DnaTh>
            <DnaTh className={cn(DNA_TABLE_CLASSES.th, "text-center")}>Status Projek</DnaTh>
            <DnaTh className={cn(DNA_TABLE_CLASSES.th, "text-center w-36")}>Aksi</DnaTh>
          </DnaTableRow>
        </DnaTableHead>
        <DnaTableBody>
          {paginatedProjects.length === 0 ? (
            <DnaTableRow>
              <DnaTd colSpan={8} className="py-12 text-center text-slate-500">
                <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-700">Tidak ada sample request ditemukan</p>
                <p className="text-xs text-slate-400">
                  {totalDataCount === 0
                    ? "Belum ada sample request tercatat pada /rnd/samples."
                    : "Sesuaikan kata kunci pencarian atau filter PIC."}
                </p>
              </DnaTd>
            </DnaTableRow>
          ) : (
            paginatedProjects.map((item, idx) => {
              const isExpanded = expandedRowIds.includes(item.id);

              return (
                <React.Fragment key={item.id}>
                  <DnaTableRow className={cn(DNA_TABLE_CLASSES.tr, isExpanded && "bg-blue-50/40")}>
                    <DnaTd className={cn(DNA_TABLE_CLASSES.td, "text-center tabular-nums text-slate-400 text-xs")}>
                      {(page - 1) * pageSize + idx + 1}
                    </DnaTd>

                    <DnaTd className={DNA_TABLE_CLASSES.td}>
                      <div>
                        <DnaCell.Code value={item.sampleCode} />
                        <p className="text-xs font-semibold text-slate-800 mt-0.5">{item.customer}</p>
                      </div>
                    </DnaTd>

                    <DnaTd className={DNA_TABLE_CLASSES.td}>
                      <div>
                        <p className="font-extrabold text-slate-900 text-xs uppercase tracking-tight">
                          {item.brand}
                        </p>
                        <p className="text-[11.5px] text-slate-600 font-medium">{item.product}</p>
                      </div>
                    </DnaTd>

                    <DnaTd className={DNA_TABLE_CLASSES.td}>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-700">{item.packagingType}</span>
                      </div>
                      <span className="text-[10.5px] text-slate-400">Tingkat kesulitan: {item.difficultyLevel}</span>
                    </DnaTd>

                    <DnaTd className={DNA_TABLE_CLASSES.td}>
                      <div className="text-xs">
                        <p className="font-semibold text-slate-800">{item.busdev}</p>
                        <p className="text-[11px] text-slate-500">R&D: {item.picPo}</p>
                      </div>
                    </DnaTd>

                    <DnaTd className={DNA_TABLE_CLASSES.td}>
                      <div className="text-xs">
                        <p className="font-bold text-slate-800 tabular-nums">{formatDate(item.targetDeadline)}</p>
                        <p className="text-[10.5px] text-slate-400 tabular-nums">Mulai: {item.requestedAt}</p>
                      </div>
                    </DnaTd>

                    <DnaTd className={cn(DNA_TABLE_CLASSES.td, "text-center")}>
                      <DnaBadge variant={STATUS_VARIANT[item.status]}>
                        {item.status.replace(/_/g, " ")}
                      </DnaBadge>
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        {STAGE_LABEL[item.stage] || item.stage}
                      </span>
                    </DnaTd>

                    <DnaTd className={cn(DNA_TABLE_CLASSES.td, "text-center")}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleRowExpansion(item.id)}
                          className={cn(
                            "px-2 py-1 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer border shadow-2xs",
                            isExpanded
                              ? "bg-slate-800 text-white border-slate-900"
                              : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
                          )}
                          title="Rincian data sample request"
                        >
                          <span>Detail</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => onViewTimeline(item.id)}
                          className="px-2 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Buka timeline stage sampel"
                        >
                          <span>Timeline</span>
                        </button>
                      </div>
                    </DnaTd>
                  </DnaTableRow>

                  {isExpanded && (
                    <DnaTableRow className="bg-slate-50/90 border-b border-blue-200">
                      <DnaTd colSpan={8} className="p-4 pl-12">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                          <div className="bg-slate-100/90 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-800">
                              Rincian Sample Request: {item.sampleCode} ({item.brand})
                            </span>
                            <DnaBadge variant={STAGE_VARIANT[item.stage] || "neutral"}>
                              {STAGE_LABEL[item.stage] || item.stage}
                            </DnaBadge>
                          </div>
                          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6 text-xs">
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                              <span className="text-slate-500">Fungsi Target :</span>
                              <span className="font-semibold text-slate-800">{item.product}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                              <span className="text-slate-500">Tingkat Kesulitan :</span>
                              <span className="font-semibold text-slate-800 tabular-nums">{item.difficultyLevel}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                              <span className="text-slate-500">Sales PIC :</span>
                              <span className="font-semibold text-slate-800">{item.busdev}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                              <span className="text-slate-500">R&D PIC :</span>
                              <span className="font-semibold text-slate-800">{item.picPo}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2 md:col-span-2">
                              <span className="text-slate-500">Catatan Stage Terakhir :</span>
                              <span className="font-medium text-slate-700 text-right">
                                {item.latestStageNotes || "â€”"}
                              </span>
                            </div>
                          </div>
                          <div className="px-4 pb-4">
                            <button
                              type="button"
                              onClick={() => onViewTimeline(item.id)}
                              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Calendar className="w-3 h-3" />
                              Buka riwayat stage lengkap
                            </button>
                          </div>
                        </div>
                      </DnaTd>
                    </DnaTableRow>
                  )}
                </React.Fragment>
              );
            })
          )}
        </DnaTableBody>
      </DnaTable>

      <DnaPagination
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={filteredCount}
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setPage(1);
        }}
      />
    </DnaDataTableCard>
  );
}
