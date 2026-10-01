"use client";

import React from "react";
import { FlaskConical, Eye } from "lucide-react";
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
import { MixingProductionItem } from "../_types/mixing.types";
import { MixingStatusBadge } from "./MixingStatusBadge";

interface MixingTableProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  isLoading: boolean;
  filteredData: MixingProductionItem[];
  onViewDetail: (item: MixingProductionItem) => void;
}

export function MixingTable({
  searchTerm,
  onSearchChange,
  isLoading,
  filteredData,
  onViewDetail,
}: MixingTableProps) {
  return (
    <DnaDataTableCard
      searchValue={searchTerm}
      onSearchChange={onSearchChange}
      searchPlaceholder="Cari jadwal, batch record, produk, pelanggan..."
    >
      <div className="w-full">
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow>
              <DnaTh className="py-3 px-4 w-[16%]">Kode & Tanggal</DnaTh>
              <DnaTh className="py-3 px-4 w-[24%]">Batch & Formula</DnaTh>
              <DnaTh className="py-3 px-4 w-[26%]">Produk & Pelanggan</DnaTh>
              <DnaTh className="py-3 px-4 w-[18%]">Target & Hasil Upscale</DnaTh>
              <DnaTh className="py-3 px-4 w-[10%]">Status</DnaTh>
              <DnaTh className="py-3 px-4 w-[6%] text-right">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {isLoading ? (
              <DnaTableRow>
                <DnaTd colSpan={6} className="py-12 text-center text-slate-400">
                  Memuat antrian produksi mixing...
                </DnaTd>
              </DnaTableRow>
            ) : filteredData.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={6} className="py-12 text-center text-slate-400">
                  <FlaskConical className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  Tidak ada jadwal produksi mixing yang sesuai filter.
                </DnaTd>
              </DnaTableRow>
            ) : (
              filteredData.map((item) => (
                <DnaTableRow key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <DnaTd className="py-3 px-4 truncate">
                    <p className="tabular-nums text-xs font-bold text-slate-900 truncate">{item.scheduleCode}</p>
                    <p className="text-[11px] text-slate-500 tabular-nums mt-0.5 truncate">{item.date}</p>
                  </DnaTd>
                  <DnaTd className="py-3 px-4 truncate">
                    <p className="tabular-nums text-xs font-semibold text-blue-700 truncate">{item.batchRecord}</p>
                    <p className="text-[11px] text-slate-500 truncate">{item.formulaName}</p>
                  </DnaTd>
                  <DnaTd className="py-3 px-4 truncate">
                    <p className="font-semibold text-slate-900 text-xs truncate">{item.product}</p>
                    <p className="text-[11px] text-slate-500 truncate">{item.customer}</p>
                  </DnaTd>
                  <DnaTd className="py-3 px-4 truncate">
                    <p className="tabular-nums font-bold text-slate-900 text-xs truncate">
                      {item.targetPcs.toLocaleString()} Pcs (@{item.nettoGram}g)
                    </p>
                    <p className="text-[11px] text-indigo-700 tabular-nums truncate">
                      Upscale: {item.upscaleResultKg.toFixed(1)} Kg (+{item.upscalePct}%)
                    </p>
                  </DnaTd>
                  <DnaTd className="py-3 px-4">
                    <MixingStatusBadge status={item.status} />
                  </DnaTd>
                  <DnaTd className="py-3 px-4 text-right">
                    <DnaButton
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetail(item)}
                      title="Lihat Detail Mixing"
                    >
                      <Eye className="w-4 h-4 text-slate-600" />
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
