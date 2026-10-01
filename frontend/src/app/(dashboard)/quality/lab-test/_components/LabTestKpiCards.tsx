import React from "react";
import { FlaskConical, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";

interface LabTestKpiCardsProps {
  totalTests: number;
  stableTests: number;
  unstableTests: number;
}

export function LabTestKpiCards({
  totalTests,
  stableTests,
  unstableTests,
}: LabTestKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="TOTAL PENGUJIAN LAB"
        value={`${totalTests} Sampel`}
        icon={<FlaskConical className="w-5 h-5 text-blue-600" />}
      />
      <DnaStatCard
        label="STABILITAS TERVALIDASI"
        value={`${stableTests} Lolos`}
        icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
      />
      <DnaStatCard
        label="EVALUASI MIKROBIOLOGI"
        value="100% Negatif"
        icon={<ShieldCheck className="w-5 h-5 text-indigo-600" />}
      />
      <DnaStatCard
        label="PERLU REVIEW / FORMULASI"
        value={`${unstableTests} Sampel`}
        icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
      />
    </DnaKpiGrid>
  );
}
