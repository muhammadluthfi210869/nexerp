"use client";

import React from "react";
import { Eye, CheckCircle2, XCircle } from "lucide-react";
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
  DnaEmptyState,
} from "@/components/dna";
import type { PurchaseRequestRecord } from "../_types/purchase-requests.types";
import { getStatusBadge, getPriorityBadge } from "./PrBadges";

interface PrTableProps {
  filteredPrList: PurchaseRequestRecord[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectPr: (pr: PurchaseRequestRecord) => void;
  onApprove: (pr: PurchaseRequestRecord) => void;
  onOpenReject: (pr: PurchaseRequestRecord) => void;
}

export function PrTable({
  filteredPrList,
  searchQuery,
  onSearchChange,
  onSelectPr,
  onApprove,
  onOpenReject,
}: PrTableProps) {
  return (
    <DnaDataTableCard
      toolbarProps={{
        searchProps: {
          value: searchQuery,
          onChange: onSearchChange,
          placeholder: "Cari no PR, departemen, pemohon...",
        },
      }}
    >
      <div className="overflow-x-auto">
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
              <DnaTh className="px-4 py-2.5 w-[170px]">No. PR</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[110px]">Tanggal</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[160px]">Departemen</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[160px]">Pemohon</DnaTh>
              <DnaTh className="px-4 py-2.5 min-w-[180px]">Kategori Anggaran</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[110px] text-center">Prioritas</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[140px] text-right">Estimasi Budget</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[140px] text-center">Status Approval</DnaTh>
              <DnaTh className="pr-4 py-2.5 w-[70px] text-right">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {filteredPrList.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={9} className="py-8 text-center">
                  <DnaEmptyState
                    title="Belum Ada Permintaan Pembelian"
                    description="Belum ada data permintaan pembelian yang sesuai filter ini."
                  />
                </DnaTd>
              </DnaTableRow>
            ) : (
              filteredPrList.map((pr) => (
                <DnaTableRow
                  key={pr.id}
                  onClick={() => onSelectPr(pr)}
                  className="h-[48px] hover:bg-slate-50/60 transition-colors cursor-pointer"
                >
                  <DnaTd className="px-4 py-2.5">
                    <DnaCell.Code code={pr.prCode} />
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5">
                    <DnaCell.Text text={pr.date} />
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5">
                    <DnaCell.Text text={pr.department} />
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5">
                    <span className="text-[12px] font-medium text-slate-900 line-clamp-1">
                      {pr.requesterName}{" "}
                      <span className="text-[10.5px] text-slate-400 font-normal">({pr.requesterRole})</span>
                    </span>
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5">
                    <span className="text-[12px] font-medium text-slate-700 line-clamp-1">{pr.categoryCoa}</span>
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 text-center">
                    {getPriorityBadge(pr.priority)}
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 text-right">
                    <DnaCell.Numeric value={pr.totalEstimated} prefix="Rp " />
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 text-center">
                    {getStatusBadge(pr.status)}
                  </DnaTd>
                  <DnaTd className="pr-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <DnaButton
                        variant="ghost"
                        className="h-7 w-7 p-0 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                        onClick={() => onSelectPr(pr)}
                        title="Lihat Detail"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </DnaButton>
                      {["PENDING_HEAD", "PENDING_FINANCE", "PENDING_DIRECTOR"].includes(pr.status) && (
                        <>
                          <button
                            type="button"
                            onClick={() => onApprove(pr)}
                            className="p-1 rounded text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Setujui PR"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenReject(pr)}
                            className="p-1 rounded text-rose-500 hover:bg-rose-50 transition-colors"
                            title="Tolak PR"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </DnaTd>
                </DnaTableRow>
              ))
            )}
          </DnaTableBody>
        </DnaTable>
      </div>
    </DnaDataTableCard>
  );
}
