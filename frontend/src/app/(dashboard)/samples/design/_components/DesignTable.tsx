"use client";

import React from "react";
import { Eye, Camera } from "lucide-react";
import {
  DnaDataTableCard,
  DnaBadge,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaEmptyState,
} from "@/components/dna";
import {
  DesignTask,
  KANBAN_STATES,
  STATE_LABEL,
  STATE_VARIANT,
  formatDate,
} from "../_types/design.types";

interface DesignTableProps {
  data: DesignTask[];
  filteredDesigns: DesignTask[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onSelectDesign: (design: DesignTask) => void;
}

export function DesignTable({
  data,
  filteredDesigns,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onSelectDesign,
}: DesignTableProps) {
  return (
    <DnaDataTableCard
      title="Daftar Task Desain Kemasan"
      description="Brief, klien/brand, versi artwork terakhir, dan batas SLA dari modul Creative."
      searchValue={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder="Cari brief, klien, brand, atau produk..."
      actions={
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none"
        >
          <option value="ALL">Semua Status</option>
          {KANBAN_STATES.map((s) => (
            <option key={s} value={s}>
              {STATE_LABEL[s]}
            </option>
          ))}
          <option value="REVISION">Revisi (rev &gt; 0)</option>
        </select>
      }
    >
      {data.length === 0 ? (
        <DnaEmptyState
          title="Belum Ada Task Desain"
          description="Belum ada task desain pada modul Creative. Gunakan tombol Buat Desain Baru untuk membuat task dari Sales Order."
        />
      ) : (
        <div className="overflow-x-auto">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow>
                <DnaTh className="py-3 px-3 text-center w-10">#</DnaTh>
                <DnaTh className="py-3 px-3">Brief / Produk</DnaTh>
                <DnaTh className="py-3 px-3 w-44">Klien / Brand</DnaTh>
                <DnaTh className="py-3 px-3 w-32">Tipe Task</DnaTh>
                <DnaTh className="py-3 px-3 text-center w-32">Status Papan</DnaTh>
                <DnaTh className="py-3 px-3 text-center w-24">Versi</DnaTh>
                <DnaTh className="py-3 px-3 text-center w-24">Revisi</DnaTh>
                <DnaTh className="py-3 px-3 w-28">Batas SLA</DnaTh>
                <DnaTh className="py-3 px-3 text-center w-20">Artwork</DnaTh>
                <DnaTh className="py-3 px-3 text-center w-16">#</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {filteredDesigns.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={10} className="py-8 text-center text-slate-400">
                    Tidak ada task desain yang sesuai filter.
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredDesigns.map((row, idx) => (
                  <DnaTableRow key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <DnaTd className="py-3 px-3 text-center text-slate-400 font-bold">{idx + 1}</DnaTd>
                    <DnaTd className="py-3 px-3">
                      <span className="font-semibold text-slate-900 block truncate max-w-sm">{row.brief}</span>
                      <span className="text-[11px] text-slate-500">
                        {row.lead?.productInterest || "Produk belum ditentukan"}
                      </span>
                    </DnaTd>
                    <DnaTd className="py-3 px-3">
                      <span className="font-semibold text-slate-800 block">{row.lead?.clientName || "â€”"}</span>
                      <span className="text-[11px] text-slate-500">{row.lead?.brandName || "â€”"}</span>
                    </DnaTd>
                    <DnaTd className="py-3 px-3 text-slate-700 font-medium">{row.taskType || "â€”"}</DnaTd>
                    <DnaTd className="py-3 px-3 text-center">
                      <DnaBadge variant={STATE_VARIANT[row.kanbanState] || "neutral"}>
                        {STATE_LABEL[row.kanbanState] || row.kanbanState}
                      </DnaBadge>
                    </DnaTd>
                    <DnaTd className="py-3 px-3 text-center tabular-nums font-bold text-slate-800">
                      {row.versions[0]?.versionNumber ? `V${row.versions[0].versionNumber}` : "â€”"}
                    </DnaTd>
                    <DnaTd className="py-3 px-3 text-center tabular-nums font-bold text-slate-700">
                      {row.revisionCount}
                    </DnaTd>
                    <DnaTd className="py-3 px-3 tabular-nums text-slate-600">
                      {formatDate(row.slaDeadline)}
                    </DnaTd>
                    <DnaTd className="py-3 px-3 text-center">
                      <button
                        onClick={() => onSelectDesign(row)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-blue-600 inline-flex items-center justify-center"
                        title="Lihat artwork & detail"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    </DnaTd>
                    <DnaTd className="py-3 px-3 text-center">
                      <button
                        onClick={() => onSelectDesign(row)}
                        className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                        title="Detail task desain"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </DnaTd>
                  </DnaTableRow>
                ))
              )}
            </DnaTableBody>
          </DnaTable>
        </div>
      )}
    </DnaDataTableCard>
  );
}
