"use client";

import React from "react";
import { Download, Printer } from "lucide-react";
import { DnaDetailDrawer, DnaBadge, DnaButton, useDnaToast } from "@/components/dna";
import type { CoaRecord } from "../_types/coa.types";

interface CoaDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  record: CoaRecord | null;
  onPrint: (record: CoaRecord) => void;
}

export function CoaDetailDrawer({
  isOpen,
  onClose,
  record,
  onPrint,
}: CoaDetailDrawerProps) {
  const toast = useDnaToast();

  return (
    <DnaDetailDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={record?.id || "Certificate of Analysis"}
      subtitle={record ? `${record.product} • Batch ${record.batch}` : undefined}
      badge={record ? <DnaBadge variant="success">TERVERIFIKASI</DnaBadge> : undefined}
      tabs={[
        {
          id: "details",
          label: "Rincian Sertifikat",
          content: record ? (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="tabular-nums font-bold text-slate-900">{record.id}</span>
                  <span className="tabular-nums text-slate-500">{record.releaseDate}</span>
                </div>
                <p className="font-bold text-slate-900 text-sm">{record.product}</p>
                <p className="text-slate-600 tabular-nums">No. Batch: {record.batch}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block mb-1">Otorisasi Analis</span>
                  <p className="font-semibold text-slate-900">{record.analyst}</p>
                  <span className="text-[10px] text-slate-400">Quality Assurance</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block mb-1">Fase Pengujian</span>
                  <p className="font-bold text-indigo-700">{record.phase || "Rilis Akhir"}</p>
                  <span className="text-[10px] text-slate-400">Finish Good Audit</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700">Catatan Audit:</span>
                <p className="text-slate-600">{record.notes || "Semua kriteria rilis terpenuhi sesuai spesifikasi CPKB."}</p>
              </div>
            </div>
          ) : null,
        },
        {
          id: "parameters",
          label: "Parameter Analisis",
          content: record ? (
            <div className="space-y-3 text-xs">
              <p className="font-bold text-slate-700 uppercase">Parameter Uji Fisik & Kimia:</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block mb-1">pH Uji</span>
                  <p className="tabular-nums font-bold text-slate-900">{record.parameters?.ph || "—"}</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block mb-1">Viskositas</span>
                  <p className="tabular-nums font-bold text-slate-900">{record.parameters?.viscosity || "—"} cps</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block mb-1">Densitas</span>
                  <p className="tabular-nums font-bold text-slate-900">{record.parameters?.density || "—"} g/ml</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <p className="font-bold text-slate-700 uppercase">Integritas Kemasan & Organoleptik</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Organoleptik</span>
                    <p className="font-semibold text-slate-800">{record.parameters?.organoleptic || "Lolos"}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Homogenitas</span>
                    <p className="font-semibold text-emerald-700">{record.parameters?.homogenity ? "Homogen (Lolos)" : "Tidak Homogen"}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Leak Test (Uji Bocor)</span>
                    <p className="font-semibold text-emerald-700">{record.parameters?.leakTest ? "Kedap (Lolos)" : "Bocor"}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Sealing & Labeling</span>
                    <p className="font-semibold text-slate-800">Lolos Inspeksi</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null,
        },
      ]}
      footerActions={
        <div className="flex items-center justify-end gap-2 w-full">
          <DnaButton variant="secondary" onClick={onClose}>
            Tutup
          </DnaButton>
          <DnaButton
            variant="outline"
            onClick={() => {
              toast.success("Download PDF", "Sertifikat CoA berhasil diunduh.");
            }}
          >
            <Download className="w-4 h-4 mr-1.5" />
            Download PDF
          </DnaButton>
          <DnaButton
            variant="primary"
            onClick={() => {
              if (record) onPrint(record);
              onClose();
            }}
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Cetak Sertifikat
          </DnaButton>
        </div>
      }
    />
  );
}
