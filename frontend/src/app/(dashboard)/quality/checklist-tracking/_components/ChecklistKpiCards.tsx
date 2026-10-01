"use client";

import React from "react";
import { Layers, CheckCircle2, Clock, AlertTriangle, TrendingUp } from "lucide-react";
import { DnaKpiGrid } from "@/components/dna";

interface ChecklistKpiCardsProps {
  totalProjects: number;
  onTrackProjects: number;
  pendingProjects: number;
  avgProgress: number;
}

export function ChecklistKpiCards({
  totalProjects,
  onTrackProjects,
  pendingProjects,
  avgProgress,
}: ChecklistKpiCardsProps) {
  return (
    <DnaKpiGrid
      cards={[
        {
          key: "TOTAL",
          title: "TOTAL PROJEK MAKLON",
          value: `${totalProjects} Kontrak SO`,
          deltaText: "Sedang berjalan di timeline",
          isDeltaPositive: true,
          icon: <Layers className="w-4 h-4" />,
          iconBg: "bg-blue-50",
          iconColor: "text-blue-600",
        },
        {
          key: "ON_TRACK",
          title: "PROJEK ON-TRACK",
          value: `${onTrackProjects} Projek`,
          deltaText: "Sesuai jadwal SLA matriks",
          isDeltaPositive: true,
          icon: <CheckCircle2 className="w-4 h-4" />,
          iconBg: "bg-emerald-50",
          iconColor: "text-emerald-600",
        },
        {
          key: "PENDING",
          title: "PROJEK PERLU PERHATIAN",
          value: `${pendingProjects} Projek`,
          deltaText: "Menunggu approval / bottleneck",
          isDeltaPositive: false,
          icon: <Clock className="w-4 h-4" />,
          iconBg: "bg-amber-50",
          iconColor: "text-amber-600",
        },
        {
          key: "PROGRESS",
          title: "RATA-RATA REALISASI SLA",
          value: `${avgProgress}%`,
          deltaText: "Penyelesaian milestone",
          isDeltaPositive: true,
          icon: <TrendingUp className="w-4 h-4" />,
          iconBg: "bg-purple-50",
          iconColor: "text-purple-600",
        },
      ]}
    />
  );
}
