"use client";

import React from "react";
import { Eye, ThermometerSnowflake, Building2 } from "lucide-react";
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
  DnaButton,
} from "@/components/dna";
import type { WarehouseNode } from "../_types/gudang.types";

interface GudangWarehouseTableProps {
  warehouses: WarehouseNode[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onViewDetail: (warehouse: WarehouseNode) => void;
}

export function GudangWarehouseTable({
  warehouses,
  searchQuery,
  onSearchChange,
  onViewDetail,
}: GudangWarehouseTableProps) {
  const filtered = warehouses.filter((w) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      w.code.toLowerCase().includes(q) ||
      w.name.toLowerCase().includes(q) ||
      w.city.toLowerCase().includes(q) ||
      w.picName.toLowerCase().includes(q)
    );
  });

  return (
    <DnaDataTableCard
      toolbarProps={{
        searchQuery,
        onSearchChange,
        searchPlaceholder: "Cari Nama Gudang, PIC, Kota...",
      }}
    >
      <div className="overflow-x-auto">
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
              <DnaTh className="px-3 py-3 h-[40px] w-[50px] text-center">#</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] w-[110px]">Kode Gudang</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px]">Nama Fasilitas Gudang</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px]">Tipe Fasilitas</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px]">Alamat Lengkap</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px]">Kota / Provinsi</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px]">PIC Gudang</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] w-[110px]">No. Telepon</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-center w-[120px]">Zona Suhu</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-right w-[110px]">Total Rak/Bin</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-right w-[110px]">Utilisasi (%)</DnaTh>
              <DnaTh className="px-3 py-3 h-[40px] text-center w-[100px]">Status</DnaTh>
              <DnaTh className="px-4 py-3 h-[40px] text-right w-[60px]">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {filtered.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={13} className="py-12 text-center text-slate-400">
                  <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  Tidak ada data fasilitas gudang yang sesuai filter.
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

                  {/* Kode Gudang */}
                  <DnaTd className="px-3 py-2">
                    <DnaCell.Code value={row.code} />
                  </DnaTd>

                  {/* Nama Fasilitas Gudang */}
                  <DnaTd className="px-3 py-2 text-slate-900 font-semibold text-xs truncate max-w-[180px]" title={row.name}>
                    {row.name}
                  </DnaTd>

                  {/* Tipe Fasilitas */}
                  <DnaTd className="px-3 py-2 text-slate-600 text-xs">
                    {row.typeLabel}
                  </DnaTd>

                  {/* Alamat Lengkap */}
                  <DnaTd className="px-3 py-2 text-slate-700 text-xs truncate max-w-[200px]" title={row.address}>
                    {row.address}
                  </DnaTd>

                  {/* Kota / Provinsi */}
                  <DnaTd className="px-3 py-2 text-slate-600 text-xs whitespace-nowrap">
                    {row.city}, {row.province}
                  </DnaTd>

                  {/* PIC Gudang */}
                  <DnaTd className="px-3 py-2 text-slate-800 text-xs font-medium truncate max-w-[130px]" title={row.picName}>
                    {row.picName}
                  </DnaTd>

                  {/* No. Telepon */}
                  <DnaTd className="px-3 py-2 text-slate-600 text-xs tabular-nums whitespace-nowrap">
                    {row.phone}
                  </DnaTd>

                  {/* Zona Suhu */}
                  <DnaTd className="px-3 py-2 text-center">
                    {row.temperatureZone === "COOL_ROOM" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        <ThermometerSnowflake className="w-3 h-3" /> Cool (15-25°C)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        Ambient (25-30°C)
                      </span>
                    )}
                  </DnaTd>

                  {/* Total Rak/Bin */}
                  <DnaTd className="px-3 py-2 text-right text-xs tabular-nums text-slate-800 font-medium">
                    {row.totalBins} Rak
                  </DnaTd>

                  {/* Utilisasi (%) */}
                  <DnaTd className="px-3 py-2 text-right">
                    <span
                      className={`tabular-nums font-bold text-xs ${
                        row.capacityUtilityPercent > 80
                          ? "text-amber-600"
                          : "text-emerald-700"
                      }`}
                    >
                      {row.capacityUtilityPercent}%
                    </span>
                  </DnaTd>

                  {/* Status */}
                  <DnaTd className="px-3 py-2 text-center">
                    <DnaBadge variant={row.status === "ACTIVE" ? "success" : "neutral"}>
                      {row.status === "ACTIVE" ? "AKTIF" : row.status}
                    </DnaBadge>
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
