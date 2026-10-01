"use client";

import React from "react";
import {
  DnaDataTableCard,
  DnaTable,
  DnaBadge,
  DnaButton,
  DnaInput,
  DnaCell,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import { Search, RefreshCw, Eye } from "lucide-react";
import { RndProjectRecord } from "../_types/project-monitoring.types";

interface RndProjectMonitoringTableProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filteredProjects: RndProjectRecord[];
  onSelectProject: (project: RndProjectRecord) => void;
  onSync: () => void;
}

export function RndProjectMonitoringTable({
  searchQuery,
  onSearchChange,
  filteredProjects,
  onSelectProject,
  onSync,
}: RndProjectMonitoringTableProps) {
  return (
    <>
      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="w-80">
          <DnaInput
            icon={<Search className="w-4 h-4" />}
            placeholder="Cari kode proyek, nama produk, klien, formulator..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <DnaButton
            variant="secondary"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={onSync}
          >
            Sinkronkan Lab
          </DnaButton>
        </div>
      </div>

      {/* 1:1 Table Standard */}
      <DnaDataTableCard title="Tabel Pengawasan Milestone Proyek R&D (1:1 Standar G-SERP)">
        <div className="overflow-x-auto">
          <DnaTable className="w-full text-left text-[12px]">
            <DnaTableHead>
              <DnaTableRow>
                <DnaTh className="px-4 py-3 w-12 text-center">#</DnaTh>
                <DnaTh className="px-4 py-3">No. Proyek R&D</DnaTh>
                <DnaTh className="px-4 py-3">Klien Maklon</DnaTh>
                <DnaTh className="px-4 py-3">Nama Produk & Brand</DnaTh>
                <DnaTh className="px-4 py-3">Formulator PIC</DnaTh>
                <DnaTh className="px-4 py-3 text-center">Tahapan Riset</DnaTh>
                <DnaTh className="px-4 py-3">Uji Stabilitas</DnaTh>
                <DnaTh className="px-4 py-3 text-center">BPOM Status</DnaTh>
                <DnaTh className="px-4 py-3 text-center">Aksi</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {filteredProjects.length === 0 ? (
                <DnaTableRow>
                  <DnaTd colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    Tidak ada proyek R&D yang cocok dengan kriteria filter.
                  </DnaTd>
                </DnaTableRow>
              ) : (
                filteredProjects.map((p, index) => (
                  <DnaTableRow key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <DnaTd className="px-4 py-3 text-center text-slate-400 tabular-nums text-xs">{index + 1}</DnaTd>
                    <DnaTd className="px-4 py-3 tabular-nums font-bold text-slate-900">{p.projectCode}</DnaTd>
                    <DnaTd className="px-4 py-3 font-semibold text-slate-800">{p.clientName}</DnaTd>
                    <DnaTd className="px-4 py-3">
                      <DnaCell.Text primary={p.productName} secondary={p.brandName} />
                    </DnaTd>
                    <DnaTd className="px-4 py-3 text-slate-700">{p.picFormulator}</DnaTd>
                    <DnaTd className="px-4 py-3 text-center">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          p.currentPhase === "Siap Produksi"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : p.currentPhase === "Uji Stabilitas"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        {p.currentPhase}
                      </span>
                    </DnaTd>
                    <DnaTd className="px-4 py-3">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          p.stabilityTestStatus.includes("LOLOS")
                            ? "text-emerald-700 bg-emerald-50"
                            : p.stabilityTestStatus.includes("REVISI")
                            ? "text-rose-700 bg-rose-50"
                            : "text-amber-700 bg-amber-50"
                        }`}
                      >
                        {p.stabilityTestStatus}
                      </span>
                    </DnaTd>
                    <DnaTd className="px-4 py-3 text-center">
                      <DnaBadge
                        variant={
                          p.bpomStatus === "TERBIT NIE"
                            ? "emerald"
                            : p.bpomStatus === "SUBMITTED"
                            ? "blue"
                            : "default"
                        }
                      >
                        {p.bpomStatus}
                      </DnaBadge>
                    </DnaTd>
                    <DnaTd className="px-4 py-3 text-center">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        icon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => onSelectProject(p)}
                      >
                        Detail
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
