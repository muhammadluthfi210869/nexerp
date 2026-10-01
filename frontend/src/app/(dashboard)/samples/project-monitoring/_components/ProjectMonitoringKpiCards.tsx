"use client";

import React from "react";
import { FlaskConical, Clock, Send, AlertTriangle } from "lucide-react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";

interface ProjectMonitoringKpiCardsProps {
  totalProjects: number;
  inProgressCount: number;
  shippedCount: number;
  overdueCount: number;
}

export function ProjectMonitoringKpiCards({
  totalProjects,
  inProgressCount,
  shippedCount,
  overdueCount,
}: ProjectMonitoringKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="TOTAL PROJECT R&D"
        value={`${totalProjects} Project`}
        subValue="NPF Periode Berjalan"
        icon={<FlaskConical className="w-5 h-5 text-blue-600" />}
      />
      <DnaStatCard
        label="DALAM FORMULASI"
        value={`${inProgressCount} Formula`}
        subValue="Trial Lab & Optimasi"
        icon={<Clock className="w-5 h-5 text-indigo-600" />}
      />
      <DnaStatCard
        label="SAMPLE TERKIRIM"
        value={`${shippedCount} Klien`}
        subValue="Menunggu Review Feedback"
        icon={<Send className="w-5 h-5 text-cyan-600" />}
      />
      <DnaStatCard
        label="OVERDUE SLA"
        value={`${overdueCount} Project`}
        subValue="Perlu Eskalasi Formulator"
        icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
      />
    </DnaKpiGrid>
  );
}
