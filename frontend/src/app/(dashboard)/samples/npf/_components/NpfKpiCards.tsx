"use client";

import React from "react";
import { FlaskConical, Clock, Send, CheckCircle2 } from "lucide-react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";

interface NpfKpiCardsProps {
  totalNpfs: number;
  labTrialCount: number;
  shippedCount: number;
  approvedCount: number;
}

export function NpfKpiCards({
  totalNpfs,
  labTrialCount,
  shippedCount,
  approvedCount,
}: NpfKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="Total Dokumen NPF"
        value={`${totalNpfs} Dokumen`}
        icon={<FlaskConical className="w-5 h-5 text-blue-600" />}
        variant="info"
      />
      <DnaStatCard
        label="Formulasi Lab"
        value={`${labTrialCount} Trial`}
        icon={<Clock className="w-5 h-5 text-indigo-600" />}
        variant="purple"
      />
      <DnaStatCard
        label="Sample Terkirim"
        value={`${shippedCount} Klien`}
        icon={<Send className="w-5 h-5 text-cyan-600" />}
        variant="neutral"
      />
      <DnaStatCard
        label="Sample Approved (Deal)"
        value={`${approvedCount} Disetujui`}
        icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        variant="success"
      />
    </DnaKpiGrid>
  );
}
