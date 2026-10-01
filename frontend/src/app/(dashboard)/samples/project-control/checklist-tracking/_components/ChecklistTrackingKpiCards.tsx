"use client";

import React from "react";
import { DnaStatCard } from "@/components/dna";
import { ChecklistCounts } from "../_types/checklist-tracking.types";

interface ChecklistTrackingKpiCardsProps {
  counts: ChecklistCounts;
}

export function ChecklistTrackingKpiCards({ counts }: ChecklistTrackingKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <DnaStatCard
        label="Total Sample Request"
        value={counts.all}
        subtext="Seluruh sample request R&D terdaftar"
        variant="default"
      />
      <DnaStatCard
        label="On Track"
        value={counts.onTrack}
        subtext="Stage berjalan, belum lewat target deadline"
        variant="success"
      />
      <DnaStatCard
        label="Menunggu Approval"
        value={counts.pending}
        subtext="Stage WAITING_FINANCE / CLIENT_REVIEW"
        variant="warning"
      />
      <DnaStatCard
        label="Lewat Deadline / Ditolak"
        value={counts.overdue}
        subtext="targetDeadline lewat atau stage REJECTED/CANCELLED"
        variant="danger"
      />
    </div>
  );
}
