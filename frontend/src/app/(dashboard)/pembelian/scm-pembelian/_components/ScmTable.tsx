"use client";

import React from "react";
import { Eye, FileCheck } from "lucide-react";
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
import type { PurchaseOrderRecord } from "../_types/scm-pembelian.types";

interface ScmTableProps {
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  filteredPoList: PurchaseOrderRecord[];
  onSelectPo: (po: PurchaseOrderRecord) => void;
}

export function ScmTable({
  isLoading,
  isError,
  refetch,
  searchQuery,
  onSearchChange,
  filteredPoList,
  onSelectPo,
}: ScmTableProps) {
  return (
    <>
      {isError && (
        <div className="mb-4">
          <DnaErrorState
            title="Gagal Memuat Purchase Order"
            message="Terjadi kesalahan saat memuat data PO dari server."
            onRetry={() => refetch()}
          />
        </div>
      )}

      {isLoading ? (
        <DnaLoadingSkeleton rows={5} />
      ) : (
        <DnaDataTableCard
          toolbarProps={{
            searchProps: {
              value: searchQuery,
              onChange: onSearchChange,
              placeholder: "Cari kode PO, supplier, gudang, material...",
            },
          }}
        >
          <div className="overflow-x-auto">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
                  <DnaTh className="px-4 py-2.5 w-[170px]">No. Purchase Order</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[110px]">Tanggal</DnaTh>
                  <DnaTh className="px-4 py-2.5 min-w-[180px]">Supplier</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[150px]">Gudang Tujuan</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[120px]">Deadline Tiba</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[110px] text-center">Status TTD</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[140px] text-right">Total Nilai</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[120px] text-center">Status Bayar</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[130px] text-center">Status Inbound</DnaTh>
                  <DnaTh className="pr-4 py-2.5 w-[70px] text-right">Aksi</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {filteredPoList.length === 0 ? (
                  <DnaTableRow>
                    <DnaTd colSpan={10} className="py-8 text-center">
                      <DnaEmptyState
                        title="Belum Ada Purchase Order"
                        description="Tidak ada data purchase order pada filter ini."
                      />
                    </DnaTd>
                  </DnaTableRow>
                ) : (
                  filteredPoList.map((po) => (
                    <DnaTableRow
                      key={po.id}
                      onClick={() => onSelectPo(po)}
                      className="h-[48px] hover:bg-slate-50/60 transition-colors cursor-pointer"
                    >
                      <DnaTd className="px-4 py-2.5">
                        <DnaCell.Code code={po.poCode} />
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5">
                        <DnaCell.Text text={po.date} />
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5">
                        <span className="text-[12px] font-medium text-slate-900 line-clamp-1">{po.supplierName}</span>
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5">
                        <DnaCell.Text text={po.warehouseTarget} />
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5 tabular-nums text-[11.5px] text-slate-700">
                        {po.deadlineDate}
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5 text-center">
                        {po.isSignedDigitally ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <FileCheck className="w-3 h-3" />
                            TTD Valid
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Belum TTD</span>
                        )}
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5 text-right">
                        <DnaCell.Numeric value={po.totalAmount} prefix="Rp " />
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5 text-center">
                        <DnaBadge
                          variant={
                            po.paymentStatus === "PAID"
                              ? "success"
                              : po.paymentStatus === "DP_PAID"
                              ? "info"
                              : "critical"
                          }
                        >
                          {po.paymentStatus === "PAID"
                            ? "Lunas"
                            : po.paymentStatus === "DP_PAID"
                            ? "DP Lunas"
                            : "Belum Bayar"}
                        </DnaBadge>
                      </DnaTd>
                      <DnaTd className="px-4 py-2.5 text-center">
                        <span
                          className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded border ${
                            po.receivingStatus === "FULLY_RECEIVED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : po.receivingStatus === "PARTIAL_RECEIVED"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}
                        >
                          {po.receivingStatus === "FULLY_RECEIVED"
                            ? "Inbound 100%"
                            : po.receivingStatus === "PARTIAL_RECEIVED"
                            ? "Inbound Parsial"
                            : "Menunggu Inbound"}
                        </span>
                      </DnaTd>
                      <DnaTd className="pr-4 py-2.5 text-right">
                        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                          <DnaButton
                            variant="ghost"
                            className="h-7 w-7 p-0 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                            onClick={() => onSelectPo(po)}
                            title="Lihat Detail"
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
