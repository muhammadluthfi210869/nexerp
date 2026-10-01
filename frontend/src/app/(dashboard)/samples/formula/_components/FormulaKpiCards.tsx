import React from "react";
import { FlaskConical, Scale, DollarSign, CheckCircle2, AlertTriangle } from "lucide-react";
import { DnaKpiGrid, DnaStatCard, formatRupiah } from "@/components/dna";
import { FormulaKpiStats } from "../_types/formula.types";

interface FormulaKpiCardsProps {
  stats: FormulaKpiStats;
  batchSizeGram: number;
}

export function FormulaKpiCards({ stats, batchSizeGram }: FormulaKpiCardsProps) {
  const batchCost = Math.round(stats.costPerKg * (batchSizeGram / 1000));

  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="Total Bahan Baku"
        value={`${stats.totalIngredients} Bahan`}
        icon={<FlaskConical className="w-5 h-5 text-blue-600" />}
        variant="info"
      />
      <DnaStatCard
        label="Total Persentase Formula"
        value={`${stats.totalPercentage.toFixed(2)}%`}
        icon={
          stats.isBalanced ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          )
        }
        variant={stats.isBalanced ? "success" : "danger"}
      />
      <DnaStatCard
        label="Estimasi HPP Bulk / Kg"
        value={`${formatRupiah(stats.costPerKg)} / Kg`}
        icon={<DollarSign className="w-5 h-5 text-purple-600" />}
        variant="purple"
      />
      <DnaStatCard
        label="Total Biaya Batch Lab"
        value={formatRupiah(batchCost)}
        icon={<Scale className="w-5 h-5 text-cyan-600" />}
        variant="neutral"
      />
    </DnaKpiGrid>
  );
}
