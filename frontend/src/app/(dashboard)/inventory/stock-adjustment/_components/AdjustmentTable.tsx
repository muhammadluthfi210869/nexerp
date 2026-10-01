"use client";

import React from "react";
import { Search, Eye } from "lucide-react";
import {
  DnaDataTableCard,
  DnaButton,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { AdjustmentItem } from "../_types/stock-adjustment.types";

interface AdjustmentTableProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filteredData: AdjustmentItem[];
  onViewDetail: (item: AdjustmentItem) => void;
}

export function AdjustmentTable({
  searchTerm,
  onSearchChange,
  filteredData,
  onViewDetail,
}: AdjustmentTableProps) {
  return (
    <>
      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari no penyesuaian, gudang, pembuat, alasan..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 1:1 Table (Exactly 7 columns matching legacy G-SERP) */}
      <DnaDataTableCard title="Daftar Penyesuaian Stok">
        <div className="overflow-x-auto">
          <DnaTable className="w-full text-xs text-left">
            <DnaTableHead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <DnaTableRow>
                <DnaTh className="py-3 px-4 w-12 text-center">#</DnaTh>
                <DnaTh className="py-3 px-4">Kode Penyesuaian</DnaTh>
                <DnaTh className="py-3 px-4">Tanggal</DnaTh>
                <DnaTh className="py-3 px-4">Gudang</DnaTh>
                <DnaTh className="py-3 px-4">Pembuat</DnaTh>
                <DnaTh className="py-3 px-4">Catatan</DnaTh>
                <DnaTh className="py-3 px-4 text-center">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada catatan penyesuaian stok ditemukan
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredData.map((item, idx) => (
                  <DnaTableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <DnaTd className="py-3 px-4 text-center font-medium text-slate-400">{idx + 1}</DnaTd>
                    <DnaTd className="py-3 px-4 font-semibold text-blue-600">{item.code}</DnaTd>
                    <DnaTd className="py-3 px-4 text-slate-600 tabular-nums">{item.date}</DnaTd>
                    <DnaTd className="py-3 px-4 font-medium text-slate-800">{item.warehouse}</DnaTd>
                    <DnaTd className="py-3 px-4 text-slate-600">{item.creator}</DnaTd>
                    <DnaTd className="py-3 px-4 text-slate-700 max-w-xs truncate">{item.notes}</DnaTd>
                    <DnaTd className="py-3 px-4 text-center">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        icon={<Eye className="h-3.5 w-3.5 text-blue-600" />}
                        onClick={() => onViewDetail(item)}
                      >
                        Lihat
                      </DnaButton>
                    </DnaTd>
                  </DnaTableRow>
                ))
              )}
            </DnaTableBody>
          </DnaTable>
        </div>
      </DnaDataTableCard>
    </>
  );
}
