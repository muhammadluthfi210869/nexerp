"use client";

import React from "react";
import { Users, Clock, CheckCircle2, XCircle } from "lucide-react";
import { DnaKpiGrid } from "@/components/dna";
import { CandidateItem } from "../_types/recruitment.types";

export function RecruitmentKpiGrid({ candidates }: { candidates: CandidateItem[] }) {
  const total = candidates.length;
  const inProcess = candidates.filter((c) => c.status === "IN_PROCESS").length;
  const hired = candidates.filter((c) => c.status === "HIRED").length;
  const rejected = candidates.filter((c) => c.status === "REJECTED").length;

  return (
    <DnaKpiGrid
      cards={[
        {
          key: "TOTAL",
          title: "TOTAL PELAMAR MASUK",
          value: total.toString(),
          subtext: "Semua kandidat di pipeline ATS",
          icon: <Users className="w-4 h-4" />,
          iconBg: "bg-blue-50",
          iconColor: "text-blue-600",
        },
        {
          key: "IN_PROCESS",
          title: "DALAM SELEKSI AKTIF",
          value: inProcess.toString(),
          subtext: "Screening & interview berlangsung",
          icon: <Clock className="w-4 h-4" />,
          iconBg: "bg-amber-50",
          iconColor: "text-amber-600",
        },
        {
          key: "HIRED",
          title: "HISTORICAL LOLOS (HIRED)",
          value: hired.toString(),
          subtext: "Kandidat diterima & onboarding",
          icon: <CheckCircle2 className="w-4 h-4" />,
          iconBg: "bg-emerald-50",
          iconColor: "text-emerald-600",
        },
        {
          key: "REJECTED",
          title: "HISTORICAL DITOLAK (REJECT)",
          value: rejected.toString(),
          subtext: "Tidak memenuhi kualifikasi / batal",
          icon: <XCircle className="w-4 h-4" />,
          iconBg: "bg-rose-50",
          iconColor: "text-rose-600",
        },
      ]}
    />
  );
}
