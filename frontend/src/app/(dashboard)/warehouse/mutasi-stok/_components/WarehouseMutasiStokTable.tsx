"use client";

import React from "react";
import { ArrowRightLeft, Eye } from "lucide-react";
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
import type { MutationItem, MutationType } from "../_types/mutasi-stok.types";

interface WarehouseMutasiStokTableProps {
  filteredMutations: MutationItem[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  selectedColumn: string;
  onSelectColumn: (col: string) => void;
  filterValue: string;
  onFilterValueChange: (val: string) => void;
  dateMode: any;
  onDateModeChange: (mode: any) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  warehouseOptions: string[];
  onResetAll: () => void;
  onSelectMutation: (mutation: MutationItem) => void;
}

export function WarehouseMutasiStokTable({
  filteredMutations,
  searchQuery,
  onSearchChange,
  selectedStatus,
  onSelectStatus,
  selectedColumn,
  onSelectColumn,
  filterValue,
  onFilterValueChange,
  dateMode,
  onDateModeChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  warehouseOptions,
  onResetAll,
  onSelectMutation,
}: WarehouseMutasiStokTableProps) {
  const getMutationTypeBadge = (type: MutationType) => {
    switch (type) {
      case "INBOUND":
        return <DnaBadge variant="success">INBOUND (Masuk)</DnaBadge>;
      case "OUTBOUND":
        return <DnaBadge variant="warning">OUTBOUND (Keluar)</DnaBadge>;
      case "TRANSFER":
        return <DnaBadge variant="info">TRANSFER</DnaBadge>;
      case "ADJUSTMENT":
        return <DnaBadge variant="purple">ADJUSTMENT</DnaBadge>;
      case "OPNAME":
        return <DnaBadge variant="purple">OPNAME</DnaBadge>;
      default:
        return <DnaBadge variant="neutral">{type}</DnaBadge>;
    }
  };

  return (
    <DnaDataTableCard
      toolbarProps={{
        searchQuery,
        onSearchChange,
        searchPlaceholder: "Cari No. Dokumen, SKU, material, gudang...",
        statusOptions: [
          { value: "INBOUND", label: "Masuk (Inbound)", dotColor: "bg-emerald-500" },
          { value: "OUTBOUND", label: "Keluar (SPK/Release)", dotColor: "bg-amber-500" },
          { value: "TRANSFER", label: "Transfer Gudang", dotColor: "bg-blue-500" },
          { value: "ADJUSTMENT", label: "Penyesuaian (Adjustment)", dotColor: "bg-purple-500" },
          { value: "OPNAME", label: "Stok Opname", dotColor: "bg-purple-500" },
        ],
        selectedStatus,
        onSelectStatus,
        statusPlaceholder: "Semua Tipe Mutasi",
        filterColumns: [
          {
            key: "warehouse",
            label: "Lokasi Gudang",
            type: "select",
            options: warehouseOptions,
          },
          {
            key: "itemName",
            label: "Nama Material",
            type: "sort_alpha",
          },
        ],
        selectedColumn,
        onSelectColumn,
        filterValue,
        onFilterValueChange,
        enableDateFilter: true,
        dateMode,
        onDateModeChange,
        startDate,
        onStartDateChange,
        endDate,
        onEndDateChange,
        onResetAll,
      }}
    >
      <div className="overflow-x-auto">
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
              <DnaTh className="px-3 py-3 h-[40px] w-[50px] text-center">#</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] w-[130px]">Tanggal & Waktu</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] w-[130px]">No. Dokumen Ref</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] w-[110px]">Kode SKU</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px]">Nama Material / Produk</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-center w-[130px]">Tipe Mutasi</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px]">Gudang Asal</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px]">Gudang Tujuan</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-right w-[100px]">Qty Masuk</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-right w-[100px]">Qty Keluar</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-right w-[100px]">Saldo Akhir</DnaTh>
              <DnaTh className="px-4 py-3 h-[40px] text-right w-[60px]">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {filteredMutations.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={12} className="py-12 text-center text-slate-400">
                  <ArrowRightLeft className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  Tidak ada catatan mutasi stok yang sesuai filter.
                </DnaTd>
              </DnaTableRow>
            ) : (
              filteredMutations.map((m, index) => (
                <DnaTableRow
                  key={m.id}
                  onClick={() => onSelectMutation(m)}
                  className="hover:bg-slate-50/60 transition-colors cursor-pointer group h-[48px]"
                >
                  {/* # */}
                  <DnaTd className="px-3 py-2 text-center text-slate-400 text-xs tabular-nums">
                    {index + 1}
                  </DnaTd>

                  {/* Tanggal & Waktu */}
                  <DnaTd className="px-3 py-2 text-slate-600 whitespace-nowrap text-xs">
                    {m.datetime}
                  </DnaTd>

                  {/* No. Dokumen Ref */}
                  <DnaTd className="px-3 py-2">
                    <DnaCell.Code value={m.docRef} />
                  </DnaTd>

                  {/* Kode SKU */}
                  <DnaTd className="px-3 py-2">
                    <DnaCell.Code value={m.itemCode} />
                  </DnaTd>

                  {/* Nama Material / Produk */}
                  <DnaTd className="px-3 py-2 text-slate-800 font-medium text-xs truncate max-w-[200px]" title={m.itemName}>
                    {m.itemName}
                  </DnaTd>

                  {/* Tipe Mutasi */}
                  <DnaTd className="px-3 py-2 text-center">
                    {getMutationTypeBadge(m.mutationType)}
                  </DnaTd>

                  {/* Gudang Asal */}
                  <DnaTd className="px-3 py-2 text-slate-700 text-xs truncate max-w-[130px]" title={m.sourceWarehouse}>
                    {m.sourceWarehouse}
                  </DnaTd>

                  {/* Gudang Tujuan */}
                  <DnaTd className="px-3 py-2 text-slate-700 text-xs truncate max-w-[130px]" title={m.destWarehouse}>
                    {m.destWarehouse}
                  </DnaTd>

                  {/* Qty Masuk */}
                  <DnaTd className="px-3 py-2 text-right">
                    {m.qtyIn > 0 ? (
                      <span className="font-semibold text-emerald-700 tabular-nums text-xs">
                        +{m.qtyIn.toLocaleString("id-ID")} {m.unit}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-xs">-</span>
                    )}
                  </DnaTd>

                  {/* Qty Keluar */}
                  <DnaTd className="px-3 py-2 text-right">
                    {m.qtyOut > 0 ? (
                      <span className="font-semibold text-amber-700 tabular-nums text-xs">
                        -{m.qtyOut.toLocaleString("id-ID")} {m.unit}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-xs">-</span>
                    )}
                  </DnaTd>

                  {/* Saldo Akhir */}
                  <DnaTd className="px-3 py-2 text-right">
                    <span className="font-bold text-slate-900 tabular-nums text-xs">
                      {m.balance.toLocaleString("id-ID")} {m.unit}
                    </span>
                  </DnaTd>

                  {/* Aksi */}
                  <DnaTd className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                    <DnaButton
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectMutation(m)}
                      className="text-slate-400 hover:text-blue-600"
                    >
                      <Eye className="w-4 h-4" />
                    </DnaButton>
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
