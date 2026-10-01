import React from "react";
import { Calculator, Plus } from "lucide-react";
import { DnaPageHeader, DnaButton } from "@/components/dna";
import { CostAllocationHeaderProps } from "../_types/cost-allocation-setup.types";

export function CostAllocationHeader({ onCreateClick }: CostAllocationHeaderProps) {
  return (
    <DnaPageHeader
      title="Cost Allocation (Alokasi Overhead antar Cost Center)"
      description="Alokasi biaya overhead yang tercatat di sistem. Master aturan alokasi belum tersedia di backend."
      badge={
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Calculator className="w-3.5 h-3.5" />
          COST ACCOUNTING
        </span>
      }
      actions={
        <DnaButton
          variant="primary"
          size="sm"
          onClick={onCreateClick}
          className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
        >
          <Plus className="w-3.5 h-3.5" />
          + Catat Alokasi Overhead
        </DnaButton>
      }
    />
  );
}
