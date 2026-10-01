"use client";

import React from "react";
import { Search, Eye } from "lucide-react";
import {
  DnaDataTableCard,
  DnaTable,
  DnaInput,
  DnaBadge,
  DnaButton,
  formatRupiah,
} from "@/components/dna";
import type { KpiScorecard } from "../_types/kpi.types";

interface HrKpiTableProps {
  filteredKpis: KpiScorecard[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectKpi: (kpi: KpiScorecard) => void;
}

export function HrKpiTable({
  filteredKpis,
  searchQuery,
  onSearchChange,
  onSelectKpi,
}: HrKpiTableProps) {
  return (
    <DnaDataTableCard
      customToolbar={
        <div className="flex items-center justify-between w-full">
          <div className="relative w-80">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <DnaInput
              type="text"
              placeholder="Cari nama karyawan atau jabatan..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Matriks Evaluasi Kinerja Karyawan & Pembobotan: Menampilkan <span className="font-semibold text-slate-800">{filteredKpis.length}</span> Karyawan Dievaluasi
          </div>
        </div>
      }
    >
      <DnaTable className="w-full text-xs text-left table-fixed">
        <thead>
          <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
            <th className="px-3.5 py-3 w-[22%]">Karyawan & NIK</th>
            <th className="px-3.5 py-3 w-[20%]">Departemen & Jabatan</th>
            <th className="px-3.5 py-3 w-[24%]">Key Performance Indicator (Target)</th>
            <th className="px-3.5 py-3 w-[14%]">Pencapaian & Grade</th>
            <th className="px-3.5 py-3 text-right w-[14%]">Estimasi Bonus</th>
            <th className="px-3.5 py-3 text-center w-[6%]">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filteredKpis.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-3.5 py-8 text-center text-slate-400">
                Tidak ada evaluasi kinerja yang sesuai dengan filter.
              </td>
            </tr>
          ) : (
            filteredKpis.map((kpi) => (
              <tr key={kpi.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-3.5 py-2.5 truncate">
                  <div className="font-bold text-slate-900 truncate">{kpi.empName}</div>
                  <div className="text-[11px] tabular-nums text-slate-500">{kpi.empId}</div>
                </td>
                <td className="px-3.5 py-2.5 truncate">
                  <div className="font-semibold text-slate-800 truncate">{kpi.empRole}</div>
                  <div className="text-[11px] text-slate-500 truncate">{kpi.department}</div>
                </td>
                <td className="px-3.5 py-2.5 truncate">
                  <div className="font-medium text-slate-800 truncate">{kpi.targetKpi}</div>
                  <div className="text-[11px] text-slate-500 tabular-nums">
                    Obj: {kpi.objectiveScore}% &bull; Disp: {kpi.disciplineScore}%
                  </div>
                </td>
                <td className="px-3.5 py-2.5 truncate">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs text-blue-700 tabular-nums">
                      {kpi.achievement}%
                    </span>
                    <DnaBadge
                      variant={
                        kpi.grade === "A" ? "success" :
                        kpi.grade === "B+" ? "purple" :
                        kpi.grade === "B" ? "info" : "warning"
                      }
                    >
                      Grade {kpi.grade}
                    </DnaBadge>
                  </div>
                </td>
                <td className="px-3.5 py-2.5 text-right truncate">
                  <div className="tabular-nums font-bold text-emerald-700">{formatRupiah(kpi.bonusAmount)}</div>
                  <div className="text-[10px] text-slate-400">Bonus Kuartal</div>
                </td>
                <td className="px-3.5 py-2.5 text-center">
                  <DnaButton
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelectKpi(kpi)}
                    title="Lihat Detail Scorecard"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                  </DnaButton>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </DnaTable>
    </DnaDataTableCard>
  );
}
