"use client";

import React from "react";
import { Search } from "lucide-react";
import { DnaInput } from "@/components/dna";

interface PurchaseApprovalFilterCardProps {
  searchKode: string;
  setSearchKode: (val: string) => void;
  searchSupplier: string;
  setSearchSupplier: (val: string) => void;
  searchGudang: string;
  setSearchGudang: (val: string) => void;
  searchItemName: string;
  setSearchItemName: (val: string) => void;
  searchMinQty: string;
  setSearchMinQty: (val: string) => void;
  searchMaxQty: string;
  setSearchMaxQty: (val: string) => void;
  searchMinPrice: string;
  setSearchMinPrice: (val: string) => void;
  searchMaxPrice: string;
  setSearchMaxPrice: (val: string) => void;
  searchDateFrom: string;
  setSearchDateFrom: (val: string) => void;
  searchDateTo: string;
  setSearchDateTo: (val: string) => void;
  isFilterActive: boolean;
  onResetFilters: () => void;
}

export function PurchaseApprovalFilterCard({
  searchKode,
  setSearchKode,
  searchSupplier,
  setSearchSupplier,
  searchGudang,
  setSearchGudang,
  searchItemName,
  setSearchItemName,
  searchMinQty,
  setSearchMinQty,
  searchMaxQty,
  setSearchMaxQty,
  searchMinPrice,
  setSearchMinPrice,
  searchMaxPrice,
  setSearchMaxPrice,
  searchDateFrom,
  setSearchDateFrom,
  searchDateTo,
  setSearchDateTo,
  isFilterActive,
  onResetFilters,
}: PurchaseApprovalFilterCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">
            Pencarian Detail Pembelian
          </span>
        </div>
        {isFilterActive && (
          <button
            onClick={onResetFilters}
            className="text-xs text-blue-600 hover:text-blue-800 font-bold"
          >
            Reset Filter
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <DnaInput
          placeholder="Kode PO..."
          value={searchKode}
          onChange={(e) => setSearchKode(e.target.value)}
          className="text-xs"
        />
        <DnaInput
          placeholder="Supplier..."
          value={searchSupplier}
          onChange={(e) => setSearchSupplier(e.target.value)}
          className="text-xs"
        />
        <DnaInput
          placeholder="Gudang..."
          value={searchGudang}
          onChange={(e) => setSearchGudang(e.target.value)}
          className="text-xs"
        />
        <DnaInput
          placeholder="Nama Item..."
          value={searchItemName}
          onChange={(e) => setSearchItemName(e.target.value)}
          className="text-xs"
        />
        <div className="flex gap-1">
          <DnaInput
            type="number"
            placeholder="Qty min"
            value={searchMinQty}
            onChange={(e) => setSearchMinQty(e.target.value)}
            className="text-xs w-20"
          />
          <DnaInput
            type="number"
            placeholder="Qty max"
            value={searchMaxQty}
            onChange={(e) => setSearchMaxQty(e.target.value)}
            className="text-xs w-20"
          />
        </div>
        <div className="flex gap-1">
          <DnaInput
            type="number"
            placeholder="Harga min"
            value={searchMinPrice}
            onChange={(e) => setSearchMinPrice(e.target.value)}
            className="text-xs w-24"
          />
          <DnaInput
            type="number"
            placeholder="Harga max"
            value={searchMaxPrice}
            onChange={(e) => setSearchMaxPrice(e.target.value)}
            className="text-xs w-24"
          />
        </div>
        <div className="flex gap-1">
          <DnaInput
            type="date"
            placeholder="Tgl dari"
            value={searchDateFrom}
            onChange={(e) => setSearchDateFrom(e.target.value)}
            className="text-xs"
          />
          <DnaInput
            type="date"
            placeholder="Tgl sampai"
            value={searchDateTo}
            onChange={(e) => setSearchDateTo(e.target.value)}
            className="text-xs"
          />
        </div>
      </div>
    </div>
  );
}
