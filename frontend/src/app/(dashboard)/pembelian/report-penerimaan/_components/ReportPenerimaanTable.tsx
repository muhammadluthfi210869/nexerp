"use client";

import React from "react";
import { Eye } from "lucide-react";
import {
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaLoadingSkeleton,
  DnaErrorState,
  DnaEmptyState,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaCell,
} from "@/components/dna";
import type { ReceivingReportRow } from "../_types/report-penerimaan.types";

interface ReportPenerimaanTableProps {
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  filteredList: ReceivingReportRow[];
  onSelectRow: (row: ReceivingReportRow) => void;
}

export function ReportPenerimaanTable({
  isLoading,
  isError,
  refetch,
  searchQuery,
  onSearchChange,
  filteredList,
  onSelectRow,
}: ReportPenerimaanTableProps) {
  return (
    <>
      {isError && (
        <div className="mb-4">
          <DnaErrorState
            title="Gagal Memuat Laporan Penerimaan"
            message="Terjadi kesalahan saat memuat data laporan penerimaan barang dari server."
            onRetry={() => refetch()}
          />
        </div>
      )}

      {isLoading ? (
        <DnaLoadingSkeleton rows={6} />
      ) : (
        <DnaDataTableCard
          toolbarProps={{
            searchProps: {
              value: searchQuery,
              onChange: onSearchChange,
              placeholder: "Cari No GRN, PO, supplier, atau nama barang...",
            },
          }}
        >
          <div className="overflow-x-auto">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
                  <DnaTh className="px-3 py-2.5 w-[50px] text-center">#</DnaTh>
                  <DnaTh className="px-3 py-2.5 w-[110px]">Tgl Terima</DnaTh>
                  <DnaTh className="px-3 py-2.5 w-[140px]">No. GRN / SJ</DnaTh>
                  <DnaTh className="px-3 py-2.5 w-[130px]">No. PO Ref</DnaTh>
                  <DnaTh className="px-3 py-2.5 min-w-[150px]">Supplier</DnaTh>
                  <DnaTh className="px-3 py-2.5 min-w-[170px]">Nama Barang</DnaTh>
                  <DnaTh className="px-3 py-2.5 w-[100px] text-right font-bold text-blue-700">Diterima</DnaTh>
                  <DnaTh className="px-3 py-2.5 w-[100px] text-right font-bold text-emerald-700">Kondisi Bagus</DnaTh>
                  <DnaTh className="px-3 py-2.5 w-[90px] text-right font-bold text-rose-700">Reject</DnaTh>
                  <DnaTh className="px-3 py-2.5 w-[90px] text-right font-bold text-purple-700">Gratis (Free)</DnaTh>
                  <DnaTh className="px-3 py-2.5 w-[70px] text-center">Satuan</DnaTh>
                  <DnaTh className="pr-3 py-2.5 w-[60px] text-right">Aksi</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {filteredList.length === 0 ? (
                  <DnaTableRow>
                    <DnaTd colSpan={12} className="py-8 text-center">
                      <DnaEmptyState
                        title="Tidak Ada Data Penerimaan"
                        description="Belum ada riwayat penerimaan barang atau tidak ada data yang cocok dengan pencarian."
                      />
                    </DnaTd>
                  </DnaTableRow>
                ) : (
                  filteredList.map((row, idx) => (
                    <DnaTableRow
                      key={`${row.id}-${row.itemCode}-${idx}`}
                      onClick={() => onSelectRow(row)}
                      className="h-[48px] hover:bg-slate-50/60 transition-colors cursor-pointer"
                    >
                      <DnaTd className="px-3 py-2 text-center text-slate-400 tabular-nums text-xs">
                        {idx + 1}
                      </DnaTd>
                      <DnaTd className="px-3 py-2">
                        <DnaCell.Text text={row.receiveDate} />
                      </DnaTd>
                      <DnaTd className="px-3 py-2">
                        <DnaCell.Code code={row.grnNumber} />
                      </DnaTd>
                      <DnaTd className="px-3 py-2">
                        <DnaCell.Code code={row.poNumber} />
                      </DnaTd>
                      <DnaTd className="px-3 py-2">
                        <span className="text-[12px] font-medium text-slate-900 line-clamp-1">{row.vendorName}</span>
                      </DnaTd>
                      <DnaTd className="px-3 py-2">
                        <div className="min-w-0">
                          <span className="text-[12px] font-semibold text-slate-900 line-clamp-1">{row.itemName}</span>
                          <span className="text-[10px] text-slate-400 font-mono block">{row.itemCode}</span>
                        </div>
                      </DnaTd>
                      <DnaTd className="px-3 py-2 text-right">
                        <span className="text-[12px] font-bold text-blue-700 tabular-nums">
                          {row.qtyReceived.toLocaleString("id-ID")}
                        </span>
                      </DnaTd>
                      <DnaTd className="px-3 py-2 text-right">
                        <span className="text-[12px] font-bold text-emerald-700 tabular-nums">
                          {row.qtyGood.toLocaleString("id-ID")}
                        </span>
                      </DnaTd>
                      <DnaTd className="px-3 py-2 text-right">
                        {row.qtyReject > 0 ? (
                          <span className="text-[12px] font-bold text-rose-600 tabular-nums">
                            {row.qtyReject.toLocaleString("id-ID")}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">0</span>
                        )}
                      </DnaTd>
                      <DnaTd className="px-3 py-2 text-right">
                        {row.qtyFree > 0 ? (
                          <span className="text-[12px] font-bold text-purple-700 tabular-nums">
                            {row.qtyFree.toLocaleString("id-ID")}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">0</span>
                        )}
                      </DnaTd>
                      <DnaTd className="px-3 py-2 text-center">
                        <DnaBadge variant="neutral">{row.unit}</DnaBadge>
                      </DnaTd>
                      <DnaTd className="pr-3 py-2 text-right">
                        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                          <DnaButton
                            variant="ghost"
                            className="h-7 w-7 p-0 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                            onClick={() => onSelectRow(row)}
                            title="Lihat Rincian"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </DnaButton>
                        </div>
                      </DnaTd>
                    </DnaTableRow>
                  ))
                )}
              </DnaTableBody>
            </DnaTable>
          </div>
        </DnaDataTableCard>
      )}
    </>
  );
}
