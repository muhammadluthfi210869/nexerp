"use client";

import React from "react";
import { CheckCircle2, Clock, FileSpreadsheet } from "lucide-react";
import { DnaDetailDrawer, DnaBadge, DnaButton } from "@/components/dna";
import { IpqcChecklistTracking as ChecklistTracking } from "../_types/checklist-tracking.types";

interface QualityChecklistTrackingDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedChecklist: ChecklistTracking | null;
  onExportDetail: () => void;
}

export function QualityChecklistTrackingDetailDrawer({
  isOpen,
  onClose,
  selectedChecklist,
  onExportDetail,
}: QualityChecklistTrackingDetailDrawerProps) {
  return (
    <DnaDetailDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={selectedChecklist?.name || "Detail Milestone Checklist"}
      subtitle={`Kode: ${selectedChecklist?.code || "-"} â€¢ Kategori: ${
        selectedChecklist?.category || "-"
      }`}
      badge={
        selectedChecklist?.status === "VERIFIED" ? (
          <DnaBadge variant="success">TERVERIFIKASI</DnaBadge>
        ) : (
          <DnaBadge variant="info">SELESAI OPERASIONAL</DnaBadge>
        )
      }
      tabs={[
        {
          id: "timeline",
          label: "Timeline & Verifikasi",
          content: selectedChecklist ? (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 block text-[11px]">PIC Pelaksana</span>
                  <span className="font-bold text-slate-900">{selectedChecklist.pic}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">
                    Verifikator Kualitas
                  </span>
                  <span className="font-bold text-slate-900">
                    {selectedChecklist.verifiedBy}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Tanggal Selesai</span>
                  <span className="font-medium text-slate-800">
                    {selectedChecklist.completedAt
                      ? new Date(selectedChecklist.completedAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "-"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Durasi Pengerjaan</span>
                  <span className="tabular-nums font-medium text-slate-800">
                    {selectedChecklist.duration}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block">
                  Tahapan Milestone Mutu:
                </span>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-semibold text-emerald-900">
                        1. Pengisian Lembar Checklist Lapangan
                      </div>
                      <div className="text-[11px] text-emerald-700">
                        Diselesaikan oleh {selectedChecklist.pic}
                      </div>
                    </div>
                    <DnaBadge variant="success">Passed</DnaBadge>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-semibold text-emerald-900">
                        2. Verifikasi Uji Mutu Laboratorium
                      </div>
                      <div className="text-[11px] text-emerald-700">
                        Tercatat {selectedChecklist.passedItems} dari{" "}
                        {selectedChecklist.totalItems} butir lolos uji
                      </div>
                    </div>
                    <DnaBadge variant="success">Passed</DnaBadge>
                  </div>
                  <div className="flex items-center gap-3 p-2.5 bg-blue-50 rounded-lg border border-blue-200">
                    <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-semibold text-blue-900">
                        3. Tanda Tangan Digital & Otentikasi
                      </div>
                      <div className="text-[11px] text-blue-700">
                        Diverifikasi resmi oleh {selectedChecklist.verifiedBy}
                      </div>
                    </div>
                    <DnaBadge variant="info">Verified</DnaBadge>
                  </div>
                </div>
              </div>
            </div>
          ) : null,
        },
        {
          id: "items",
          label: "Daftar Butir Audit",
          content: selectedChecklist ? (
            <div className="space-y-2 text-xs">
              {Array.from({ length: selectedChecklist.totalItems }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 bg-white rounded border border-slate-200"
                >
                  <div>
                    <span className="font-medium text-slate-800">
                      Butir Audit #{i + 1}: Kepatuhan Spesifikasi Standar Batch
                    </span>
                    <span className="text-[10px] text-slate-400 block tabular-nums">
                      SOP-QC-SEC-{100 + i}
                    </span>
                  </div>
                  <DnaBadge
                    variant={
                      i < selectedChecklist.passedItems ? "success" : "critical"
                    }
                  >
                    {i < selectedChecklist.passedItems ? "Lolos" : "Penyimpangan"}
                  </DnaBadge>
                </div>
              ))}
            </div>
          ) : null,
        },
      ]}
      footerActions={
        <div className="flex items-center justify-between w-full">
          <DnaButton
            variant="outline"
            size="sm"
            icon={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
            onClick={onExportDetail}
          >
            Export Hasil Audit
          </DnaButton>
          <DnaButton variant="primary" size="sm" onClick={onClose}>
            Selesai
          </DnaButton>
        </div>
      }
    />
  );
}
