import React from "react";
import { RefreshCw, CheckCircle2 } from "lucide-react";
import { DnaButton, DnaInput } from "@/components/dna";
import { DateRange } from "../_types/bank-reconciliation.types";

interface BankReconToolbarProps {
  dateRange: DateRange;
  onDateRangeChange: (dateRange: DateRange) => void;
  onAutoMatch: () => void;
  isAutoMatching: boolean;
  systemLinesCount: number;
  onFinalize: () => void;
  isFinalizing: boolean;
  activeAccountId: string;
}

export function BankReconToolbar({
  dateRange,
  onDateRangeChange,
  onAutoMatch,
  isAutoMatching,
  systemLinesCount,
  onFinalize,
  isFinalizing,
  activeAccountId,
}: BankReconToolbarProps) {
  return (
    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-500">Periode Mutasi:</span>
        <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs">
          <DnaInput
            type="date"
            value={dateRange.start}
            onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
            className="bg-transparent border-0 text-xs focus:ring-0 text-slate-700 font-medium"
          />
          <span className="text-slate-400 font-semibold">s/d</span>
          <DnaInput
            type="date"
            value={dateRange.end}
            onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
            className="bg-transparent border-0 text-xs focus:ring-0 text-slate-700 font-medium"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DnaButton
          variant="secondary"
          size="md"
          onClick={onAutoMatch}
          disabled={isAutoMatching || systemLinesCount === 0}
        >
          <RefreshCw className={`w-4 h-4 mr-1.5 ${isAutoMatching ? "animate-spin" : ""}`} />
          Jalankan Auto-Match
        </DnaButton>
        <DnaButton
          variant="primary"
          size="md"
          onClick={onFinalize}
          disabled={isFinalizing || !activeAccountId}
        >
          <CheckCircle2 className="w-4 h-4 mr-1.5" />
          Finalize Reconcile
        </DnaButton>
      </div>
    </div>
  );
}
