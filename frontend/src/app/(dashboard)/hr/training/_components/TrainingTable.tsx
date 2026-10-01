"use client";

import React from "react";
import {
  DnaTable,
  DnaTableHead,
  DnaTableRow,
  DnaTh,
  DnaTableBody,
  DnaTd,
  DnaBadge,
  DnaButton,
} from "@/components/dna";
import { Award, FileText, CheckCircle2, Clock, Eye } from "lucide-react";
import { TrainingRecord } from "../_types/training.types";

interface TrainingTableProps {
  trainings: TrainingRecord[];
  isLoading: boolean;
  onSelectRecord: (record: TrainingRecord) => void;
}

export function TrainingTable({
  trainings,
  isLoading,
  onSelectRecord,
}: TrainingTableProps) {
  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-400 font-bold uppercase text-xs animate-pulse">
        Memuat data pelatihan & jam onboarding pegawai...
      </div>
    );
  }

  return (
    <DnaTable className="w-full">
      <DnaTableHead>
        <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-600 tracking-wider">
          <DnaTh className="p-3 w-10 text-center text-slate-400">#</DnaTh>
          <DnaTh className="p-3 w-32">TANGGAL TRAINING</DnaTh>
          <DnaTh className="p-3 w-48">NAMA PEGAWAI & JABATAN</DnaTh>
          <DnaTh className="p-3 w-48">JENIS TRAINING</DnaTh>
          <DnaTh className="p-3 w-28 text-center">DURASI (JAM)</DnaTh>
          <DnaTh className="p-3 w-64">TARGET & GOAL KOMPETENSI</DnaTh>
          <DnaTh className="p-3 w-36 text-center">ONBOARDING 3 HARI</DnaTh>
          <DnaTh className="p-3 w-40">SERTIFIKAT</DnaTh>
          <DnaTh className="p-3 w-20 text-right">AKSI</DnaTh>
        </DnaTableRow>
      </DnaTableHead>
      <DnaTableBody>
        {trainings.length === 0 ? (
          <DnaTableRow>
            <DnaTd colSpan={9} className="p-12 text-center text-slate-400 font-medium">
              Tidak ada catatan sesi pelatihan yang ditemukan.
            </DnaTd>
          </DnaTableRow>
        ) : (
          trainings.map((t, idx) => {
            const formattedDate = t.trainingDate
              ? new Date(t.trainingDate).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "-";

            const isOnboardingDone = t.onboardingStatus === "COMPLETED";

            return (
              <DnaTableRow
                key={t.id}
                className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                onClick={() => onSelectRecord(t)}
              >
                {/* Col 1: # */}
                <DnaTd className="p-3 text-center text-slate-400 tabular-nums text-xs">
                  {idx + 1}
                </DnaTd>

                {/* Col 2: Tanggal Training */}
                <DnaTd className="p-3 tabular-nums text-xs font-semibold text-slate-700">
                  {formattedDate}
                </DnaTd>

                {/* Col 3: Nama Pegawai & Jabatan */}
                <DnaTd className="p-3">
                  <div className="font-bold text-slate-900 text-xs">{t.employeeName}</div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {t.employeePosition || "Staff"} • {t.department || "PRODUCTION"}
                  </div>
                </DnaTd>

                {/* Col 4: Jenis Training */}
                <DnaTd className="p-3">
                  <span className="font-semibold text-slate-800 text-xs">{t.trainingType}</span>
                </DnaTd>

                {/* Col 5: Durasi (Jam) */}
                <DnaTd className="p-3 text-center">
                  <span className="inline-flex items-center gap-1 text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    <Clock className="w-3 h-3 text-blue-600" />
                    {t.hours} Jam
                  </span>
                </DnaTd>

                {/* Col 6: Target & Goal */}
                <DnaTd className="p-3">
                  <div className="text-xs text-slate-700 line-clamp-2">{t.goal}</div>
                </DnaTd>

                {/* Col 7: Onboarding 3 Hari */}
                <DnaTd className="p-3 text-center">
                  <DnaBadge variant={isOnboardingDone ? "success" : "warning"}>
                    {isOnboardingDone ? "SELESAI (3 HARI)" : "DALAM PROSES"}
                  </DnaBadge>
                </DnaTd>

                {/* Col 8: Sertifikat */}
                <DnaTd className="p-3" onClick={(e) => e.stopPropagation()}>
                  {t.certificateUrl ? (
                    <a
                      href={t.certificateUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 transition-colors"
                    >
                      <Award className="w-3 h-3 text-emerald-600" />
                      Lihat Sertifikat
                    </a>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Belum Ada Sertifikat</span>
                  )}
                </DnaTd>

                {/* Col 9: Aksi */}
                <DnaTd className="p-3 text-right">
                  <DnaButton
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600 rounded"
                    onClick={() => onSelectRecord(t)}
                    title="Lihat Detail Sesi Pelatihan"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </DnaButton>
                </DnaTd>
              </DnaTableRow>
            );
          })
        )}
      </DnaTableBody>
    </DnaTable>
  );
}
