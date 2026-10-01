"use client";

import React from "react";
import { Eye, Tag } from "lucide-react";
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
} from "@/components/dna";
import type { GoodsCategory } from "../_types/gudang.types";

interface GudangCategoryTableProps {
  categories: GoodsCategory[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onViewDetail: (category: GoodsCategory) => void;
}

export function GudangCategoryTable({
  categories,
  searchQuery,
  onSearchChange,
  onViewDetail,
}: GudangCategoryTableProps) {
  const filtered = categories.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.inventoryAccount.toLowerCase().includes(q) ||
      c.cogsAccount.toLowerCase().includes(q)
    );
  });

  return (
    <DnaDataTableCard
      toolbarProps={{
        searchQuery,
        onSearchChange,
        searchPlaceholder: "Cari Kategori, Kode, Akun...",
      }}
    >
      <div className="overflow-x-auto">
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
              <DnaTh className="px-3 py-3 h-[40px] w-[50px] text-center">#</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] w-[110px]">Kode Kategori</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px]">Nama Kategori</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px]">Deskripsi</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px]">Akun Persediaan (Inventory)</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px]">Akun HPP (COGS)</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px]">Akun Pendapatan Penjualan</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px]">Akun Retur Penjualan</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px]">Akun Unbilled Goods</DnaTh>
              <DnaTh className="px-4 py-3 h-[40px] text-right w-[60px]">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {filtered.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={10} className="py-12 text-center text-slate-400">
                  <Tag className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  Tidak ada kategori barang yang sesuai filter.
                </DnaTd>
              </DnaTableRow>
            ) : (
              filtered.map((row, index) => (
                <DnaTableRow
                  key={row.id}
                  onClick={() => onViewDetail(row)}
                  className="hover:bg-slate-50/60 transition-colors cursor-pointer group h-[48px]"
                >
                  {/* # */}
                  <DnaTd className="px-3 py-2 text-center text-slate-400 text-xs tabular-nums">
                    {index + 1}
                  </DnaTd>

                  {/* Kode Kategori */}
                  <DnaTd className="px-3 py-2">
                    <DnaCell.Code value={row.code} />
                  </DnaTd>

                  {/* Nama Kategori */}
                  <DnaTd className="px-3 py-2 text-slate-900 font-semibold text-xs truncate max-w-[150px]" title={row.name}>
                    {row.name}
                  </DnaTd>

                  {/* Deskripsi */}
                  <DnaTd className="px-3 py-2 text-slate-600 text-xs truncate max-w-[180px]" title={row.description}>
                    {row.description}
                  </DnaTd>

                  {/* Akun Persediaan */}
                  <DnaTd className="px-3 py-2 text-xs">
                    <span className="tabular-nums font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 whitespace-nowrap">
                      {row.inventoryAccount}
                    </span>
                  </DnaTd>

                  {/* Akun HPP */}
                  <DnaTd className="px-3 py-2 text-xs text-slate-700 font-medium whitespace-nowrap">
                    {row.cogsAccount}
                  </DnaTd>

                  {/* Akun Penjualan */}
                  <DnaTd className="px-3 py-2 text-xs text-slate-700 font-medium whitespace-nowrap">
                    {row.salesAccount}
                  </DnaTd>

                  {/* Akun Retur Penjualan */}
                  <DnaTd className="px-3 py-2 text-xs text-slate-600 whitespace-nowrap">
                    {row.salesReturnAccount}
                  </DnaTd>

                  {/* Akun Unbilled Goods */}
                  <DnaTd className="px-3 py-2 text-xs text-slate-600 whitespace-nowrap">
                    {row.unbilledGoodsAccount}
                  </DnaTd>

                  {/* Aksi */}
                  <DnaTd className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                    <DnaButton
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetail(row)}
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
