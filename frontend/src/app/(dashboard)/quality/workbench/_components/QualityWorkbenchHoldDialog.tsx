import React from "react";
import { AlertTriangle } from "lucide-react";
import {
  Label,
  Dialog,
  DialogContent,
  DnaButton,
  DnaInput,
} from "@/components/dna";

interface QualityWorkbenchHoldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rejectQty: number;
  onRejectQtyChange: (qty: number) => void;
  defectCategory: string;
  onDefectCategoryChange: (category: string) => void;
  rejectCause: string;
  onRejectCauseChange: (cause: string) => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function QualityWorkbenchHoldDialog({
  open,
  onOpenChange,
  rejectQty,
  onRejectQtyChange,
  defectCategory,
  onDefectCategoryChange,
  rejectCause,
  onRejectCauseChange,
  onConfirm,
  isPending,
}: QualityWorkbenchHoldDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-white rounded-2xl p-0 overflow-hidden border-none shadow-xl">
        <div className="p-6 bg-amber-500 text-white relative">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6" />
            <div>
              <h3 className="text-lg font-black">QC HOLD - Confirmation Required</h3>
              <p className="text-amber-100 text-xs font-medium mt-0.5">
                Hold this batch pending review
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Reject Quantity (pcs)
            </Label>
            <DnaInput
              type="number"
              value={rejectQty}
              onChange={(e) => onRejectQtyChange(Number(e.target.value))}
              className="h-12 font-bold text-lg"
              min={0}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Defect Category
            </Label>
            <select
              value={defectCategory}
              onChange={(e) => onDefectCategoryChange(e.target.value)}
              className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Select category...</option>
              <option value="COSMETIC">Cosmetic Defect</option>
              <option value="FUNCTIONAL">Functional Defect</option>
              <option value="CONTAMINATION">Contamination</option>
              <option value="PACKAGING">Packaging Issue</option>
              <option value="LABELING">Labeling Error</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Reject Cause
            </Label>
            <textarea
              value={rejectCause}
              onChange={(e) => onRejectCauseChange(e.target.value)}
              className="w-full h-24 rounded-xl border border-slate-200 bg-slate-50 p-4 font-medium text-sm text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Describe the root cause of rejection..."
            />
          </div>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-[10px] font-bold text-amber-700 uppercase">
              This will hold the batch and notify the production team for review.
            </p>
          </div>
        </div>
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
          <DnaButton
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-12 rounded-xl font-bold"
          >
            Cancel
          </DnaButton>
          <DnaButton
            variant="primary"
            onClick={onConfirm}
            disabled={isPending || !rejectCause}
            className="flex-1 h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200"
          >
            {isPending ? "Submitting..." : "Confirm HOLD"}
          </DnaButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
