"use client";

import React from "react";
import { FileSpreadsheet, Plus } from "lucide-react";
import { DnaInput, DnaSelect, DnaButton } from "@/components/dna";
import type { CustomerCategoryItem } from "../_types/customer.types";

interface CustomerFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedStaffFilter: string;
  onStaffFilterChange: (value: string) => void;
  selectedCategoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  salesStaffList?: any[];
  categoriesList: CustomerCategoryItem[];
  onExportExcel: () => void;
  onOpenCreateCustomer: () => void;
}

export function CustomerFilterBar({
  searchQuery,
  onSearchChange,
  selectedStaffFilter,
  onStaffFilterChange,
  selectedCategoryFilter,
  onCategoryFilterChange,
  salesStaffList,
  categoriesList,
  onExportExcel,
  onOpenCreateCustomer,
}: CustomerFilterBarProps) {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex flex-wrap items-center gap-2.5 flex-1">
        {/* Search Bar */}
        <div className="min-w-[200px] flex-1 max-w-sm">
          <DnaInput
            placeholder="Cari kode, nama, brand, kota, telepon..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Filter Sales PIC */}
        <div className="w-[180px]">
          <DnaSelect
            value={selectedStaffFilter}
            onChange={onStaffFilterChange}
            options={[
              { value: "ALL", label: "Semua Sales PIC" },
              ...(salesStaffList?.map((s: any) => ({ value: s.id, label: s.name })) || []),
            ]}
          />
        </div>

        {/* Filter Kategori */}
        <div className="w-[180px]">
          <DnaSelect
            value={selectedCategoryFilter}
            onChange={onCategoryFilterChange}
            options={[
              { value: "ALL", label: "Semua Kategori" },
              ...(categoriesList.map((c) => ({ value: c.id, label: c.name || c.kategori || "Kategori" })) || []),
            ]}
          />
        </div>
      </div>

      {/* Action Buttons: Export Excel & Tambah Pelanggan */}
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
          onClick={onOpenCreateCustomer}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Tambah Pelanggan
        </DnaButton>
      </div>
    </div>
  );
}
