"use client";

import React from "react";
import { GraduationCap, Clock, CheckCircle2, Award } from "lucide-react";
import { DnaKpiGrid } from "@/components/dna";
import { TrainingRecord } from "../_types/training.types";

export function TrainingKpiGrid({ trainings }: { trainings: TrainingRecord[] }) {
  const totalHours = trainings.reduce((sum, t) => sum + (t.hours || 0), 0);
  const totalCertificates = trainings.filter((t) => !!t.certificateUrl).length;
  const inOnboarding = trainings.filter((t) => t.onboardingStatus === "IN_PROGRESS").length;
  const completedOnboarding = trainings.filter((t) => t.onboardingStatus === "COMPLETED").length;

  return (
    <DnaKpiGrid
      cards={[
        {
          key: "HOURS",
          title: "TOTAL JAM PELATIHAN",
          value: `${totalHours} Jam`,
          subtext: "Akumulasi jam pengembangan kompetensi",
          icon: <Clock className="w-4 h-4" />,
          iconBg: "bg-blue-50",
          iconColor: "text-blue-600",
        },
        {
          key: "ONBOARDING",
          title: "ONBOARDING 3 HARI",
          value: `${completedOnboarding} Selesai`,
          subtext: `${inOnboarding} personel dalam orientasi aktif`,
          icon: <GraduationCap className="w-4 h-4" />,
          iconBg: "bg-purple-50",
          iconColor: "text-purple-600",
        },
        {
          key: "CERT",
          title: "SERTIFIKASI TERIMPORT",
          value: totalCertificates.toString(),
          subtext: "Dokumen bukti sertifikasi terverifikasi",
          icon: <Award className="w-4 h-4" />,
          iconBg: "bg-emerald-50",
          iconColor: "text-emerald-600",
        },
        {
          key: "COMPLIANCE",
          title: "KEPATUHAN CPKB BPOM",
          value: "100%",
          subtext: "Standar sertifikasi personel kosmetik",
          icon: <CheckCircle2 className="w-4 h-4" />,
          iconBg: "bg-teal-50",
          iconColor: "text-teal-600",
        },
      ]}
    />
  );
}
