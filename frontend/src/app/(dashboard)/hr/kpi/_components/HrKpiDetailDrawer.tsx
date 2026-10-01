"use client";

import React from "react";
import { Printer, Check } from "lucide-react";
import {
  DnaDetailDrawer,
  DnaBadge,
  DnaButton,
  formatRupiah,
} from "@/components/dna";
import type { KpiScorecard } from "../_types/kpi.types";

interface HrKpiDetailDrawerProps {
  selectedKpi: KpiScorecard | null;
  onClose: () => void;
  onPrint: () => void;
  onSignoff: () => void;
}

export function HrKpiDetailDrawer({
  selectedKpi,
  onClose,
  onPrint,
  onSignoff,
}: HrKpiDetailDrawerProps) {
  return (
    <DnaDetailDrawer
      isOpen={!!selectedKpi}
      onClose={onClose}
      title={selectedKpi?.empName || "Evaluasi Kinerja"}
      subtitle={`${selectedKpi?.empRole} â€¢ ${selectedKpi?.department}`}
      badge={
        selectedKpi ? (
          <DnaBadge
            variant={
              selectedKpi.grade === "A" ? "success" :
              selectedKpi.grade === "B+" ? "purple" : "info"
            }
          >
            Grade {selectedKpi.grade}
          </DnaBadge>
        ) : undefined
      }
      tabs={[
        {
          id: "review",
          label: "Evaluasi 360 & Target",
          content: selectedKpi && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[11px] mb-0.5">Target Kinerja Utama (SLA Divisi):</span>
                <div className="font-bold text-slate-900 text-sm">{selectedKpi.targetKpi}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-400 block text-[11px]">Skor Objektif (Output Kerja)</span>
                  <span className="tabular-nums font-bold text-blue-700 text-base">{selectedKpi.objectiveScore}%</span>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-400 block text-[11px]">Skor Kedisiplinan & 5R Pabrik</span>
                  <span className="tabular-nums font-bold text-emerald-700 text-base">{selectedKpi.disciplineScore}%</span>
                </div>
              </div>

              <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-purple-800 text-[11px] block">Total Pencapaian Akhir</span>
                  <span className="font-black text-purple-900 text-lg">{selectedKpi.achievement}%</span>
                </div>
                <DnaBadge variant="purple">Kinerja Istimewa</DnaBadge>
              </div>
            </div>
          )
        },
        {
          id: "bonus",
          label: "Kalkulasi Bonus Insentif",
          content: selectedKpi && (
            <div className="space-y-3 text-xs">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-2">
                <span className="text-emerald-800 font-semibold block text-[11px]">Hak Bonus Kuartal (Multiplier {selectedKpi.bonusMultiplier}x):</span>
                <div className="tabular-nums font-black text-emerald-900 text-xl">{formatRupiah(selectedKpi.bonusAmount)}</div>
                <div className="text-[11px] text-emerald-700">Dicairkan bersamaan dengan siklus penggajian payroll batch akhir kuartal.</div>
              </div>
            </div>
          )
        }
      ]}
      footerActions={
        <div className="flex items-center justify-between w-full">
          <DnaButton variant="secondary" size="md" onClick={onClose}>
            Tutup
          </DnaButton>
          <div className="flex gap-2">
            <DnaButton variant="secondary" size="md" onClick={onPrint}>
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Scorecard
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={onSignoff}>
              <Check className="w-4 h-4 mr-1.5" />
              Sign-off Evaluasi
            </DnaButton>
          </div>
        </div>
      }
    />
  );
}
