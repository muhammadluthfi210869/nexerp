import React from "react";
import { Send, CheckCircle2, Clock, XCircle } from "lucide-react";
import { DnaStatCard } from "@/components/dna";

export interface ApjReleaseKpiCardsProps {
  totalReleases: number;
  releasedCount: number;
  holdCount: number;
  rejectCount: number;
}

export const ApjReleaseKpiCards: React.FC<ApjReleaseKpiCardsProps> = ({
  totalReleases,
  releasedCount,
  holdCount,
  rejectCount,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <DnaStatCard label="TOTAL RELEASES" value={totalReleases} icon={<Send />} variant="neutral" />
      <DnaStatCard label="RELEASED" value={releasedCount} icon={<CheckCircle2 />} variant="emerald" />
      <DnaStatCard label="ON HOLD" value={holdCount} icon={<Clock />} variant="amber" />
      <DnaStatCard label="REJECTED" value={rejectCount} icon={<XCircle />} variant="rose" />
    </div>
  );
};
