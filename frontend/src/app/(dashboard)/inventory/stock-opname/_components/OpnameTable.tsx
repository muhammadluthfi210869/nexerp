"use client";

import React from "react";
import { Search, Eye, Printer } from "lucide-react";
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
import { OpnameRecord } from "../_types/stock-opname.types";

interface OpnameTableProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filteredData: OpnameRecord[];
  onViewDetail: (item: OpnameRecord) => void;
  onPrint: (item: OpnameRecord) => void;
}

export function OpnameTable({
  searchTerm,
  onSearchChange,
  filteredData,
  onViewDetail,
  onPrint,
}: OpnameTableProps) {
  return (
    <>
      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kode opname, gudang, petugas, catatan..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 1:1 Table (Exactly 7 columns matching legacy G-SERP) */}
      <DnaDataTableCard title="Daftar Riwayat Stok Opname">
        <div className="overflow-x-auto">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow>
                <DnaTh className="w-12 text-center">#</DnaTh>
                <DnaTh>Kode</DnaTh>
                <DnaTh>Tanggal</DnaTh>
                <DnaTh>Gudang</DnaTh>
                <DnaTh>Pembuat</DnaTh>
                <DnaTh>Catatan</DnaTh>
                <DnaTh className="text-center">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {filteredData.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada transaksi stok opname ditemukan
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredData.map((item, idx) => (
                  <DnaTableRow key={item.id}>
                    <DnaTd className="text-center font-medium text-slate-400 tabular-nums">{idx + 1}</DnaTd>
                    <DnaTd className="font-semibold text-blue-600">{item.code}</DnaTd>
                    <DnaTd className="text-slate-600 tabular-nums">{item.date}</DnaTd>
                    <DnaTd className="font-medium text-slate-800">{item.warehouse}</DnaTd>
                    <DnaTd className="text-slate-600">{item.creator}</DnaTd>
                    <DnaTd className="text-slate-700 max-w-xs truncate">{item.notes}</DnaTd>
                    <DnaTd className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          icon={<Eye className="h-3.5 w-3.5 text-blue-600" />}
                          onClick={() => onViewDetail(item)}
                        >
                          Lihat
                        </DnaButton>
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          icon={<Printer className="h-3.5 w-3.5 text-slate-600" />}
                          onClick={() => onPrint(item)}
                        >
                          Print
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
    </>
  );
}
