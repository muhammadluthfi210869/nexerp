import React from "react";
import { ArrowRightLeft, Eye, Printer } from "lucide-react";
import {
  DnaDataTableCard,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaButton,
} from "@/components/dna";
import type { WarehouseTransfer } from "../_types/pindah-gudang.types";
import { TransferStatusBadge } from "./TransferBadges";

interface TransferTableProps {
  filteredList: WarehouseTransfer[];
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedStatus: string;
  onSelectStatus: (val: string) => void;
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
  onSelectTransfer: (row: WarehouseTransfer) => void;
  onPrint?: (row: WarehouseTransfer) => void;
}

export function TransferTable({
  filteredList,
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
  onSelectTransfer,
  onPrint,
}: TransferTableProps) {
  return (
    <DnaDataTableCard
      toolbarProps={{
        searchQuery,
        onSearchChange,
        searchPlaceholder: "Cari No. Transfer, Dokumen Ref, Gudang, PIC...",
        statusOptions: [
          { value: "IN_TRANSIT", label: "Dalam Perjalanan", dotColor: "bg-amber-500" },
          { value: "RECEIVED", label: "Diterima (Menunggu Cek)", dotColor: "bg-blue-500" },
          { value: "VERIFIED", label: "Terverifikasi (Verified)", dotColor: "bg-emerald-500" },
          { value: "DRAFT", label: "Draft Pengajuan", dotColor: "bg-zinc-400" },
        ],
        selectedStatus,
        onSelectStatus,
        statusPlaceholder: "Semua Status Transfer",
        filterColumns: [
          {
            key: "fromWarehouse",
            label: "Gudang Asal",
            type: "select",
            options: warehouseOptions,
          },
          {
            key: "toWarehouse",
            label: "Gudang Tujuan",
            type: "select",
            options: warehouseOptions,
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
              <DnaTh className="px-3 py-3 h-[40px] w-[45px] text-center">#</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] w-[130px]">No. Transfer</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] w-[110px]">Tanggal Transfer</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] min-w-[160px]">Gudang Asal</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] min-w-[160px]">Gudang Tujuan</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] w-[130px]">No. Dokumen Ref</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] min-w-[130px]">PIC Pengirim</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-right w-[120px]">Total Qty Unit</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-center w-[100px]">Macam Item</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-center w-[140px]">Status Serah Terima</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-right w-[65px]">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {filteredList.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={11} className="py-12 text-center text-slate-400">
                  <ArrowRightLeft className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  Tidak ada data transfer antar gudang yang sesuai filter.
                </DnaTd>
              </DnaTableRow>
            ) : (
              filteredList.map((row, idx) => (
                <DnaTableRow
                  key={row.id}
                  onClick={() => onSelectTransfer(row)}
                  className="hover:bg-slate-50/60 transition-colors cursor-pointer group h-[48px]"
                >
                  {/* 1: # Index */}
                  <DnaTd className="px-3 py-2 text-center text-slate-400 font-mono text-[11px]">
                    {idx + 1}
                  </DnaTd>

                  {/* 2: No. Transfer */}
                  <DnaTd className="px-3 py-2 font-mono font-bold text-xs text-blue-700">
                    {row.transferNumber}
                  </DnaTd>

                  {/* 3: Tanggal Transfer */}
                  <DnaTd className="px-3 py-2 text-slate-600 whitespace-nowrap text-xs">
                    {row.transferDate}
                  </DnaTd>

                  {/* 4: Gudang Asal */}
                  <DnaTd className="px-3 py-2 text-slate-800 font-medium truncate max-w-[170px]">
                    {row.fromWarehouse.split("(")[0]}
                  </DnaTd>

                  {/* 5: Gudang Tujuan */}
                  <DnaTd className="px-3 py-2 text-slate-800 font-medium truncate max-w-[170px]">
                    {row.toWarehouse.split("(")[0]}
                  </DnaTd>

                  {/* 6: No. Dokumen Ref */}
                  <DnaTd className="px-3 py-2 font-mono text-xs text-slate-700">
                    {row.referenceDoc}
                  </DnaTd>

                  {/* 7: PIC Pengirim */}
                  <DnaTd className="px-3 py-2 text-slate-700 truncate max-w-[140px]">
                    {row.senderPic}
                  </DnaTd>

                  {/* 8: Total Qty Unit */}
                  <DnaTd className="px-3 py-2 text-right font-bold text-slate-900 tabular-nums">
                    {row.totalQty.toLocaleString("id-ID")}
                  </DnaTd>

                  {/* 9: Macam Item */}
                  <DnaTd className="px-3 py-2 text-center text-slate-600 text-xs">
                    {row.totalItems} SKU
                  </DnaTd>

                  {/* 10: Status Serah Terima */}
                  <DnaTd className="px-3 py-2 text-center">
                    <TransferStatusBadge status={row.status} />
                  </DnaTd>

                  {/* 11: Aksi */}
                  <DnaTd
                    className="px-3 py-2 text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {onPrint && (
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          onClick={() => onPrint(row)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"
                          title="Cetak Surat Pindah Gudang (A4)"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </DnaButton>
                      )}
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectTransfer(row)}
                        className="text-slate-400 hover:text-slate-700 h-7 w-7 p-0"
                        title="Lihat Detail Mutasi Antar Gudang"
                      >
                        <Eye className="w-4 h-4" />
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
