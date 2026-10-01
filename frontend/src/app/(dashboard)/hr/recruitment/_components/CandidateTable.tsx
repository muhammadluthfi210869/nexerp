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
import { FileText, Check, X, ArrowRight, Bell, Eye } from "lucide-react";
import { CandidateItem, CandidateStage } from "../_types/recruitment.types";

interface CandidateTableProps {
  candidates: CandidateItem[];
  isLoading: boolean;
  onSelectCandidate: (candidate: CandidateItem) => void;
  onUpdateStage: (params: { id: string; stage: CandidateStage; rejectionReason?: string }) => void;
}

export function CandidateTable({
  candidates,
  isLoading,
  onSelectCandidate,
  onUpdateStage,
}: CandidateTableProps) {
  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-400 font-bold uppercase text-xs animate-pulse">
        Memuat data kandidat & pipeline ATS...
      </div>
    );
  }

  return (
    <DnaTable className="w-full">
      <DnaTableHead>
        <DnaTableRow className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-600 tracking-wider">
          <DnaTh className="p-3 w-12 text-center text-slate-400">#</DnaTh>
          <DnaTh className="p-3 w-28">TANGGAL LAMAR</DnaTh>
          <DnaTh className="p-3 w-52">NAMA & KONTAK</DnaTh>
          <DnaTh className="p-3 w-40">DEPARTEMEN / ROLE</DnaTh>
          <DnaTh className="p-3 w-44">CV & REVIEW</DnaTh>
          <DnaTh className="p-3 w-36 text-center">TAHAPAN ATS</DnaTh>
          <DnaTh className="p-3 w-48">REMINDER & STATUS</DnaTh>
          <DnaTh className="p-3 w-36 text-right">AKSI SELEKSI</DnaTh>
        </DnaTableRow>
      </DnaTableHead>
      <DnaTableBody>
        {candidates.length === 0 ? (
          <DnaTableRow>
            <DnaTd colSpan={8} className="p-12 text-center text-slate-400 font-medium">
              Tidak ada kandidat pelamar yang sesuai dengan kriteria filter.
            </DnaTd>
          </DnaTableRow>
        ) : (
          candidates.map((c, idx) => {
            const formattedDate = c.createdAt
              ? new Date(c.createdAt).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "-";

            const isHired = c.stage === "HIRED" || c.status === "HIRED";
            const isRejected = c.stage === "REJECTED" || c.status === "REJECTED";

            return (
              <DnaTableRow
                key={c.id}
                className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                onClick={() => onSelectCandidate(c)}
              >
                {/* Col 1: # */}
                <DnaTd className="p-3 text-center text-slate-400 tabular-nums text-xs">
                  {idx + 1}
                </DnaTd>

                {/* Col 2: Tanggal Lamar */}
                <DnaTd className="p-3 tabular-nums text-xs font-semibold text-slate-700">
                  {formattedDate}
                </DnaTd>

                {/* Col 3: Nama & Kontak */}
                <DnaTd className="p-3">
                  <div className="font-bold text-slate-900 text-xs">{c.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {c.email} {c.phone ? `• ${c.phone}` : ""}
                  </div>
                </DnaTd>

                {/* Col 4: Departemen */}
                <DnaTd className="p-3">
                  <div className="font-semibold text-slate-800 text-xs">{c.department}</div>
                  <div className="text-[11px] text-slate-400">{c.appliedRole || "Staff"}</div>
                </DnaTd>

                {/* Col 5: CV & Review */}
                <DnaTd className="p-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    {c.cvUrl ? (
                      <a
                        href={c.cvUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition-colors"
                      >
                        <FileText className="w-3 h-3" /> CV Pelamar
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Tanpa Link CV</span>
                    )}
                    {typeof c.cvReviewScore === "number" && (
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {c.cvReviewScore}/100
                      </span>
                    )}
                  </div>
                  {c.cvReviewNotes && (
                    <div className="text-[10px] text-slate-500 truncate max-w-[170px] mt-0.5">
                      {c.cvReviewNotes}
                    </div>
                  )}
                </DnaTd>

                {/* Col 6: Tahapan ATS */}
                <DnaTd className="p-3 text-center">
                  <DnaBadge
                    variant={
                      isHired
                        ? "success"
                        : isRejected
                        ? "destructive"
                        : c.stage === "INTERVIEW"
                        ? "warning"
                        : "info"
                    }
                  >
                    {c.stage}
                  </DnaBadge>
                </DnaTd>

                {/* Col 7: Reminder & Status */}
                <DnaTd className="p-3">
                  {isHired ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <Check className="w-3 h-3" /> Lolos • Siap Onboarding 3 Hari
                    </span>
                  ) : isRejected ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      <X className="w-3 h-3" /> Ditolak {c.rejectionReason ? `• ${c.rejectionReason}` : ""}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      <Bell className="w-3 h-3 text-amber-500" />
                      {c.stage === "OFFERED"
                        ? "Reminder: Menunggu konfirmasi penawaran"
                        : c.stage === "INTERVIEW"
                        ? "Reminder: Jadwalkan wawancara teknis"
                        : "Reminder: Review CV dan portofolio"}
                    </span>
                  )}
                </DnaTd>

                {/* Col 8: Aksi Seleksi */}
                <DnaTd className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <DnaButton
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600 rounded"
                      onClick={() => onSelectCandidate(c)}
                      title="Lihat Detail & Riwayat"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </DnaButton>

                    {!isHired && !isRejected && (
                      <>
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 rounded"
                          onClick={() => {
                            const nextStage: Record<string, CandidateStage> = {
                              APPLIED: "SCREENING",
                              SCREENING: "INTERVIEW",
                              INTERVIEW: "OFFERED",
                              OFFERED: "HIRED",
                            };
                            onUpdateStage({
                              id: c.id,
                              stage: nextStage[c.stage] || "HIRED",
                            });
                          }}
                          title="Lanjutkan ke Tahap Berikutnya"
                        >
                          <ArrowRight className="w-3 h-3 mr-1" />
                          Lanjut
                        </DnaButton>
                        <DnaButton
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded"
                          onClick={() => {
                            const reason = window.prompt("Alasan penolakan (opsional):") || "Tidak sesuai kualifikasi";
                            onUpdateStage({ id: c.id, stage: "REJECTED", rejectionReason: reason });
                          }}
                          title="Tolak Kandidat"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Tolak
                        </DnaButton>
                      </>
                    )}
                  </div>
                </DnaTd>
              </DnaTableRow>
            );
          })
        )}
      </DnaTableBody>
    </DnaTable>
  );
}
