import React from "react";
import { cn } from "@/lib/utils";
import { PHASES, InspectionPhase } from "../_types/workbench.types";

interface QualityWorkbenchPhaseSelectorProps {
  activePhase: InspectionPhase;
  onSelectPhase: (phase: InspectionPhase) => void;
}

export function QualityWorkbenchPhaseSelector({
  activePhase,
  onSelectPhase,
}: QualityWorkbenchPhaseSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-8 bg-white rounded-2xl p-1.5 border border-[var(--border-color)] shadow-sm">
      {PHASES.map((phase) => {
        const Icon = phase.icon;
        const isActive = activePhase === phase.id;
        return (
          <button
            key={phase.id}
            onClick={() => onSelectPhase(phase.id)}
            className={cn(
              "flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
              isActive
                ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            )}
          >
            <Icon className="h-4 w-4" />
            {phase.label}
          </button>
        );
      })}
    </div>
  );
}
