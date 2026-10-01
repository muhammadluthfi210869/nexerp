"use client";

import React from "react";
import { FolderOpen, ExternalLink } from "lucide-react";
import { DnaDetailDrawer, DnaButton } from "@/components/dna";
import { RndProject } from "../_types/project-monitoring.types";
import { getStatusBadge } from "./getStatusBadge";

interface ProjectMonitoringDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProject: RndProject | null;
}

export function ProjectMonitoringDetailDrawer({
  isOpen,
  onClose,
  selectedProject,
}: ProjectMonitoringDetailDrawerProps) {
  return (
    <DnaDetailDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={selectedProject?.projectName || "Detail Project R&D"}
      subtitle={selectedProject ? `${selectedProject.clientName} (${selectedProject.brandName})` : undefined}
      badge={selectedProject ? getStatusBadge(selectedProject.status) : undefined}
      tabs={[
        {
          id: "summary",
          label: "Ringkasan Project",
          content: selectedProject ? (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 text-sm">{selectedProject.projectName}</span>
                  <span className="tabular-nums text-slate-500">{selectedProject.activeRevision}</span>
                </div>
                <p className="text-slate-600">{selectedProject.clientName} â€¢ Brand: {selectedProject.brandName}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block mb-1">PIC Formulator</span>
                  <p className="font-semibold text-slate-900">{selectedProject.picFormulator}</p>
                  <span className="text-[10px] text-slate-400">R&D Lab Formulator</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500 block mb-1">Durasi Pengerjaan</span>
                  <p className="tabular-nums font-bold text-indigo-700">{selectedProject.sampleWorkDays} Hari Kerja</p>
                  <span className="text-[10px] text-slate-400">Terhitung sejak NPF masuk</span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <span className="text-slate-500 block">Jadwal & Timeline</span>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <div>
                    <span className="text-[10px] text-slate-400">Tgl Masuk NPF</span>
                    <p className="tabular-nums font-bold text-slate-700">{selectedProject.npfEntryDate}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Target Selesai</span>
                    <p className="tabular-nums font-bold text-slate-700">{selectedProject.targetFinishDate}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Tgl Pengiriman</span>
                    <p className="tabular-nums font-bold text-slate-700">{selectedProject.shippingDate || "â€”"}</p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-700">Catatan Formulator:</span>
                <p className="text-slate-600">{selectedProject.notes || "Tidak ada catatan."}</p>
              </div>
            </div>
          ) : null,
        },
        {
          id: "folder",
          label: "Dokumen Formula",
          content: selectedProject ? (
            <div className="space-y-3 text-xs">
              <p className="font-bold text-slate-700 uppercase">Akses Cloud Storage & Formula:</p>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-bold text-slate-800">Google Drive Folder Formula</p>
                    <p className="text-[11px] text-slate-500 tabular-nums truncate max-w-xs">{selectedProject.formulaFolderUrl}</p>
                  </div>
                </div>
                <a
                  href={selectedProject.formulaFolderUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold flex items-center gap-1.5 hover:bg-blue-700"
                >
                  Buka Drive <ExternalLink className="w-3.5 h-3.5" />
                </a>
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
        </div>
      }
    />
  );
}
