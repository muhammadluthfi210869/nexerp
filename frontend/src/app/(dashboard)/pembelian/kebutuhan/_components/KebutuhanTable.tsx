"use client";

import React from "react";
import { Eye } from "lucide-react";
import {
  DnaDataTableCard,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaEmptyState,
  DnaButton,
} from "@/components/dna";
import { formatCurrency } from "@/lib/utils";
import type { MrpItemRecord } from "../_types/kebutuhan.types";

interface KebutuhanTableProps {
  filteredList: MrpItemRecord[];
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onSelectItem: (item: MrpItemRecord) => void;
  onGeneratePo: (item: MrpItemRecord) => void;
}

export function KebutuhanTable({
  filteredList,
  searchQuery,
  onSearchChange,
  onSelectItem,
  onGeneratePo,
}: KebutuhanTableProps) {
  return (
    <DnaDataTableCard
      searchValue={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder="Cari kode bahan, nama bahan, SO ref, supplier..."
    >
      <div className="w-full">
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
              <DnaTh className="px-4 py-2.5 w-[50px] text-center">#</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[120px]">KODE BAHAN</DnaTh>
              <DnaTh className="px-4 py-2.5 min-w-[170px]">NAMA MATERIAL</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[130px]">KATEGORI</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[130px]">NO. SO REF</DnaTh>
              <DnaTh className="px-4 py-2.5 min-w-[160px]">KLIEN / BRAND</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[110px] text-right">GROSS NEED</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[110px] text-right">REAL STOK</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[120px] text-right">NET DEFISIT (PO)</DnaTh>
              <DnaTh className="px-4 py-2.5 min-w-[150px]">SUPPLIER UTAMA</DnaTh>
              <DnaTh className="px-4 py-2.5 w-[120px] text-right">EST. BIAYA</DnaTh>
              <DnaTh className="pr-4 py-2.5 w-[90px] text-right">AKSI</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {filteredList.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={12} className="py-8 text-center">
                  <DnaEmptyState
                    title="Belum Ada Analisis MRP"
                    description="Tidak ada data kebutuhan barang pada filter ini."
                  />
                </DnaTd>
              </DnaTableRow>
            ) : (
              filteredList.map((item, idx) => (
                <DnaTableRow
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className="h-[48px] hover:bg-slate-50/80 transition-colors cursor-pointer"
                >
                  <DnaTd className="px-4 py-2.5 text-center text-slate-400 tabular-nums text-xs font-mono">
                    {idx + 1}
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 font-mono font-semibold text-xs text-indigo-600">
                    {item.materialCode}
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 font-medium text-slate-900 text-xs">
                    {item.materialName}
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 text-slate-600 text-xs">
                    {item.category}
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 font-mono font-semibold text-slate-800 text-xs">
                    {item.salesOrderRef}
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 text-slate-700 text-xs">
                    {item.clientName}
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 text-right tabular-nums text-slate-800 text-xs font-medium">
                    {item.grossRequirement.toLocaleString("id-ID")} {item.unit}
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 text-right tabular-nums text-emerald-700 text-xs font-semibold">
                    {item.realStockQty.toLocaleString("id-ID")} {item.unit}
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 text-right tabular-nums text-xs">
                    {item.netNeedQty > 0 ? (
                      <span className="font-bold text-rose-600">
                        {item.netNeedQty.toLocaleString("id-ID")} {item.unit}
                      </span>
                    ) : (
                      <span className="font-medium text-emerald-600">0 {item.unit}</span>
                    )}
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 text-slate-800 text-xs">
                    {item.primarySupplier || "-"}
                  </DnaTd>
                  <DnaTd className="px-4 py-2.5 text-right tabular-nums font-semibold text-xs text-slate-900">
                    {item.netNeedQty > 0 ? formatCurrency(item.estimatedTotalCost) : "—"}
                  </DnaTd>
                  <DnaTd className="pr-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      {item.netNeedQty > 0 && (
                        <DnaButton
                          size="sm"
                          variant="primary"
                          onClick={() => onGeneratePo(item)}
                          className="text-[10px] h-7 px-2 bg-blue-600"
                        >
                          PO
                        </DnaButton>
                      )}
                      <DnaButton
                        size="sm"
                        variant="ghost"
                        icon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => onSelectItem(item)}
                      >
                        Detail
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
  );
}
