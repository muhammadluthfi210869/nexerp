"use client";

import React from "react";
import { History, Edit2, Trash2 } from "lucide-react";
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
import type { MasterBarangItem } from "../_types/goods.types";

interface GoodsTableProps {
  goodsList: MasterBarangItem[];
  isLoadingMaterials: boolean;
  isErrorMaterials: boolean;
  materialsError: unknown;
  onRetryMaterials: () => void;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalEntries: number;
  onPageChange: (page: number) => void;
  onSelectBarang: (item: MasterBarangItem) => void;
  onOpenPurchaseHistory: (item: MasterBarangItem) => void;
  onOpenEditBarang: (item: MasterBarangItem) => void;
  onDeleteBarang: (item: MasterBarangItem) => void;
}

export function GoodsTable({
  goodsList,
  isLoadingMaterials,
  isErrorMaterials,
  materialsError,
  onRetryMaterials,
  currentPage,
  pageSize,
  totalPages,
  totalEntries,
  onPageChange,
  onSelectBarang,
  onOpenPurchaseHistory,
  onOpenEditBarang,
  onDeleteBarang,
}: GoodsTableProps) {
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
              <DnaTh className="px-3 py-2.5 w-[45px] text-center">#</DnaTh>
              <DnaTh className="px-3 py-2.5 w-[110px]">Kode</DnaTh>
              <DnaTh className="px-3 py-2.5 min-w-[160px]">Barang</DnaTh>
              <DnaTh className="px-3 py-2.5 w-[120px] text-right">Harga Beli</DnaTh>
              <DnaTh className="px-3 py-2.5 w-[130px]">Kategori</DnaTh>
              <DnaTh className="px-3 py-2.5 w-[120px]">Sub Kategori</DnaTh>
              <DnaTh className="px-3 py-2.5 w-[75px] text-center">Satuan</DnaTh>
              <DnaTh className="px-3 py-2.5 w-[100px]">Tanggal PO</DnaTh>
              <DnaTh className="px-3 py-2.5 w-[120px]">No. Pembelian</DnaTh>
              <DnaTh className="px-3 py-2.5 min-w-[130px]">Supplier</DnaTh>
              <DnaTh className="px-3 py-2.5 w-[75px] text-center">Qty</DnaTh>
              <DnaTh className="px-3 py-2.5 w-[110px] text-right">Harga PO</DnaTh>
              <DnaTh className="pr-4 py-2.5 w-[105px] text-right">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {isLoadingMaterials ? (
              <DnaTableRow>
                <DnaTd colSpan={13} className="p-8 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span>Memuat data barang...</span>
                  </div>
                </DnaTd>
              </DnaTableRow>
            ) : isErrorMaterials ? (
              <DnaTableRow>
                <DnaTd colSpan={13} className="p-8 text-center text-rose-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span>Gagal memuat: {(materialsError as any)?.message || "Terjadi kesalahan"}</span>
                    <DnaButton variant="secondary" size="sm" onClick={onRetryMaterials}>
                      Coba Lagi
                    </DnaButton>
                  </div>
                </DnaTd>
              </DnaTableRow>
            ) : goodsList.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={13} className="p-8 text-center text-slate-400">
                  Tidak ada data barang yang sesuai filter.
                </DnaTd>
              </DnaTableRow>
            ) : (
              goodsList.map((item, idx) => {
                const rowNum = (currentPage - 1) * pageSize + idx + 1;
                return (
                  <DnaTableRow
                    key={item.id}
                    className="h-[48px] hover:bg-slate-50/60 transition-colors cursor-pointer group"
                    onClick={() => onSelectBarang(item)}
                  >
                    <DnaTd className="px-3 py-2.5 text-center text-slate-400 font-mono text-xs">
                      {rowNum}
                    </DnaTd>
                    <DnaTd className="px-3 py-2.5">
                      <DnaCell.Code code={item.kode} />
                    </DnaTd>
                    <DnaTd className="px-3 py-2.5">
                      <div className="font-semibold text-slate-900 line-clamp-1">{item.nama}</div>
                    </DnaTd>
                    <DnaTd className="px-3 py-2.5 text-right font-medium text-slate-900 tabular-nums">
                      Rp {item.hargaBeli.toLocaleString("id-ID")}
                    </DnaTd>
                    <DnaTd className="px-3 py-2.5">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                        {item.kategori}
                      </span>
                    </DnaTd>
                    <DnaTd className="px-3 py-2.5 text-slate-600 text-xs">
                      {item.subKategori}
                    </DnaTd>
                    <DnaTd className="px-3 py-2.5 text-center font-mono text-xs font-semibold text-slate-700">
                      {item.satuan}
                    </DnaTd>
                    <DnaTd className="px-3 py-2.5 text-xs text-slate-500 tabular-nums">
                      {item.lastPoDate || "â€”"}
                    </DnaTd>
                    <DnaTd className="px-3 py-2.5 font-mono text-xs text-blue-700">
                      {item.lastPoNumber}
                    </DnaTd>
                    <DnaTd className="px-3 py-2.5 text-xs text-slate-700 truncate max-w-[130px]" title={item.lastSupplierName}>
                      {item.lastSupplierName}
                    </DnaTd>
                    <DnaTd className="px-3 py-2.5 text-center font-semibold text-xs tabular-nums">
                      {(item.lastPoQty ?? 0) > 0 ? item.lastPoQty : "â€”"}
                    </DnaTd>
                    <DnaTd className="px-3 py-2.5 text-right text-xs tabular-nums text-slate-600">
                      {(item.lastPoPrice ?? 0) > 0 ? `Rp ${(item.lastPoPrice ?? 0).toLocaleString("id-ID")}` : "â€”"}
                    </DnaTd>
                    <DnaTd className="pr-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <DnaButton
                          variant="ghost"
                          className="h-7 w-7 p-0 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-600"
                          onClick={() => onOpenPurchaseHistory(item)}
                          title="Riwayat Pembelian (#modal-purchase-history)"
                        >
                          <History className="w-3.5 h-3.5" />
                        </DnaButton>
                        <DnaButton
                          variant="ghost"
                          className="h-7 w-7 p-0 rounded hover:bg-slate-100 text-slate-400 hover:text-amber-600"
                          onClick={() => onOpenEditBarang(item)}
                          title="Sunting Barang"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </DnaButton>
                        <DnaButton
                          variant="ghost"
                          className="h-7 w-7 p-0 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                          onClick={() => onDeleteBarang(item)}
                          title="Hapus Barang"
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
