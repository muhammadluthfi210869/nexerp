"use client";

import React from "react";
import { Users, Eye } from "lucide-react";
import {
  DnaDataTableCard,
  DnaBadge,
  DnaButton,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaCell,
} from "@/components/dna";
import type { GuestBookEntry } from "../_types/guest-book.types";

interface GuestTableProps {
  loading: boolean;
  totalGuests: number;
  filteredGuests: GuestBookEntry[];
  searchQuery: string;
  onSearchChange: (val: string) => void;
  categoryFilter: string;
  onCategoryChange: (val: string) => void;
  cityFilter: string;
  onCityChange: (val: string) => void;
  cityOptions: string[];
  onSelectGuest: (guest: GuestBookEntry) => void;
  onOpenCreate: () => void;
}

export function GuestTable({
  loading,
  totalGuests,
  filteredGuests,
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  cityFilter,
  onCityChange,
  cityOptions,
  onSelectGuest,
  onOpenCreate,
}: GuestTableProps) {
  const filterColumns = [
    {
      key: "category",
      label: "Kategori Tamu",
      type: "select" as const,
      options: ["BRANDED", "KLINIK", "PEMULA", "DISTRIBUTOR"],
    },
    ...(cityOptions.length > 0
      ? [
          {
            key: "city",
            label: "Kota Asal",
            type: "select" as const,
            options: cityOptions,
          },
        ]
      : []),
  ];

  const selectedColumn =
    categoryFilter !== "ALL"
      ? "category"
      : cityFilter !== "ALL"
      ? "city"
      : undefined;

  const filterValue =
    categoryFilter !== "ALL"
      ? categoryFilter
      : cityFilter !== "ALL"
      ? cityFilter
      : "";

  const handleSelectColumn = (colKey: string) => {
    if (!colKey) {
      onCategoryChange("ALL");
      onCityChange("ALL");
    }
  };

  const handleFilterValueChange = (val: string) => {
    if (!val || val === "ALL") {
      onCategoryChange("ALL");
      onCityChange("ALL");
    } else if (["BRANDED", "KLINIK", "PEMULA", "DISTRIBUTOR"].includes(val)) {
      onCategoryChange(val);
    } else {
      onCityChange(val);
    }
  };

  return (
    <DnaDataTableCard
      count={filteredGuests.length}
      totalItems={totalGuests}
      toolbarProps={{
        searchPlaceholder: "Cari nama tamu, perusahaan, kontak WhatsApp, kota, produk, atau PIC...",
        searchValue: searchQuery,
        onSearchChange: onSearchChange,
        filterColumns,
        selectedColumn,
        onSelectColumn: handleSelectColumn,
        filterValue,
        onFilterValueChange: handleFilterValueChange,
        actionButton: {
          label: "Buat Buku Tamu",
          onClick: onOpenCreate,
        },
      }}
    >
      <div className="w-full overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Memuat data buku tamu...
          </div>
        ) : (
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-slate-600 text-[11px] font-bold uppercase tracking-wider select-none">
                <DnaTh className="px-3 py-2.5 w-[45px] text-center text-slate-400">#</DnaTh>
                <DnaTh className="px-3 py-2.5 min-w-[130px]">Tanggal & Waktu</DnaTh>
                <DnaTh className="px-3 py-2.5 min-w-[180px]">Nama Klien / Perusahaan</DnaTh>
                <DnaTh className="px-3 py-2.5 min-w-[125px]">Kontak (WA/Telp)</DnaTh>
                <DnaTh className="px-3 py-2.5 min-w-[110px]">Kota Asal</DnaTh>
                <DnaTh className="px-3 py-2.5 min-w-[130px]">PIC Host (BusDev)</DnaTh>
                <DnaTh className="px-3 py-2.5 min-w-[150px]">Minat Produk</DnaTh>
                <DnaTh className="px-3 py-2.5 min-w-[110px] text-right">Estimasi MOQ (Pcs)</DnaTh>
                <DnaTh className="px-3 py-2.5 min-w-[120px]">Target Market</DnaTh>
                <DnaTh className="px-3 py-2.5 min-w-[110px] text-center">Kategori</DnaTh>
                <DnaTh className="pr-3 py-2.5 w-[65px] text-right">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {filteredGuests.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={11} className="text-center py-12 text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="font-semibold text-slate-600">Tidak ada data tamu kunjungan</p>
                    <p className="text-xs text-slate-400">Belum ada catatan tamu atau coba sesuaikan filter pencarian.</p>
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredGuests.map((g, idx) => (
                  <DnaTableRow
                    key={g.id}
                    onClick={() => onSelectGuest(g)}
                    className="h-[48px] hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <DnaTd className="px-3 py-2.5 text-center text-slate-400 tabular-nums text-[12px]">
                      {idx + 1}
                    </DnaTd>
                    <DnaTd className="px-3 py-2.5">
                      <span className="tabular-nums font-medium text-slate-700 text-[12px]">{g.dateTime}</span>
                    </DnaTd>
                    <DnaTd className="px-3 py-2.5">
                      <span className="font-semibold text-slate-900 text-[12px]">{g.clientName}</span>
                      {g.instansi && g.instansi !== "â€”" && g.instansi !== g.clientName && (
                        <span className="text-slate-400 text-[11px] ml-1">({g.instansi})</span>
                      )}
                    </DnaTd>
                    <DnaTd className="px-3 py-2.5">
                      <span className="tabular-nums text-blue-600 font-mono text-[11.5px]">{g.contact}</span>
                    </DnaTd>
                    <DnaTd className="px-3 py-2.5">
                      <DnaCell.Text text={g.city} />
                    </DnaTd>
                    <DnaTd className="px-3 py-2.5">
                      <DnaCell.Text text={g.meetingPic} />
                    </DnaTd>
                    <DnaTd className="px-3 py-2.5">
                      <DnaCell.Text text={g.productInterest} />
                    </DnaTd>
                    <DnaTd className="px-3 py-2.5 text-right">
                      <DnaCell.Numeric value={g.moq} suffix=" pcs" />
                    </DnaTd>
                    <DnaTd className="px-3 py-2.5">
                      <DnaCell.Text text={g.targetMarket} />
                    </DnaTd>
                    <DnaTd className="px-3 py-2.5 text-center">
                      <DnaBadge
                        variant={
                          g.category === "BRANDED"
                            ? "purple"
                            : g.category === "KLINIK"
                            ? "emerald"
                            : g.category === "PEMULA"
                            ? "amber"
                            : "blue"
                        }
                      >
                        {g.category}
                      </DnaBadge>
                    </DnaTd>
                    <DnaTd className="pr-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end">
                        <DnaButton
                          variant="ghost"
                          className="h-7 w-7 p-0 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                          onClick={() => onSelectGuest(g)}
                          title="Lihat Detail"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </DnaButton>
                      </div>
                    </DnaTd>
                  </DnaTableRow>
                ))
              )}
            </DnaTableBody>
          </DnaTable>
        )}
      </div>
    </DnaDataTableCard>
  );
}
