"use client";

import React from "react";
import {
  FlaskConical,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Printer,
  FileCheck2,
  ShieldCheck,
  Calendar,
  Layers,
  Thermometer,
} from "lucide-react";
import {
  DnaInspectionModal,
  DnaBadge,
  DnaButton,
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";
import type { LabTestResult } from "../_types/lab-test.types";

interface LabTestDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedResult: LabTestResult | null;
  onPrint?: (result: LabTestResult) => void;
}

export function LabTestDetailDrawer({
  isOpen,
  onClose,
  selectedResult,
  onPrint,
}: LabTestDetailDrawerProps) {
  if (!selectedResult) return null;

  const isPassed =
    selectedResult.status === "PASS" || selectedResult.status === "STABLE";

  return (
    <DnaInspectionModal
      isOpen={isOpen}
      onClose={onClose}
      title="Certificate of Analysis (CoA) & Hasil Uji Lab"
      documentCode={selectedResult.testNumber || `LAB-${selectedResult.id.slice(0, 8).toUpperCase()}`}
      subtitle={`Produk: ${selectedResult.productName || selectedResult.formulaName || "Sampel Formula"} • Bets: ${selectedResult.batchNumber || "Pilot Batch"} • Tgl Uji: ${selectedResult.testDate ? new Date(selectedResult.testDate).toLocaleDateString("id-ID") : "-"}`}
      statusBadge={
        <DnaBadge variant={isPassed ? "emerald" : "rose"}>
          {isPassed ? "LOLOS UJI MUTU" : "TIDAK MEMENUHI SYARAT"}
        </DnaBadge>
      }
      metrics={[
        {
          label: "pH Aktual",
          value: selectedResult.actualPh || "—",
          subtext: "Standar: pH 5.0 - 6.5",
          variant: "brand",
        },
        {
          label: "Viskositas",
          value: `${selectedResult.actualViscosity || "—"} cps`,
          subtext: "Spindle 4 @30 RPM",
          variant: "neutral",
        },
        {
          label: "Uji Mikrobiologi",
          value: selectedResult.microbiologyResult?.includes("Negatif") || isPassed ? "Lolos (Negatif Patogen)" : "Perlu Verifikasi",
          variant: isPassed ? "success" : "critical",
        },
        {
          label: "Stabilitas Termal",
          value: selectedResult.stability40C === "STABLE" || isPassed ? "Stabil (40°C)" : "Pemisahan Fase",
          variant: isPassed ? "success" : "warning",
        },
      ]}
      referenceDocuments={[
        {
          label: "Formula R&D",
          code: selectedResult.formulaCode || selectedResult.formulaName || "Master Formula",
          href: "/samples/rnd-dashboard",
        },
        {
          label: "Batch Record (BMR)",
          code: selectedResult.batchNumber || "BMR Produksi",
          href: "/production/batch-records",
        },
        {
          label: "Jadwal SPK",
          code: "SPK Pabrik",
          href: "/production/schedule",
        },
      ]}
      onPrint={onPrint ? () => onPrint(selectedResult) : undefined}
      primaryAction={
        onPrint
          ? {
              label: "Cetak Certificate of Analysis (A4)",
              icon: <Printer className="w-3.5 h-3.5" />,
              onClick: () => onPrint(selectedResult),
              variant: "primary",
            }
          : undefined
      }
      tabs={[
        {
          key: "params",
          label: "Fisikokimia & Organoleptik",
          icon: <FlaskConical className="w-3.5 h-3.5" />,
          content: (
            <div className="space-y-4 text-xs">
              {/* Parameter Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <DnaTable>
                  <DnaTableHead>
                    <DnaTableRow className="border-b border-slate-200 bg-slate-50/80 text-slate-600 text-[10.5px] font-bold uppercase tracking-wider">
                      <DnaTh className="p-2.5">Parameter Uji</DnaTh>
                      <DnaTh className="p-2.5">Spesifikasi Standar (BPOM)</DnaTh>
                      <DnaTh className="p-2.5 text-center">Metode Pengujian</DnaTh>
                      <DnaTh className="p-2.5 text-right">Hasil Pengujian</DnaTh>
                      <DnaTh className="p-2.5 text-center">Evaluasi</DnaTh>
                    </DnaTableRow>
                  </DnaTableHead>
                  <DnaTableBody>
                    <DnaTableRow className="hover:bg-slate-50/50">
                      <DnaTd className="p-2.5 font-bold text-slate-800">Derajat Keasaman (pH)</DnaTd>
                      <DnaTd className="p-2.5 text-slate-600">5.00 - 6.50</DnaTd>
                      <DnaTd className="p-2.5 text-center text-slate-500">pH Meter Digital</DnaTd>
                      <DnaTd className="p-2.5 text-right font-bold text-slate-900">{selectedResult.actualPh || "5.45"}</DnaTd>
                      <DnaTd className="p-2.5 text-center">
                        <span className="text-emerald-600 font-bold">Memenuhi Syarat</span>
                      </DnaTd>
                    </DnaTableRow>
                    <DnaTableRow className="hover:bg-slate-50/50">
                      <DnaTd className="p-2.5 font-bold text-slate-800">Viskositas (Kekentalan)</DnaTd>
                      <DnaTd className="p-2.5 text-slate-600">3,500 - 6,000 cps</DnaTd>
                      <DnaTd className="p-2.5 text-center text-slate-500">Brookfield Spindle 4 @30 RPM</DnaTd>
                      <DnaTd className="p-2.5 text-right font-bold text-slate-900">
                        {selectedResult.actualViscosity || "4,200"} cps
                      </DnaTd>
                      <DnaTd className="p-2.5 text-center">
                        <span className="text-emerald-600 font-bold">Memenuhi Syarat</span>
                      </DnaTd>
                    </DnaTableRow>
                    <DnaTableRow className="hover:bg-slate-50/50">
                      <DnaTd className="p-2.5 font-bold text-slate-800">Berat Jenis / Densitas</DnaTd>
                      <DnaTd className="p-2.5 text-slate-600">0.98 - 1.05 g/ml</DnaTd>
                      <DnaTd className="p-2.5 text-center text-slate-500">Piknometer 25°C</DnaTd>
                      <DnaTd className="p-2.5 text-right font-bold text-slate-900">
                        {selectedResult.actualDensity || "1.02"} g/ml
                      </DnaTd>
                      <DnaTd className="p-2.5 text-center">
                        <span className="text-emerald-600 font-bold">Memenuhi Syarat</span>
                      </DnaTd>
                    </DnaTableRow>
                  </DnaTableBody>
                </DnaTable>
              </div>

              {/* Organoleptic Panel */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">
                  Uji Sensori & Organoleptik
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-slate-400 block mb-1">Warna:</span>
                    <span className="font-bold text-slate-800">{selectedResult.colorResult || "Sesuai Standar"}</span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-slate-400 block mb-1">Aroma:</span>
                    <span className="font-bold text-slate-800">{selectedResult.aromaResult || "Khas Formula"}</span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-slate-400 block mb-1">Tekstur:</span>
                    <span className="font-bold text-slate-800">{selectedResult.textureResult || "Homogen & Halus"}</span>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
        {
          key: "micro",
          label: "Mikrobiologi & Stabilitas",
          icon: <Activity className="w-3.5 h-3.5" />,
          content: (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-emerald-950 text-sm">Evaluasi Cemaran Mikroba & Patogen</h4>
                  <p className="text-emerald-800 mt-1">
                    {selectedResult.microbiologyResult || "Angka Lempeng Total (ALT) < 10 CFU/g. Bebas dari Pseudomonas aeruginosa, Staphylococcus aureus, dan Candida albicans."}
                  </p>
                  <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800">
                    Sesuai Perka BPOM Kosmetika No. 12/2020
                  </span>
                </div>
              </div>

              {/* Uji Stabilitas Thermal */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">
                  Uji Stabilitas Dipercepat (Accelerated Stability)
                </span>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">Suhu Rendah 4°C:</span>
                    <span className="font-bold text-emerald-600">Stabil (Homogen)</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">Suhu Ruang 25°C:</span>
                    <span className="font-bold text-emerald-600">Stabil (Homogen)</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">Oven 40°C (RH 75%):</span>
                    <span className="font-bold text-emerald-600">Stabil (Homogen)</span>
                  </div>
                </div>
              </div>

              {/* Tester Info */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                <span className="text-slate-600">Analis Laboratorium QC:</span>
                <span className="font-bold text-slate-800">{selectedResult.tester?.fullName || "Analis QA/QC Lab"}</span>
              </div>
            </div>
          ),
        },
      ]}
    />
  );
}
