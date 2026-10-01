"use client";

import React from "react";
import { Plus, FileSpreadsheet } from "lucide-react";
import { DnaInput, DnaSelect, DnaButton } from "@/components/dna";
import type { KategoriBarangItem } from "../_types/goods.types";

interface GoodsToolbarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedCategoryFilter: string;
  onSelectCategoryFilter: (val: string) => void;
  categoriesList: KategoriBarangItem[];
  onExportExcel: () => void;
  onOpenCreateBarang: () => void;
}

export function GoodsToolbar({
  searchQuery,
  onSearchChange,
  selectedCategoryFilter,
  onSelectCategoryFilter,
  categoriesList,
  onExportExcel,
  onOpenCreateBarang,
}: GoodsToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex flex-wrap items-center gap-2.5 flex-1">
        {/* Search Bar */}
        <div className="min-w-[200px] flex-1 max-w-sm">
          <DnaInput
            placeholder="Cari kode atau nama barang..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Filter Kategori Barang */}
        <div className="w-[200px]">
          <DnaSelect
            value={selectedCategoryFilter}
            onChange={onSelectCategoryFilter}
            options={[
              { value: "ALL", label: "Semua Kategori" },
              ...categoriesList.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
        </div>
      </div>

      {/* Tombol Aksi Top: Export Excel & Tambah Barang */}
      <div className="flex items-center gap-2">
        <DnaButton
          variant="outline"
          size="md"
          onClick={onExportExcel}
          className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
        >
          <FileSpreadsheet className="w-4 h-4 mr-1.5" />
          Export Excel
        </DnaButton>
        <DnaButton
          variant="primary"
          size="md"
          onClick={onOpenCreateBarang}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Tambah Barang
        </DnaButton>
      </div>
    </div>
  );
}
