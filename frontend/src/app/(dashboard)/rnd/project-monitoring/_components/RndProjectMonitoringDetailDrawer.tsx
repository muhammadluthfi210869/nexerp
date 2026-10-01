"use client";

import React from "react";
import { DnaModal, DnaButton } from "@/components/dna";
import { RndProjectRecord } from "../_types/project-monitoring.types";

interface RndProjectMonitoringDetailDrawerProps {
  selectedProject: RndProjectRecord | null;
  onClose: () => void;
}

export function RndProjectMonitoringDetailDrawer({
  selectedProject,
  onClose,
}: RndProjectMonitoringDetailDrawerProps) {
  return (
    <DnaModal
      isOpen={!!selectedProject}
      onClose={onClose}
      title="Detail Proyek Riset & Formulasi Laboratorium"
      size="lg"
    >
      {selectedProject && (
        <div className="space-y-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] tabular-nums text-slate-400 font-bold block">
                {selectedProject.projectCode} â€¢ {selectedProject.category}
              </span>
              <h3 className="text-base font-bold text-slate-900">{selectedProject.productName}</h3>
              <p className="text-xs text-slate-500">
                Klien: <span className="font-semibold text-slate-800">{selectedProject.clientName}</span> ({selectedProject.brandName})
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">PIC Formulator:</span>
              <span className="font-bold text-slate-800 text-xs">{selectedProject.picFormulator}</span>
            </div>
          </div>

          {/* Klaim Produk & Target */}
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
            <span className="font-bold text-blue-900 block mb-0.5">Target Klaim Formulasi & Bahan Aktif:</span>
            <p className="text-blue-800">{selectedProject.claim}</p>
          </div>

          {/* Hasil Uji Laboratorium Fisik & Kimia */}
          <div>
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-2">
              Parameter Pengujian Fisik & Kimiawi (LIMS Lab R&D)
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Uji Derajat Keasaman (pH)</span>
                <span className="font-bold text-slate-800">{selectedProject.testParameters.ph}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Viskositas Gel / Cairan</span>
                <span className="font-bold text-slate-800">{selectedProject.testParameters.viscosity}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Uji Pemisahan Sentrifugasi</span>
                <span className="font-bold text-slate-800">{selectedProject.testParameters.centrifuge}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Uji Mikrobiologi & ALT</span>
                <span className="font-bold text-slate-800">{selectedProject.testParameters.microbiology}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <DnaButton variant="secondary" onClick={onClose}>
              Tutup
            </DnaButton>
          </div>
        </div>
      )}
    </DnaModal>
  );
}
