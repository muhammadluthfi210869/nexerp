"use client";

import React from "react";
import { Tag, Clock, Layers, Edit2, Trash2 } from "lucide-react";
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
import type { SalesCategoryItem } from "../_types/sales-target.types";
import type { useSalesTargetOperations } from "../_hooks/useSalesTargetOperations";

interface CategoryTableProps {
  ops?: ReturnType<typeof useSalesTargetOperations>;
  categories?: SalesCategoryItem[];
  totalItems?: number;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  isLoading?: boolean;
  onViewDetail?: (cat: SalesCategoryItem) => void;
  onEdit?: (cat: SalesCategoryItem) => void;
  onDelete?: (cat: SalesCategoryItem) => void;
}

export function CategoryTable(props: CategoryTableProps) {
  const categories = props.categories ?? props.ops?.filteredCategories ?? [];
  const totalItems = props.totalItems ?? props.ops?.categories.length ?? 0;
  const searchTerm = props.searchTerm ?? props.ops?.searchTerm ?? "";
  const onSearchChange = props.onSearchChange ?? props.ops?.setSearchTerm ?? (() => {});
  const isLoading = props.isLoading ?? props.ops?.isLoadingCategories ?? false;
  const onViewDetail = props.onViewDetail ?? props.ops?.setDetailCategory ?? (() => {});
  const onEdit = props.onEdit ?? props.ops?.handleOpenEditCategory ?? (() => {});
  const onDelete = props.onDelete ?? props.ops?.setCategoryToDelete ?? (() => {});

  return (
    <div className="space-y-6">
      <DnaDataTableCard
        count={categories.length}
        totalItems={totalItems}
        toolbarProps={{
          searchPlaceholder: "Cari nama kategori atau deskripsi...",
          searchQuery: searchTerm,
          onSearchChange: onSearchChange,
        }}
      >
        <div className="w-full overflow-x-auto">
          <DnaTable className="w-full text-left border-collapse text-xs">
            <DnaTableHead>
              <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold">
                <DnaTh className="py-3 px-3.5 w-10 text-slate-400">#</DnaTh>
                <DnaTh className="py-3 px-3.5 min-w-[220px]">KATEGORI PENJUALAN</DnaTh>
                <DnaTh className="py-3 px-3.5 min-w-[340px]">DESKRIPSI PROSES BISNIS</DnaTh>
                <DnaTh className="py-3 px-3.5 min-w-[140px]">PIPELINE TIMELINE</DnaTh>
                <DnaTh className="py-3 px-3.5 text-right w-28">AKSI</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {isLoading ? (
                <DnaTableRow>
                  <DnaTd colSpan={5} className="text-center py-12 text-slate-400 font-medium">
                    Memuat data kategori penjualan...
                  </DnaTd>
                </DnaTableRow>
              ) : categories.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={5} className="text-center py-12 text-slate-400">
                    <Tag className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="font-semibold text-slate-600">Belum ada kategori penjualan</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Klik &quot;Inisialisasi 5 Standar G-SERP&quot; atau &quot;Tambah Kategori Penjualan&quot;.
                    </p>
                  </DnaTd>
                </DnaTableRow>
              ) : (
                categories.map((c, idx) => (
                  <DnaTableRow key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <DnaTd className="py-3 px-3.5 text-slate-400 tabular-nums text-[11px]">
                      {idx + 1}
                    </DnaTd>
                    <DnaTd className="py-3 px-3.5">
                      <span className="font-bold text-slate-900 text-sm">{c.name}</span>
                    </DnaTd>
                    <DnaTd className="py-3 px-3.5 text-slate-600 text-xs">
                      {c.description || <span className="text-slate-300">-</span>}
                    </DnaTd>
                    <DnaTd className="py-3 px-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        <Clock className="w-3 h-3" />
                        7 Tahapan Standar
                      </span>
                    </DnaTd>
                    <DnaTd className="py-3 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetail(c)}
                          title="Lihat Timeline Pipeline"
                        >
                          <Layers className="w-3.5 h-3.5 text-indigo-600" />
                        </DnaButton>
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(c)}
                          title="Sunting Kategori"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                        </DnaButton>
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(c)}
                          title="Hapus Kategori"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
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
    </div>
  );
}
