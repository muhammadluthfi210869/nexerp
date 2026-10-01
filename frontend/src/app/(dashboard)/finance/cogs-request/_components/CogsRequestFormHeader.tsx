import React from "react";
import { ChevronLeft, Save } from "lucide-react";
import { DnaButton } from "@/components/dna";

interface CogsRequestFormHeaderProps {
  onAbort: () => void;
  onFinalize: () => void;
}

export function CogsRequestFormHeader({
  onAbort,
  onFinalize,
}: CogsRequestFormHeaderProps) {
  return (
    <div className="flex justify-between items-center bg-white border border-[var(--border-color)] p-4 rounded-2xl shadow-sm">
      <DnaButton
        variant="outline"
        onClick={onAbort}
        icon={<ChevronLeft />}
        className="text-rose-600 hover:bg-rose-50"
      >
        ABORT VALUATION
      </DnaButton>
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-end">
          <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Drafting Phase</span>
          <span className="text-[10px] font-black uppercase text-blue-600">Protocol 06-HPP</span>
        </div>
        <div className="h-6 w-[1px] bg-slate-100" />
        <DnaButton
          variant="primary"
          icon={<Save />}
          onClick={onFinalize}
        >
          FINALIZE REQUEST
        </DnaButton>
      </div>
    </div>
  );
}
