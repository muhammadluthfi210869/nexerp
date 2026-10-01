"use client";

import React from "react";
import { Boxes, ThermometerSnowflake } from "lucide-react";
import {
  DnaDataTableCard,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaCell,
  DnaBadge,
  DnaSelect,
} from "@/components/dna";
import type { BinLocation } from "../_types/gudang.types";

interface GudangBinTableProps {
  bins: BinLocation[];
  selectedWarehouseFilter: string;
  onWarehouseFilterChange: (value: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function GudangBinTable({
  bins,
  selectedWarehouseFilter,
  onWarehouseFilterChange,
  searchQuery,
  onSearchChange,
}: GudangBinTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <span className="text-xs font-semibold text-slate-600">Filter Gudang:</span>
        <DnaSelect
          aria-label="Filter Gudang"
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-800 focus:outline-none"
          value={selectedWarehouseFilter}
          onChange={onWarehouseFilterChange}
        >
          <option value="ALL">Semua Gudang</option>
          <option value="WH-01">WH-01 (Bahan Baku)</option>
          <option value="WH-02">WH-02 (Bahan Kemas)</option>
          <option value="WH-03">WH-03 (Produk Jadi)</option>
        </DnaSelect>
      </div>

      <DnaDataTableCard
        toolbarProps={{
          searchQuery,
          onSearchChange,
          searchPlaceholder: "Cari Kode Bin, SKU Tersimpan...",
        }}
      >
        <div className="overflow-x-auto">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                <DnaTh className="px-3 py-3 h-[40px] w-[50px] text-center">#</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] w-[110px]">Kode Bin</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px]">Nama Gudang</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] w-[120px]">Lorong / Aisle</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] w-[120px]">Tingkat Rak</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] text-center w-[120px]">Zona Suhu</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px]">SKU Tersimpan</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] text-right w-[110px]">Kapasitas Max</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] text-right w-[120px]">Muatan Saat Ini</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] text-right w-[110px]">Okupansi (%)</DnaTh>
                <DnaTh className="px-3 py-3 h-[40px] text-center w-[110px]">Status</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {bins.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={11} className="py-12 text-center text-slate-400">
                    <Boxes className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada lokasi rak & bin yang sesuai filter.
                  </DnaTd>
                </DnaTableRow>
              ) : (
                bins.map((row, index) => (
                  <DnaTableRow key={row.id} className="hover:bg-slate-50/60 transition-colors h-[48px]">
                    {/* # */}
                    <DnaTd className="px-3 py-2 text-center text-slate-400 text-xs tabular-nums">
                      {index + 1}
                    </DnaTd>

                    {/* Kode Bin */}
                    <DnaTd className="px-3 py-2">
                      <DnaCell.Code value={row.binCode} />
                    </DnaTd>

                    {/* Nama Gudang */}
                    <DnaTd className="px-3 py-2 text-slate-800 text-xs font-medium truncate max-w-[150px]" title={row.warehouseName}>
                      {row.warehouseName}
                    </DnaTd>

                    {/* Lorong / Aisle */}
                    <DnaTd className="px-3 py-2 text-slate-700 text-xs">
                      {row.aisle}
                    </DnaTd>

                    {/* Tingkat Rak */}
                    <DnaTd className="px-3 py-2 text-slate-600 text-xs">
                      {row.rackLevel}
                    </DnaTd>

                    {/* Zona Suhu */}
                    <DnaTd className="px-3 py-2 text-center">
                      {row.zoneType === "COOL_ROOM" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          <ThermometerSnowflake className="w-3 h-3" /> Cool Room
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          Ambient
                        </span>
                      )}
                    </DnaTd>

                    {/* SKU Tersimpan */}
                    <DnaTd className="px-3 py-2 text-slate-800 text-xs font-medium truncate max-w-[180px]" title={row.activeSku}>
                      {row.activeSku}
                    </DnaTd>

                    {/* Kapasitas Max */}
                    <DnaTd className="px-3 py-2 text-right text-xs tabular-nums text-slate-600">
                      {row.capacityMax.toLocaleString("id-ID")}
                    </DnaTd>

                    {/* Muatan Saat Ini */}
                    <DnaTd className="px-3 py-2 text-right text-xs tabular-nums font-semibold text-slate-900">
                      {row.currentWeightOrQty.toLocaleString("id-ID")}
                    </DnaTd>

                    {/* Okupansi (%) */}
                    <DnaTd className="px-3 py-2 text-right">
                      <span
                        className={`tabular-nums font-bold text-xs ${
                          row.occupancyPercent > 80
                            ? "text-amber-600"
                            : row.occupancyPercent > 0
                            ? "text-emerald-700"
                            : "text-slate-400"
                        }`}
                      >
                        {row.occupancyPercent}%
                      </span>
                    </DnaTd>

                    {/* Status */}
                    <DnaTd className="px-3 py-2 text-center">
                      <DnaBadge variant={row.status === "AVAILABLE" ? "success" : "purple"}>
                        {row.status === "AVAILABLE" ? "TERSEDIA" : "TERISI"}
                      </DnaBadge>
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
