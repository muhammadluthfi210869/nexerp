"use client";

import React from "react";
import { Eye, Printer, Plus } from "lucide-react";
import {
  DnaDataTableCard,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaBadge,
  DnaButton,
  DnaCell,
} from "@/components/dna";
import {
  SpkItem,
  SPK_STATUS_CONFIG,
} from "../_types/spk.types";

interface SpkTableProps {
  filteredList: SpkItem[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedColumn: string;
  onSelectColumn: (col: string) => void;
  filterValue: string;
  onFilterValueChange: (val: string) => void;
  onCreateClick: () => void;
  onViewDetail: (item: SpkItem) => void;
  onPrint: (item: SpkItem) => void;
}

export function SpkTable({
  filteredList,
  searchQuery,
  onSearchChange,
  selectedColumn,
  onSelectColumn,
  filterValue,
  onFilterValueChange,
  onCreateClick,
  onViewDetail,
  onPrint,
}: SpkTableProps) {
  return (
    <DnaDataTableCard
      toolbarProps={{
        searchQuery,
        onSearchChange,
        searchPlaceholder: "Cari No. SPK, No. SO, produk, klien, PIC supervisor...",
        filterColumns: [
          {
            key: "status",
            label: "Status SPK",
            options: [
              "DRAFT",
              "PENDING_APPROVAL",
              "RELEASED",
              "IN_PROGRESS",
              "COMPLETED",
              "CANCELLED",
            ],
          },
          {
            key: "category",
            label: "Kategori Produk",
            options: ["Skincare", "Cleanser", "Moisturizer", "Sunscreen"],
          },
        ],
        selectedColumn,
        onSelectColumn,
        filterValue,
        onFilterValueChange,
        actionButton: {
          label: "Buat SPK Baru",
          onClick: onCreateClick,
          icon: <Plus className="w-4 h-4" />,
        },
      }}
    >
      <div className="overflow-x-auto">
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
              <DnaTh className="px-3 py-3 h-[40px] w-[45px] text-center">#</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] w-[110px]">Tanggal Terbit</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] w-[140px]">No. SPK</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] w-[120px]">No. SO Ref</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] min-w-[150px]">Klien / Brand</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] min-w-[180px]">Nama Produk Jadi</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] w-[130px]">Kategori Produk</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-right w-[140px]">Jumlah Pesanan (Pcs)</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] min-w-[160px]">Alokasi Line Mesin</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] w-[140px]">PIC Supervisor</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-center w-[120px]">Status SPK</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-right w-[80px]">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {filteredList.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={12} className="py-12 text-center text-xs text-slate-400">
                  Tidak ada Surat Perintah Kerja (SPK) yang sesuai kriteria pencarian & filter.
                </DnaTd>
              </DnaTableRow>
            ) : (
              filteredList.map((item, idx) => {
                const statusInfo = SPK_STATUS_CONFIG[item.status] || {
                  label: item.status,
                  badge: "default",
                };

                return (
                  <DnaTableRow
                    key={item.id}
                    onClick={() => onViewDetail(item)}
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer group h-[48px]"
                  >
                    {/* 1: # Index */}
                    <DnaTd className="px-3 py-2 text-center text-slate-400 font-mono text-[11px]">
                      {idx + 1}
                    </DnaTd>

                    {/* 2: Tanggal Terbit */}
                    <DnaTd className="px-3 py-2 text-slate-700 text-xs">
                      {item.issueDate}
                    </DnaTd>

                    {/* 3: No. SPK */}
                    <DnaTd className="px-3 py-2">
                      <DnaCell.Code value={item.spkCode} />
                    </DnaTd>

                    {/* 4: No. SO Ref */}
                    <DnaTd className="px-3 py-2">
                      <span className="font-mono text-[11.5px] text-slate-600 font-medium">
                        {item.soNumber}
                      </span>
                    </DnaTd>

                    {/* 5: Klien / Brand */}
                    <DnaTd className="px-3 py-2 text-slate-800 text-xs font-medium">
                      {item.customerName} ({item.brandName})
                    </DnaTd>

                    {/* 6: Nama Produk Jadi */}
                    <DnaTd className="px-3 py-2 text-slate-900 text-xs font-semibold">
                      {item.productName}
                    </DnaTd>

                    {/* 7: Kategori Produk */}
                    <DnaTd className="px-3 py-2 text-slate-700 text-xs">
                      {item.category}
                    </DnaTd>

                    {/* 8: Jumlah Pesanan (Pcs) */}
                    <DnaTd className="px-3 py-2 text-right font-mono text-xs font-semibold text-slate-800">
                      {item.orderQty.toLocaleString("id-ID")} {item.unit}
                    </DnaTd>

                    {/* 9: Alokasi Line Mesin */}
                    <DnaTd className="px-3 py-2 text-slate-700 text-xs">
                      {item.machineLine}
                    </DnaTd>

                    {/* 10: PIC Supervisor */}
                    <DnaTd className="px-3 py-2 text-slate-800 text-xs">
                      <DnaCell.Avatar name={item.supervisor} />
                    </DnaTd>

                    {/* 11: Status SPK */}
                    <DnaTd className="px-3 py-2 text-center">
                      <DnaBadge variant={statusInfo.badge as any}>
                        {statusInfo.label}
                      </DnaBadge>
                    </DnaTd>

                    {/* 12: Aksi */}
                    <DnaTd className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetail(item)}
                          className="h-8 w-8 p-0"
                          title="Lihat Detail SPK"
                        >
                          <Eye className="w-4 h-4 text-slate-600" />
                        </DnaButton>
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          onClick={() => onPrint(item)}
                          className="h-8 w-8 p-0"
                          title="Cetak Dokumen SPK"
                        >
                          <Printer className="w-4 h-4 text-slate-600" />
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
