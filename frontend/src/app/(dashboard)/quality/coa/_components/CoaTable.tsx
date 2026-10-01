"use client";

import React from "react";
import { Eye, Printer, ShieldCheck } from "lucide-react";
import {
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import type { CoaRecord } from "../_types/coa.types";

interface CoaTableProps {
  records: CoaRecord[];
  totalCoa: number;
  verifiedCoa: number;
  pendingCoa: number;
  isLoading: boolean;
  search: string;
  onSearchChange: (val: string) => void;
  activeTab: string;
  onTabChange: (val: string) => void;
  onViewDetail: (record: CoaRecord) => void;
  onPrint: (record: CoaRecord) => void;
  onReset: () => void;
}

export function CoaTable({
  records,
  totalCoa,
  verifiedCoa,
  pendingCoa,
  isLoading,
  search,
  onSearchChange,
  activeTab,
  onTabChange,
  onViewDetail,
  onPrint,
  onReset,
}: CoaTableProps) {
  return (
    <DnaDataTableCard
      count={records.length}
      totalItems={totalCoa}
      toolbarProps={{
        searchValue: search,
        onSearchChange,
        searchPlaceholder: "Cari nomor CoA, nama produk, nomor batch, atau analis...",
        statusOptions: [
          { value: "ALL", label: `Semua CoA (${totalCoa})` },
          { value: "VERIFIED", label: `Terverifikasi (${verifiedCoa})` },
          { value: "PENDING", label: `Menunggu (${pendingCoa})` },
        ],
        selectedStatus: activeTab,
        onSelectStatus: onTabChange,
        statusPlaceholder: "Filter Status CoA",
        onResetAll: onReset,
        hasActiveFilters: search !== "" || activeTab !== "ALL",
      }}
    >
      <div className="w-full">
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow>
              <DnaTh className="py-3 px-4 w-[48px] text-center">#</DnaTh>
              <DnaTh className="py-3 px-4 w-[12%]">Tanggal Terbit</DnaTh>
              <DnaTh className="py-3 px-4 w-[16%]">No. Sertifikat CoA</DnaTh>
              <DnaTh className="py-3 px-4 w-[24%]">Produk & Batch</DnaTh>
              <DnaTh className="py-3 px-4 w-[20%]">Parameter Uji Rilis</DnaTh>
              <DnaTh className="py-3 px-4 w-[14%]">Inspektor Mutu</DnaTh>
              <DnaTh className="py-3 px-4 w-[10%]">Status</DnaTh>
              <DnaTh className="py-3 px-4 w-[8%] text-right">Aksi</DnaTh>
            </DnaTableRow>
          </DnaTableHead>
          <DnaTableBody>
            {isLoading ? (
              <DnaTableRow>
                <DnaTd colSpan={8} className="py-12 text-center text-slate-400">
                  Memuat arsip CoA...
                </DnaTd>
              </DnaTableRow>
            ) : records.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={8} className="py-12 text-center text-slate-400">
                  <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  Tidak ada sertifikat CoA yang sesuai kriteria.
                </DnaTd>
              </DnaTableRow>
            ) : (
              records.map((record, idx) => (
                <DnaTableRow key={record.id} className="hover:bg-slate-50/70 transition-colors">
                  <DnaTd className="py-3 px-4 text-center tabular-nums text-xs font-semibold text-slate-500">
                    {idx + 1}
                  </DnaTd>
                  <DnaTd className="py-3 px-4 tabular-nums text-xs font-medium text-slate-700">
                    {record.releaseDate}
                  </DnaTd>
                  <DnaTd className="py-3 px-4 truncate">
                    <p className="tabular-nums text-xs font-bold text-slate-900 truncate">{record.id}</p>
                  </DnaTd>
                  <DnaTd className="py-3 px-4 truncate">
                    <p className="font-semibold text-slate-900 text-xs truncate">{record.product}</p>
                    <p className="text-[11px] text-slate-500 tabular-nums truncate">Batch: {record.batch}</p>
                  </DnaTd>
                  <DnaTd className="py-3 px-4 truncate">
                    <p className="font-medium text-slate-800 text-xs truncate">
                      pH: {record.parameters?.ph || "—"} • Visk: {record.parameters?.viscosity || "—"}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      Densitas: {record.parameters?.density || "—"} g/ml
                    </p>
                  </DnaTd>
                  <DnaTd className="py-3 px-4 truncate">
                    <p className="font-medium text-slate-800 text-xs truncate">{record.analyst}</p>
                    <p className="text-[11px] text-slate-400 truncate">QC Inspector</p>
                  </DnaTd>
                  <DnaTd className="py-3 px-4">
                    <DnaBadge variant="success">TERVERIFIKASI</DnaBadge>
                  </DnaTd>
                  <DnaTd className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetail(record)}
                        title="Lihat Detail CoA"
                      >
                        <Eye className="w-4 h-4 text-slate-600" />
                      </DnaButton>
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => onPrint(record)}
                        title="Cetak Dokumen CoA"
                      >
                        <Printer className="w-4 h-4 text-indigo-600" />
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
