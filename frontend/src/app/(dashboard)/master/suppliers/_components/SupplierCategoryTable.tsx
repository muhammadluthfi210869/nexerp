"use client";

import React from "react";
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
import type { KategoriSupplierItem } from "../_types/supplier.types";

interface SupplierCategoryTableProps {
  categoriesList: KategoriSupplierItem[];
  onOpenCreateCategory: () => void;
  onEditCategory: (cat: KategoriSupplierItem) => void;
}

export function SupplierCategoryTable({
  categoriesList,
  onOpenCreateCategory,
  onEditCategory,
}: SupplierCategoryTableProps) {
  return (
    <div className="space-y-6">
      <DnaDataTableCard
        toolbarProps={{
          searchPlaceholder: "Kategori supplier pengadaan material...",
          actionButton: {
            label: "Tambah Kategori",
            onClick: onOpenCreateCategory,
          },
        }}
      >
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider select-none">
              <DnaTh className="p-3.5 w-12 text-slate-400">#</DnaTh>
              <DnaTh className="p-3.5 min-w-[120px]">KODE PREFIX</DnaTh>
              <DnaTh className="p-3.5 min-w-[200px]">NAMA KATEGORI</DnaTh>
              <DnaTh className="p-3.5 min-w-[300px]">DESKRIPSI & RUANG LINGKUP</DnaTh>
              <DnaTh className="p-3.5 text-center min-w-[140px]">JUMLAH REKANAN</DnaTh>
              <DnaTh className="p-3.5 text-center w-24">AKSI</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {categoriesList.map((cat, idx) => (
              <DnaTableRow key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                <DnaTd className="p-3.5 text-slate-400 tabular-nums">{idx + 1}</DnaTd>
                <DnaTd className="p-3.5">
                  <DnaCell.Code value={cat.kode} />
                </DnaTd>
                <DnaTd className="p-3.5 font-bold text-slate-900 uppercase">
                  {cat.kategori}
                </DnaTd>
                <DnaTd className="p-3.5 text-slate-600">{cat.deskripsi}</DnaTd>
                <DnaTd className="p-3.5 text-center">
                  <DnaCell.Badge label={`${cat.totalSupplier} Vendor`} status="info" />
                </DnaTd>
                <DnaTd className="p-3.5 text-center">
                  <DnaCell.Actions
                    onEdit={() => onEditCategory(cat)}
                  />
                </DnaTd>
              </DnaTableRow>
            ))}
          </DnaTableBody>
        </DnaTable>
      </DnaDataTableCard>
    </div>
  );
}
