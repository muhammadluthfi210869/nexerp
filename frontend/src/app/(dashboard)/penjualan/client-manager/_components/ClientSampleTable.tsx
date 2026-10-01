"use client";

import React from "react";
import {
  DnaDataTableCard,
  DnaEmptyState,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import {
  LeadRow,
  GroupKey,
  formatRupiah,
  leadStatusVariant,
} from "../_types/client-manager.types";

interface ClientSampleTableProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sampleList: LeadRow[];
  onOpenLead: (lead: LeadRow, group: GroupKey) => void;
}

export function ClientSampleTable({
  searchQuery,
  onSearchChange,
  sampleList,
  onOpenLead,
}: ClientSampleTableProps) {
  return (
    <DnaDataTableCard
      toolbarProps={{
        searchQuery,
        onSearchChange,
        searchPlaceholder: "Cari nama klien, brand, produk, PIC BusDev...",
      }}
      paginationProps={{
        currentPage: 1,
        totalPages: 1,
        totalEntries: sampleList.length,
        pageSize: 10,
        onPageChange: () => {},
      }}
    >
      {sampleList.length === 0 ? (
        <div className="p-6">
          <DnaEmptyState
            title="Belum Ada Klien Sample"
            description="Tidak ada lead pada fase sample (CONTACTED / NEGOTIATION / SAMPLE_REQUESTED / SAMPLE_APPROVED) di /bussdev/leads/group/sample."
          />
        </div>
      ) : (
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider">
              <DnaTh className="p-3.5 w-10 text-center text-slate-400">#</DnaTh>
              <DnaTh className="p-3.5 w-56">KLIEN & DOMISILI</DnaTh>
              <DnaTh className="p-3.5">BRAND & PRODUK</DnaTh>
              <DnaTh className="p-3.5 w-44 text-right">NILAI & MOQ</DnaTh>
              <DnaTh className="p-3.5 w-36 text-center">STATUS</DnaTh>
              <DnaTh className="p-3.5 w-24 text-center">AKSI</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {sampleList.map((s, idx) => (
              <DnaTableRow
                key={s.id}
                onClick={() => onOpenLead(s, "sample")}
                className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
              >
                <DnaTd className="p-3.5 text-center text-slate-400 tabular-nums">{idx + 1}</DnaTd>
                <DnaTd className="p-3.5">
                  <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {s.clientName}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {[s.city, s.province].filter(Boolean).join(", ") || "â€”"}
                  </div>
                </DnaTd>
                <DnaTd className="p-3.5">
                  <div className="font-semibold text-slate-800">{s.brandName}</div>
                  <div className="text-[11px] text-slate-500">{s.productInterest}</div>
                </DnaTd>
                <DnaTd className="p-3.5 text-right">
                  <div className="tabular-nums font-bold text-emerald-600">
                    {formatRupiah(s.estimatedValue)}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    MOQ: {s.moq.toLocaleString("id-ID")} pcs
                  </div>
                </DnaTd>
                <DnaTd className="p-3.5 text-center">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${leadStatusVariant(s.status)}`}
                  >
                    {s.status}
                  </span>
                  <div className="text-[10px] text-slate-400 tabular-nums mt-0.5">
                    PIC: {s.picName}
                  </div>
                </DnaTd>
                <DnaTd className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => onOpenLead(s, "sample")}
                    className="px-2.5 py-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Detail
                  </button>
                </DnaTd>
              </DnaTableRow>
            ))}
          </DnaTableBody>
        </DnaTable>
      )}
    </DnaDataTableCard>
  );
}
