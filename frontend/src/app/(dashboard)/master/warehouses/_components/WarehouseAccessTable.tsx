"use client";

import React from "react";
import { Lock } from "lucide-react";
import {
  DnaDataTableCard,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaBadge,
  DnaButton,
  DnaCell,
} from "@/components/dna";
import type { WarehouseAccessItem } from "../_types/warehouse.types";

interface WarehouseAccessTableProps {
  accessSearchQuery: string;
  onSearchChange: (val: string) => void;
  onOpenCreateAccess: () => void;
  isLoadingAccess: boolean;
  filteredAccessList: WarehouseAccessItem[];
  onEditAccess: (acc: WarehouseAccessItem) => void;
}

export function WarehouseAccessTable({
  accessSearchQuery,
  onSearchChange,
  onOpenCreateAccess,
  isLoadingAccess,
  filteredAccessList,
  onEditAccess,
}: WarehouseAccessTableProps) {
  return (
    <div className="space-y-6">
      <DnaDataTableCard
        toolbarProps={{
          searchPlaceholder: "Cari nama, email, jabatan, atau gudang...",
          searchQuery: accessSearchQuery,
          onSearchChange,
          actionButton: {
            label: "Atur Hak Akses",
            onClick: onOpenCreateAccess,
          },
        }}
      >
        <div className="overflow-x-auto">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-slate-600 text-[11px] font-bold tracking-wider uppercase select-none">
                <DnaTh className="px-3.5 py-2.5 w-10 text-slate-400">#</DnaTh>
                <DnaTh className="px-3.5 py-2.5 w-[110px]">ID Personel</DnaTh>
                <DnaTh className="px-3.5 py-2.5">Nama Personel</DnaTh>
                <DnaTh className="px-3.5 py-2.5">Email Staf</DnaTh>
                <DnaTh className="px-3.5 py-2.5">Nomor Telepon</DnaTh>
                <DnaTh className="px-3.5 py-2.5">Hak Akses / Jabatan</DnaTh>
                <DnaTh className="px-3.5 py-2.5">Gudang Terotorisasi</DnaTh>
                <DnaTh className="px-3.5 py-2.5 text-center w-[110px]">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {isLoadingAccess ? (
                <DnaTableRow>
                  <DnaTd colSpan={8} className="p-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Memuat data otorisasi akses gudang...</span>
                    </div>
                  </DnaTd>
                </DnaTableRow>
              ) : filteredAccessList.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={8} className="p-8 text-center text-slate-400">
                    Tidak ada data personel yang sesuai filter.
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredAccessList.map((acc, idx) => (
                  <DnaTableRow key={acc.id} className="h-[48px] hover:bg-slate-50/80 transition-colors">
                    <DnaTd className="px-3.5 py-2.5 text-slate-400 tabular-nums">{idx + 1}</DnaTd>
                    <DnaTd className="px-3.5 py-2.5">
                      <DnaCell.Code>{acc.userId.substring(0, 8)}...</DnaCell.Code>
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5">
                      <DnaCell.Text className="font-semibold text-slate-900">{acc.namaPersonel}</DnaCell.Text>
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5">
                      <DnaCell.Text className="text-slate-700">{acc.email}</DnaCell.Text>
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5">
                      <DnaCell.Text className="tabular-nums text-[11.5px] text-slate-600">{acc.phone}</DnaCell.Text>
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5">
                      <DnaCell.Badge label={acc.hakAkses} status="info" />
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5">
                      {acc.gudangAkses.length === 0 ? (
                        <DnaBadge variant="neutral">Belum Ada Akses</DnaBadge>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {acc.gudangAkses.map((g, i) => (
                            <span
                              key={i}
                              className="text-[10.5px] font-medium text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
                            >
                              {g}
                            </span>
                          ))}
                        </div>
                      )}
                    </DnaTd>
                    <DnaTd className="px-3.5 py-2.5 text-center">
                      <DnaButton
                        variant="outline"
                        size="sm"
                        icon={<Lock className="w-3 h-3" />}
                        onClick={() => onEditAccess(acc)}
                        className="h-7 text-[11px] px-2.5"
                      >
                        Atur Akses
                      </DnaButton>
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
