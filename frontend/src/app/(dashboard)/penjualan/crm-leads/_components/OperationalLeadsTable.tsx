"use client";

import React from "react";
import { Eye, Trash2 } from "lucide-react";
import {
  DnaDataTableCard,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import type { OperationalLeadBatch } from "../_types/crm-leads.types";

interface OperationalLeadsTableProps {
  batches: OperationalLeadBatch[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenCreateModal: () => void;
  onSelectBatch: (batch: OperationalLeadBatch) => void;
  onDeleteBatch: (id: string) => void;
}

export function OperationalLeadsTable({
  batches,
  searchQuery,
  onSearchChange,
  onOpenCreateModal,
  onSelectBatch,
  onDeleteBatch,
}: OperationalLeadsTableProps) {
  return (
    <DnaDataTableCard
      toolbarProps={{
        searchQuery: searchQuery,
        onSearchChange: onSearchChange,
        searchPlaceholder: "Cari tanggal, catatan, penerima...",
        actionButton: {
          label: "Buat Leads",
          onClick: onOpenCreateModal,
        },
      }}
      paginationProps={{
        currentPage: 1,
        totalPages: 1,
        totalEntries: batches.length,
        pageSize: 10,
        onPageChange: () => {},
      }}
    >
      <DnaTable>
        <DnaTableHead>
          <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider">
            <DnaTh className="p-3.5 w-12 text-center text-slate-400">#</DnaTh>
            <DnaTh className="p-3.5 w-40">TANGGAL LEADS</DnaTh>
            <DnaTh className="p-3.5">CATATAN DISTRIBUSI</DnaTh>
            <DnaTh className="p-3.5 w-40 text-center">TOTAL QTY LEADS</DnaTh>
            <DnaTh className="p-3.5 w-24 text-center">AKSI</DnaTh>
          </DnaTableRow>
        </DnaTableHead>
        <DnaTableBody>
          {batches.length === 0 ? (
            <DnaTableRow>
              <DnaTd colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                Tidak ada data distribusi leads ditemukan.
              </DnaTd>
            </DnaTableRow>
          ) : (
            batches.map((batch, index) => (
              <DnaTableRow key={batch.id} className="hover:bg-slate-50/80 transition-colors">
                <DnaTd className="p-3.5 text-center text-slate-400 tabular-nums">{index + 1}</DnaTd>
                <DnaTd className="p-3.5 font-bold text-slate-800">{batch.tanggalLeads}</DnaTd>
                <DnaTd className="p-3.5 text-slate-700">
                  <p className="font-semibold text-slate-900">{batch.catatan}</p>
                  <p className="text-[11px] text-slate-400">{batch.items.map((i) => i.penerima).join(", ")}</p>
                </DnaTd>
                <DnaTd className="p-3.5 text-center">
                  <span className="bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-1 rounded-full font-bold text-xs">
                    {batch.totalQtyLeads} Leads
                  </span>
                </DnaTd>
                <DnaTd className="p-3.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onSelectBatch(batch)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                      title="Lihat Alokasi"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteBatch(batch.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </DnaTd>
              </DnaTableRow>
            ))
          )}
        </DnaTableBody>
      </DnaTable>
    </DnaDataTableCard>
  );
}
