"use client";

import React from "react";
import { Eye, Edit2, Trash2 } from "lucide-react";
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
} from "@/components/dna";
import type { MasterCustomerItem } from "../_types/customer.types";

interface CustomerTableProps {
  customers: MasterCustomerItem[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalEntries: number;
  onPageChange: (page: number) => void;
  onSelectCustomer: (cust: MasterCustomerItem) => void;
  onEditCustomer: (cust: MasterCustomerItem) => void;
  onDeleteCustomer: (cust: MasterCustomerItem) => void;
}

export function CustomerTable({
  customers,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  currentPage,
  pageSize,
  totalPages,
  totalEntries,
  onPageChange,
  onSelectCustomer,
  onEditCustomer,
  onDeleteCustomer,
}: CustomerTableProps) {
  return (
    <DnaDataTableCard
      paginationProps={{
        currentPage,
        totalPages,
        totalEntries,
        pageSize,
        onPageChange,
      }}
    >
      <div className="overflow-x-auto">
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-slate-600 font-bold uppercase tracking-wider text-[11px] select-none">
              <DnaTh className="px-3.5 py-2.5 w-[45px] text-center text-slate-400">#</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[110px]">Kode</DnaTh>
              <DnaTh className="px-3.5 py-2.5 min-w-[160px]">Nama Pelanggan & Brand</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[130px]">Telepon</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[130px]">Kategori</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[120px]">Kota</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[130px]">Penginput (Sales)</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[90px] text-center">SO Sample</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[90px] text-center">SO Produk</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[140px] text-right">Nominal SO Produk</DnaTh>
              <DnaTh className="pr-4 py-2.5 w-[90px] text-right">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {isLoading ? (
              <DnaTableRow>
                <DnaTd colSpan={11} className="p-8 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span>Memuat data pelanggan...</span>
                  </div>
                </DnaTd>
              </DnaTableRow>
            ) : isError ? (
              <DnaTableRow>
                <DnaTd colSpan={11} className="p-8 text-center text-rose-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span>Gagal memuat data: {errorMessage || "Terjadi kesalahan"}</span>
                    <DnaButton variant="secondary" size="sm" onClick={onRetry}>
                      Coba Lagi
                    </DnaButton>
                  </div>
                </DnaTd>
              </DnaTableRow>
            ) : customers.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={11} className="p-8 text-center text-slate-400">
                  Tidak ada data pelanggan yang sesuai filter.
                </DnaTd>
              </DnaTableRow>
            ) : (
              customers.map((cust, idx) => {
                const rowNum = (currentPage - 1) * pageSize + idx + 1;
                return (
                  <DnaTableRow
                    key={cust.id}
                    className="h-[48px] hover:bg-slate-50/60 transition-colors cursor-pointer group"
                    onClick={() => onSelectCustomer(cust)}
                  >
                    <DnaTd className="px-3.5 py-2.5 text-center text-slate-400 font-mono text-xs">
                      {rowNum}
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5">
                      <DnaCell.Code code={cust.customerCode} />
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5">
                      <div className="font-semibold text-slate-900 text-xs line-clamp-1">{cust.nama}</div>
                      {cust.brandName && cust.brandName !== cust.nama && (
                        <div className="text-[11px] text-slate-500 line-clamp-1">{cust.brandName}</div>
                      )}
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5 tabular-nums text-[11.5px] text-emerald-700 font-medium">
                      {cust.phone}
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5">
                      <DnaBadge variant="neutral">
                        {cust.kategori}
                      </DnaBadge>
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5">
                      <DnaCell.Text text={cust.kota} />
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5">
                      <DnaCell.Text text={cust.penginput} />
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 tabular-nums">
                        {cust.soSampleCount}
                      </span>
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 tabular-nums">
                        {cust.soProdukCount}
                      </span>
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5 text-right font-medium text-slate-900 tabular-nums">
                      {cust.nominalSoProduk > 0 ? (
                        <DnaCell.Numeric value={cust.nominalSoProduk} prefix="Rp " />
                      ) : (
                        <span className="text-slate-400">Rp 0</span>
                      )}
                    </DnaTd>
                    <DnaTd className="pr-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <DnaButton
                          variant="ghost"
                          className="h-7 w-7 p-0 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-600"
                          onClick={() => onSelectCustomer(cust)}
                          title="Lihat Detail (Sample, Produksi, Legalitas)"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </DnaButton>
                        <DnaButton
                          variant="ghost"
                          className="h-7 w-7 p-0 rounded hover:bg-slate-100 text-slate-400 hover:text-amber-600"
                          onClick={() => onEditCustomer(cust)}
                          title="Sunting Pelanggan"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </DnaButton>
                        <DnaButton
                          variant="ghost"
                          className="h-7 w-7 p-0 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                          onClick={() => onDeleteCustomer(cust)}
                          title="Hapus Pelanggan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
  );
}
