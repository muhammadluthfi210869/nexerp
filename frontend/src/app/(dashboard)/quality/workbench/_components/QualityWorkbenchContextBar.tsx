import React from "react";
import { Hash, ScanLine } from "lucide-react";
import { DnaBadge, DnaInput } from "@/components/dna";
import { InspectionPhase, PhaseBreakdownStat } from "../_types/workbench.types";

interface QualityWorkbenchContextBarProps {
  activePhase: InspectionPhase;
  stepLogId: string;
  onStepLogIdChange: (value: string) => void;
  activePhaseStats?: PhaseBreakdownStat;
}

export function QualityWorkbenchContextBar({
  activePhase,
  stepLogId,
  onStepLogIdChange,
  activePhaseStats,
}: QualityWorkbenchContextBarProps) {
  return (
    <>
      {/* Phase Context Info Bar */}
      {stepLogId && (
        <div className="mb-8 p-4 rounded-2xl bg-slate-50 border border-[var(--border-color)] flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Step Log</span>
            <span className="text-xs font-bold tabular-nums text-slate-900">{stepLogId}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phase</span>
            <DnaBadge status="info" className="text-[8px]">{activePhase}</DnaBadge>
          </div>
          {activePhaseStats && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">This Phase</span>
              <span className="text-xs font-bold text-emerald-600">{activePhaseStats.passCount} passed</span>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-bold text-red-500">{activePhaseStats.rejectCount} rejected</span>
              <span className="text-[9px] text-slate-400">this month</span>
            </div>
          )}
        </div>
      )}

      {/* Step Log ID Input */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <ScanLine className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Step Log ID
            </span>
          </div>
          <DnaInput
            value={stepLogId}
            onChange={(e) => onStepLogIdChange(e.target.value)}
            placeholder="Auto from URL or paste here..."
            className="max-w-md h-10 font-medium text-sm"
          />
        </div>
      </div>
    </>
  );
}
