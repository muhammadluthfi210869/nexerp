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
import { PurchaseBill } from "../_types/faktur-pembelian.types";

interface InvoiceTableProps {
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  filteredList: PurchaseBill[];
  onSelectBill: (bill: PurchaseBill) => void;
}

export function InvoiceTable({
  isLoading,
  isError,
  refetch,
  searchQuery,
  onSearchChange,
  filteredList,
  onSelectBill,
}: InvoiceTableProps) {
  return (
    <>
      {isError && (
        <div className="mb-4">
          <DnaErrorState
            title="Gagal Memuat Faktur Pembelian"
            message="Terjadi kesalahan saat mengambil data faktur pembelian dari server."
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
              placeholder: "Cari No Faktur, PO, vendor, alasan belum lunas...",
            },
          }}
        >
          <div className="overflow-x-auto">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
                  <DnaTh className="px-4 py-2.5 w-[50px] text-center">#</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[110px]">Tgl Faktur</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[170px]">No. Faktur</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[160px]">No. Purchase Order</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[110px]">Jatuh Tempo</DnaTh>
                  <DnaTh className="px-4 py-2.5 min-w-[180px]">Supplier</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[160px]">Kategori Pengadaan</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[140px] text-right">Nilai Tagihan</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[140px] text-right">Sisa Hutang</DnaTh>
                  <DnaTh className="px-4 py-2.5 w-[120px] text-center">Status Bayar</DnaTh>
                  <DnaTh className="pr-4 py-2.5 w-[70px] text-right">Aksi</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {filteredList.length === 0 ? (
                  <DnaTableRow>
                    <DnaTd colSpan={11} className="py-8 text-center">
                      <DnaEmptyState
                        title="Tidak Ada Faktur Pembelian"
                        description="Belum ada data faktur pembelian atau tidak ada hasil yang sesuai dengan filter."
                      />
                    </DnaTd>
                  </DnaTableRow>
                ) : (
                  filteredList.map((row, idx) => {
                    const remaining = Math.max(0, row.grandTotal - row.paidAmount);
                    return (
                      <DnaTableRow
                        key={row.id}
                        onClick={() => onSelectBill(row)}
                        className="h-[48px] hover:bg-slate-50/60 transition-colors cursor-pointer"
                      >
                        <DnaTd className="px-4 py-2.5 text-center text-slate-400 tabular-nums text-xs font-mono">
                          {idx + 1}
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5">
                          <DnaCell.Text text={row.invoiceDate} />
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5">
                          <DnaCell.Code code={row.billNumber} />
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5">
                          <DnaCell.Code code={row.poNumber} />
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5">
                          <DnaCell.Text text={row.dueDate} />
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5">
                          <span className="text-[12px] font-medium text-slate-900 line-clamp-1">{row.vendorName}</span>
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5">
                          <span className="text-[12px] font-medium text-slate-700 line-clamp-1">{row.procurementCategory}</span>
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5 text-right">
                          <DnaCell.Numeric value={row.grandTotal} prefix="Rp " />
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5 text-right tabular-nums">
                          {remaining > 0 ? (
                            <span className="text-[12px] font-semibold text-rose-600">
                              Rp {remaining.toLocaleString("id-ID")}
                            </span>
                          ) : (
                            <span className="text-[12px] font-semibold text-emerald-600">Lunas</span>
                          )}
                        </DnaTd>
                        <DnaTd className="px-4 py-2.5 text-center">
                          {row.paymentStatus === "PAID" ? (
                            <DnaBadge variant="success">Sudah Dibayar</DnaBadge>
                          ) : row.paymentStatus === "PARTIAL" ? (
                            <DnaBadge variant="warning">Sebagian</DnaBadge>
                          ) : (
                            <DnaBadge variant="critical">Belum Dibayar</DnaBadge>
                          )}
                        </DnaTd>
                        <DnaTd className="pr-4 py-2.5 text-right">
                          <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                            <DnaButton
                              variant="ghost"
                              className="h-7 w-7 p-0 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                              onClick={() => onSelectBill(row)}
                              title="Lihat Detail"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </DnaButton>
                          </div>
                        </DnaTd>
                      </DnaTableRow>
                    );
                  })
                )}
              </DnaTableBody>
            </DnaTable>
          </div>
        </DnaDataTableCard>
      )}
    </>
  );
}
