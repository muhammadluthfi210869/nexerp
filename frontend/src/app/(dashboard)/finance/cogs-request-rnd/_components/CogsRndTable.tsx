"use client";

import React from "react";
import { Eye } from "lucide-react";
import {
  DnaDataTableCard,
  DnaBadge,
  DnaTable,
  DnaTableHead,
  DnaTh,
  DnaTableBody,
  DnaTableRow,
  DnaTd,
  DnaCell,
} from "@/components/dna";
import type { CogsRequest } from "../_types/cogs-request-rnd.types";

interface CogsRndTableProps {
  items: CogsRequest[];
  searchQuery: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  onSelectCogs: (cogs: CogsRequest) => void;
}

export function CogsRndTable({
  items,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onSelectCogs,
}: CogsRndTableProps) {
  return (
    <DnaDataTableCard
      toolbarProps={{
        searchQuery,
        onSearchChange,
        searchPlaceholder: "Cari kode HPP, pelanggan, produk, formula...",
        extraActions: (
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none"
          >
            <option value="ALL">Semua Status</option>
            <option value="APPROVED">Disetujui Management</option>
            <option value="PENDING">Menunggu Approval</option>
          </select>
        ),
      }}
    >
      <DnaTable>
        <DnaTableHead>
          <tr>
            <DnaTh align="center" className="w-10">#</DnaTh>
            <DnaTh className="w-28">Kode</DnaTh>
            <DnaTh className="w-24">Tanggal</DnaTh>
            <DnaTh>Pelanggan</DnaTh>
            <DnaTh>Produk</DnaTh>
            <DnaTh className="w-40">Formula</DnaTh>
            <DnaTh align="right" className="w-28">Jumlah MOQ</DnaTh>
            <DnaTh align="center" className="w-36">Status</DnaTh>
            <DnaTh align="center" className="w-16">#</DnaTh>
          </tr>
        </DnaTableHead>
        <DnaTableBody>
          {items.length === 0 ? (
            <DnaTableRow>
              <DnaTd colSpan={9} className="py-8 text-center text-slate-400">
                Tidak ada data permintaan HPP ditemukan.
              </DnaTd>
            </DnaTableRow>
          ) : (
            items.map((row, idx) => (
              <DnaTableRow key={row.id}>
                <DnaTd align="center" className="text-slate-400 font-bold">{idx + 1}</DnaTd>
                <DnaTd>
                  <DnaCell.Code value={row.requestCode} />
                </DnaTd>
                <DnaTd className="text-slate-600 tabular-nums">{row.requestDate}</DnaTd>
                <DnaTd className="font-semibold text-slate-900">{row.customerName}</DnaTd>
                <DnaTd className="text-slate-800">{row.productName}</DnaTd>
                <DnaTd className="text-indigo-600 font-bold tabular-nums">{row.formulaCode}</DnaTd>
                <DnaTd align="right" className="font-bold tabular-nums text-slate-900">
                  {row.moqQty.toLocaleString("id-ID")} pcs
                </DnaTd>
                <DnaTd align="center">
                  <DnaBadge variant={row.status === "APPROVED" ? "success" : "warning"}>
                    {row.statusLabel}
                  </DnaBadge>
                </DnaTd>
                <DnaTd align="center">
                  <button
                    onClick={() => onSelectCogs(row)}
                    className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                    title="Lihat Rincian HPP per Unit"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </DnaTd>
              </DnaTableRow>
            ))
          )}
        </DnaTableBody>
      </DnaTable>
    </DnaDataTableCard>
  );
}
