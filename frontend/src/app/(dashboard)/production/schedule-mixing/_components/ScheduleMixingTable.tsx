"use client";

import React from "react";
import { Eye, Printer } from "lucide-react";
import {
  DnaDataTableCard,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaCell,
} from "@/components/dna";
import { ScheduleMixingItem } from "../_types/schedule-mixing.types";

interface ScheduleMixingTableProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  filteredData: ScheduleMixingItem[];
  onCreateClick: () => void;
  onViewDetail: (item: ScheduleMixingItem) => void;
  onPrint: (item: ScheduleMixingItem) => void;
}

export function ScheduleMixingTable({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  filteredData,
  onCreateClick,
  onViewDetail,
  onPrint,
}: ScheduleMixingTableProps) {
  return (
    <DnaDataTableCard
      toolbarProps={{
        searchQuery: searchTerm,
        onSearchChange: onSearchChange,
        searchPlaceholder: "Cari kode jadwal / batch / produk / pelanggan...",
        filterColumns: [
          {
            key: "status",
            label: "Status Mixing",
            type: "select",
            options: ["SCHEDULED", "IN_PROGRESS", "COMPLETED"],
          },
        ],
        selectedColumn: "status",
        filterValue: statusFilter,
        onFilterValueChange: onStatusFilterChange,
        actionButton: {
          label: "Buat Jadwal Mixing",
          onClick: onCreateClick,
        },
      }}
    >
      <div className="overflow-x-auto">
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
              <DnaTh className="p-3.5 w-10 text-slate-400 tabular-nums text-center">#</DnaTh>
              <DnaTh className="p-3.5 w-36 min-w-[130px] whitespace-nowrap">KODE JADWAL</DnaTh>
              <DnaTh className="p-3.5 w-28 min-w-[110px] whitespace-nowrap">TANGGAL</DnaTh>
              <DnaTh className="p-3.5 w-32 min-w-[120px] whitespace-nowrap">BATCH RECORD</DnaTh>
              <DnaTh className="p-3.5 min-w-[180px] whitespace-nowrap">PELANGGAN</DnaTh>
              <DnaTh className="p-3.5 min-w-[200px]">PRODUK</DnaTh>
              <DnaTh className="p-3.5 w-28 min-w-[100px] text-right whitespace-nowrap">TARGET</DnaTh>
              <DnaTh className="p-3.5 w-32 min-w-[110px] text-right whitespace-nowrap">HASIL UPSCALE</DnaTh>
              <DnaTh className="p-3.5 w-32 min-w-[110px] text-center whitespace-nowrap">STATUS</DnaTh>
              <DnaTh className="p-3.5 text-center w-24 whitespace-nowrap">AKSI</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {filteredData.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={10} className="py-12 text-center text-slate-400">
                  Tidak ada jadwal mixing ditemukan
                </DnaTd>
              </DnaTableRow>
            ) : (
              filteredData.map((item, idx) => (
                <DnaTableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <DnaTd className="p-3.5 text-slate-400 tabular-nums text-[11px] text-center">{idx + 1}</DnaTd>
                  <DnaTd className="p-3.5 whitespace-nowrap">
                    <DnaCell.Code
                      value={item.code}
                      onClick={() => onViewDetail(item)}
                    />
                  </DnaTd>
                  <DnaTd className="p-3.5 whitespace-nowrap">
                    <DnaCell.Date value={item.date} />
                  </DnaTd>
                  <DnaTd className="p-3.5 whitespace-nowrap">
                    <DnaCell.Code value={item.batchRecord} />
                  </DnaTd>
                  <DnaTd className="p-3.5 whitespace-nowrap">
                    <DnaCell.Text primary={item.customer} />
                  </DnaTd>
                  <DnaTd className="p-3.5 min-w-[200px]">
                    <DnaCell.Text primary={item.product} />
                  </DnaTd>
                  <DnaTd className="p-3.5 text-right whitespace-nowrap">
                    <DnaCell.Number value={item.targetPcs} suffix="PCS" />
                  </DnaTd>
                  <DnaTd className="p-3.5 text-right whitespace-nowrap">
                    <DnaCell.Number value={item.upscaleResult} suffix={item.unit} />
                  </DnaTd>
                  <DnaTd className="p-3.5 text-center whitespace-nowrap">
                    <DnaCell.Badge status={item.status} />
                  </DnaTd>
                  <DnaTd className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => onViewDetail(item)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors border-none bg-transparent cursor-pointer"
                        title="Lihat Detail"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onPrint(item)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
                        title="Cetak SPK"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
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
