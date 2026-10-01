"use client";

import React from "react";
import { Upload, Download, Eye, Edit2 } from "lucide-react";
import {
  DnaDataTableCard,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaBadge,
  DnaCell,
  DnaButton,
} from "@/components/dna";
import type { MasterSupplierItem } from "../_types/supplier.types";

interface SupplierTableProps {
  suppliers: MasterSupplierItem[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
  // Toolbar props
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedFilterColumn: string;
  onSelectFilterColumn: (col: string) => void;
  filterColumnValue: string;
  onFilterValueChange: (val: string) => void;
  onOpenCreateSupplier: () => void;
  onOpenImportModal: () => void;
  onExportExcel: () => void;
  // Pagination
  currentPage: number;
  totalPages: number;
  totalEntries: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  // Row Actions
  onSelectSupplier: (item: MasterSupplierItem) => void;
  onEditSupplier: (item: MasterSupplierItem) => void;
}

export function SupplierTable({
  suppliers,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  searchQuery,
  onSearchChange,
  selectedFilterColumn,
  onSelectFilterColumn,
  filterColumnValue,
  onFilterValueChange,
  onOpenCreateSupplier,
  onOpenImportModal,
  onExportExcel,
  currentPage,
  totalPages,
  totalEntries,
  pageSize,
  onPageChange,
  onSelectSupplier,
  onEditSupplier,
}: SupplierTableProps) {
  return (
    <DnaDataTableCard
      toolbarProps={{
        searchQuery,
        onSearchChange,
        searchPlaceholder: "Cari kode vendor, nama supplier, PIC, kota...",
        filterColumns: [
          {
            key: "kategori",
            label: "Kategori Bahan",
            type: "select",
            options: [
              "Bahan Baku",
              "Kemasan Primer",
              "Kemasan Sekunder",
              "Bahan Pembantu",
              "Jasa Maklon",
            ],
          },
          {
            key: "pajak",
            label: "Status Pajak",
            type: "select",
            options: ["PKP", "NON"],
          },
        ],
        selectedColumn: selectedFilterColumn,
        onSelectColumn: (col) => {
          onSelectFilterColumn(col);
          onFilterValueChange("ALL");
        },
        filterValue: filterColumnValue,
        onFilterValueChange,
        actionButton: {
          label: "Tambah Supplier",
          onClick: onOpenCreateSupplier,
        },
        extraActions: (
          <div className="flex items-center gap-2">
            <DnaButton
              variant="outline"
              size="sm"
              onClick={onOpenImportModal}
              icon={<Upload className="w-3.5 h-3.5" />}
            >
              Import Excel
            </DnaButton>
            <DnaButton
              variant="outline"
              size="sm"
              onClick={onExportExcel}
              icon={<Download className="w-3.5 h-3.5" />}
            >
              Export Excel
            </DnaButton>
          </div>
        ),
      }}
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
              <DnaTh className="px-3.5 py-2.5 w-[130px]">Kode Vendor</DnaTh>
              <DnaTh className="px-3.5 py-2.5 min-w-[180px]">Nama Perusahaan</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[140px]">PIC Vendor</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[130px]">No. WhatsApp</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[140px]">Kategori Bahan</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[120px]">Kota Domisili</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[100px] text-center">Pajak (%)</DnaTh>
              <DnaTh className="px-3.5 py-2.5 w-[110px] text-center">Termin Bayar</DnaTh>
              <DnaTh className="pr-4 py-2.5 w-[80px] text-right">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {isLoading ? (
              <DnaTableRow>
                <DnaTd colSpan={10} className="p-12 text-center text-slate-400 font-medium">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span>Memuat data supplier...</span>
                  </div>
                </DnaTd>
              </DnaTableRow>
            ) : isError ? (
              <DnaTableRow>
                <DnaTd colSpan={10} className="p-12 text-center text-rose-500 font-medium">
                  <div className="flex flex-col items-center gap-2">
                    <span>{errorMessage || "Gagal memuat data supplier dari server"}</span>
                    <DnaButton size="sm" variant="secondary" onClick={onRetry}>
                      Coba Lagi
                    </DnaButton>
                  </div>
                </DnaTd>
              </DnaTableRow>
            ) : suppliers.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={10} className="p-8 text-center text-slate-400">
                  Tidak ada data supplier yang sesuai filter.
                </DnaTd>
              </DnaTableRow>
            ) : (
              suppliers.map((sup, idx) => (
                <DnaTableRow
                  key={sup.id}
                  className="h-[48px] hover:bg-slate-50/60 transition-colors cursor-pointer group"
                  onClick={() => onSelectSupplier(sup)}
                >
                  <DnaTd className="px-3.5 py-2.5 text-center text-slate-400 font-mono text-xs">
                    {(currentPage - 1) * pageSize + idx + 1}
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5">
                    <DnaCell.Code code={sup.vendorCode} />
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5">
                    <span className="text-[12px] font-semibold text-slate-900 line-clamp-1">{sup.nama}</span>
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5">
                    <span className="text-[12px] font-medium text-slate-700 line-clamp-1">{sup.pic}</span>
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5 tabular-nums text-[11.5px] text-emerald-700 font-medium">
                    {sup.phone}
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5">
                    <DnaBadge variant="neutral">
                      {sup.kategoriBahan}
                    </DnaBadge>
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5">
                    <DnaCell.Text text={sup.kota} />
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5 text-center">
                    <DnaBadge variant={sup.pajakPersen > 0 ? "success" : "neutral"}>
                      {sup.pajakPersen > 0 ? `${sup.pajakPersen}%` : "0%"}
                    </DnaBadge>
                  </DnaTd>
                  <DnaTd className="px-3.5 py-2.5 text-center tabular-nums text-[11.5px] text-blue-700 font-semibold">
                    {sup.paymentTerm}
                  </DnaTd>
                  <DnaTd className="pr-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <DnaButton
                        variant="ghost"
                        className="h-7 w-7 p-0 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                        onClick={() => onSelectSupplier(sup)}
                        title="Lihat Detail"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </DnaButton>
                      <DnaButton
                        variant="ghost"
                        className="h-7 w-7 p-0 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                        onClick={() => onEditSupplier(sup)}
                        title="Edit Supplier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
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
  );
}
