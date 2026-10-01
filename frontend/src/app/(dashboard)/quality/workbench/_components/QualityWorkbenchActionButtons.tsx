import React from "react";
import { XCircle, PauseCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DnaButton } from "@/components/dna";

interface QualityWorkbenchActionButtonsProps {
  isPending: boolean;
  hasAllPass: boolean;
  onReject: () => void;
  onHold: () => void;
  onPass: () => void;
}

export function QualityWorkbenchActionButtons({
  isPending,
  hasAllPass,
  onReject,
  onHold,
  onPass,
}: QualityWorkbenchActionButtonsProps) {
  return (
    <div className="flex gap-4">
      <DnaButton
        onClick={onReject}
        disabled={isPending}
        variant="danger"
        className="flex-1 h-16 rounded-2xl text-xs tracking-widest"
      >
        <XCircle className="h-5 w-5" />
        Reject / NCR
      </DnaButton>
      <DnaButton
        onClick={onHold}
        disabled={isPending}
        variant="outline"
        className="h-16 rounded-2xl border-2 border-amber-200 text-amber-600 hover:bg-amber-50 hover:border-amber-300 tracking-widest px-6"
      >
        <PauseCircle className="h-5 w-5" />
        HOLD
      </DnaButton>
      <DnaButton
        onClick={onPass}
        disabled={isPending || !hasAllPass}
        variant="primary"
        className={cn(
          "flex-[2] h-16 rounded-2xl text-sm tracking-widest shadow-lg",
          hasAllPass
            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 hover:scale-[1.02]"
            : "bg-slate-100 text-slate-400 cursor-not-allowed"
        )}
      >
        <CheckCircle2 className="h-5 w-5" />
        {isPending ? "Submitting..." : "PASS & Sign Off"}
      </DnaButton>
    </div>
  );
}
