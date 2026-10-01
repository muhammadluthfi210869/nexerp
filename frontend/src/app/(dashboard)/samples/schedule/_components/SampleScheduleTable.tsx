"use client";

import React from "react";
import {
  Calendar,
  Clock,
  Eye,
} from "lucide-react";
import {
  DnaTabNav,
  DnaDataTableCard,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
  DnaButton,
  DnaBadge,
} from "@/components/dna";
import { ProductionScheduleItem } from "../_types/schedule.types";

interface SampleScheduleTableProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  totalSchedules: number;
  mixingCount: number;
  fillingCount: number;
  packagingCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filteredSchedules: ProductionScheduleItem[];
  onSelectSchedule: (schedule: ProductionScheduleItem) => void;
}

export const getStatusBadge = (status: ProductionScheduleItem["status"]) => {
  switch (status) {
    case "COMPLETED":
      return <DnaBadge variant="success">SELESAI</DnaBadge>;
    case "IN_PROGRESS":
      return <DnaBadge variant="blue">SEDANG BERJALAN</DnaBadge>;
    case "SCHEDULED":
      return <DnaBadge variant="purple">TERJADWAL</DnaBadge>;
    case "CANCELLED":
      return <DnaBadge variant="danger">DIBATALKAN</DnaBadge>;
    default:
      return <DnaBadge variant="neutral">{status}</DnaBadge>;
  }
};

export function SampleScheduleTable({
  activeTab,
  onTabChange,
  totalSchedules,
  mixingCount,
  fillingCount,
  packagingCount,
  searchQuery,
  onSearchChange,
  filteredSchedules,
  onSelectSchedule,
}: SampleScheduleTableProps) {
  return (
    <>
      {/* 3. Tabs */}
      <DnaTabNav
        tabs={[
          { id: "all", label: `Semua Jadwal (${totalSchedules})` },
          { id: "mixing", label: `Jadwal Mixing (${mixingCount})` },
          { id: "filling", label: `Jadwal Filling (${fillingCount})` },
          { id: "packaging", label: `Jadwal Packaging (${packagingCount})` },
        ]}
        activeTab={activeTab}
        onChange={onTabChange}
      />

      {/* 4. DataTable Card */}
      <DnaDataTableCard
        title="Daftar Jadwal Alokasi Mesin & Line Pra-Produksi"
        description="Penetapan waktu eksekusi, target kuantitas (Pcs / Kg), mesin pelaksana, dan PIC operator per batch record."
        searchValue={searchQuery}
        onSearchChange={onSearchChange}
        searchPlaceholder="Cari Kode Jadwal, Batch Record, Produk, Klien, Mesin, PIC..."
      >
        <div className="overflow-x-auto">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow>
                <DnaTh className="py-3 px-4">Kode & Jadwal</DnaTh>
                <DnaTh className="py-3 px-4">Tipe Proses</DnaTh>
                <DnaTh className="py-3 px-4">Batch Record & Klien</DnaTh>
                <DnaTh className="py-3 px-4">Nama Produk</DnaTh>
                <DnaTh className="py-3 px-4 text-right">Target (PCS)</DnaTh>
                <DnaTh className="py-3 px-4">Mesin / Line Alokasi</DnaTh>
                <DnaTh className="py-3 px-4">Operator PIC</DnaTh>
                <DnaTh className="py-3 px-4">Status</DnaTh>
                <DnaTh className="py-3 px-4 text-center">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {filteredSchedules.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={9} className="py-12 text-center text-slate-400">
                    <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Tidak ada jadwal yang sesuai filter.
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredSchedules.map((row) => (
                  <DnaTableRow key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <DnaTd className="py-3 px-4">
                      <p className="tabular-nums text-xs font-bold text-slate-900">{row.scheduleCode}</p>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{row.scheduleDate}</span>
                      </div>
                    </DnaTd>
                    <DnaTd className="py-3 px-4">
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${
                          row.scheduleType === "MIXING"
                            ? "text-blue-700 bg-blue-50 border-blue-200"
                            : row.scheduleType === "FILLING"
                            ? "text-cyan-700 bg-cyan-50 border-cyan-200"
                            : "text-emerald-700 bg-emerald-50 border-emerald-200"
                        }`}
                      >
                        {row.scheduleTypeLabel}
                      </span>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-xs">
                      <p className="tabular-nums font-bold text-indigo-700">{row.batchRecordCode}</p>
                      <p className="text-slate-600">
                        {row.clientName} ({row.brandName})
                      </p>
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-xs font-semibold text-slate-900">
                      {row.productName}
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-right tabular-nums font-bold text-slate-900">
                      {row.targetQtyPcs.toLocaleString()} Pcs
                      {row.upscaleResultKg && (
                        <div className="text-[10px] text-indigo-600 font-normal">
                          ({row.upscaleResultKg} Kg)
                        </div>
                      )}
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-xs font-medium text-slate-800">
                      {row.assignedLineOrMachine}
                    </DnaTd>
                    <DnaTd className="py-3 px-4 text-xs">
                      <p className="font-medium text-slate-800">{row.picOperator}</p>
                    </DnaTd>
                    <DnaTd className="py-3 px-4">{getStatusBadge(row.status)}</DnaTd>
                    <DnaTd className="py-3 px-4 text-center">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectSchedule(row)}
                        title="Lihat Detail Jadwal"
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
    </>
  );
}
