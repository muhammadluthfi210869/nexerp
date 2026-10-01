"use client";

import React from "react";
import { Edit2, Trash2 } from "lucide-react";
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
import type { CustomerCategoryItem } from "../_types/customer.types";

interface CustomerCategoryTableProps {
  categoriesList: CustomerCategoryItem[];
  isLoading: boolean;
  onOpenCreateCategory: () => void;
  onOpenEditCategory: (cat: CustomerCategoryItem) => void;
  onDeleteCategory: (cat: CustomerCategoryItem) => void;
}

export function CustomerCategoryTable({
  categoriesList,
  isLoading,
  onOpenCreateCategory,
  onOpenEditCategory,
  onDeleteCategory,
}: CustomerCategoryTableProps) {
  return (
    <div className="space-y-6">
      <DnaDataTableCard
        toolbarProps={{
          searchPlaceholder: "Cari klasifikasi kategori pelanggan...",
          actionButton: {
            label: "Tambah Kategori",
            onClick: onOpenCreateCategory,
          },
        }}
      >
        <DnaTable className="w-full text-xs text-left table-fixed">
          <DnaTableHead>
            <DnaTableRow className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <DnaTh className="p-3 w-[15%]">Kode</DnaTh>
              <DnaTh className="p-3 w-[30%]">Kategori Pelanggan</DnaTh>
              <DnaTh className="p-3 w-[40%]">Deskripsi</DnaTh>
              <DnaTh className="p-3 w-[15%] text-right pr-4">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {isLoading ? (
              <DnaTableRow>
                <DnaTd colSpan={4} className="p-6 text-center text-slate-400">
                  Memuat kategori pelanggan...
                </DnaTd>
              </DnaTableRow>
            ) : categoriesList.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={4} className="p-6 text-center text-slate-400">
                  Belum ada data kategori pelanggan di database.
                </DnaTd>
              </DnaTableRow>
            ) : (
              categoriesList.map((cat) => (
                <DnaTableRow key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                  <DnaTd className="p-3 font-mono font-bold text-slate-700">{cat.code}</DnaTd>
                  <DnaTd className="p-3 font-bold text-slate-900">{cat.name}</DnaTd>
                  <DnaTd className="p-3 text-slate-600 truncate">{cat.description || "-"}</DnaTd>
                  <DnaTd className="p-3 text-right pr-4">
                    <div className="flex items-center justify-end gap-1">
                      <DnaButton
                        variant="ghost"
                        className="h-7 w-7 p-0 rounded hover:bg-slate-100 text-slate-400 hover:text-amber-600"
                        onClick={() => onOpenEditCategory(cat)}
                        title="Sunting Kategori"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </DnaButton>
                      <DnaButton
                        variant="ghost"
                        className="h-7 w-7 p-0 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                        onClick={() => onDeleteCategory(cat)}
                        title="Hapus Kategori"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </DnaButton>
                    </div>
                  </DnaTd>
                </DnaTableRow>
              ))
            )}
          </DnaTableBody>
        </DnaTable>
      </DnaDataTableCard>
    </div>
  );
}
