"use client";

import React from "react";
import { ClipboardCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  Label,
  DnaInput,
  DnaButton,
} from "@/components/dna";
import { LogResultFormState } from "../_types/stability.types";

interface StabilityLogResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  studyId: string | null;
  logResult: LogResultFormState;
  setLogResult: React.Dispatch<React.SetStateAction<LogResultFormState>>;
  onSubmit: (studyId: string) => void;
  isPending: boolean;
}

export function StabilityLogResultModal({
  isOpen,
  onClose,
  studyId,
  logResult,
  setLogResult,
  onSubmit,
  isPending,
}: StabilityLogResultModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[520px] bg-white rounded-2xl p-0 overflow-hidden border-none shadow-xl">
        <div className="p-6 bg-emerald-600 text-white relative">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="h-6 w-6" />
            <div>
              <h3 className="text-lg font-black">Log Test Result</h3>
              <p className="text-emerald-100 text-xs font-medium mt-0.5">
                Record stability test measurements
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Test Date
              </Label>
              <DnaInput
                type="date"
                value={logResult.date}
                onChange={(e) => setLogResult((p) => ({ ...p, date: e.target.value }))}
                className="h-12 font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Month
              </Label>
              <DnaInput
                type="number"
                value={logResult.month}
                onChange={(e) => setLogResult((p) => ({ ...p, month: Number(e.target.value) }))}
                className="h-12 font-medium"
                min={1}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                pH Value
              </Label>
              <DnaInput
                value={logResult.ph}
                onChange={(e) => setLogResult((p) => ({ ...p, ph: e.target.value }))}
                placeholder="e.g. 6.8"
                className="h-12 font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Viscosity (cPs)
              </Label>
              <DnaInput
                value={logResult.viscosity}
                onChange={(e) => setLogResult((p) => ({ ...p, viscosity: e.target.value }))}
                placeholder="e.g. 1200"
                className="h-12 font-medium"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Appearance Verdict
            </Label>
            <div className="flex gap-2">
              {["STABLE", "DEGRADED", "UNSTABLE"].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setLogResult((p) => ({ ...p, appearance: opt }))}
                  className={`flex-1 h-12 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border-2 ${
                    logResult.appearance === opt
                      ? opt === "STABLE"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                        : opt === "DEGRADED"
                          ? "bg-amber-50 border-amber-500 text-amber-700"
                          : "bg-rose-50 border-rose-500 text-rose-700"
                      : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Notes
            </Label>
            <textarea
              value={logResult.notes}
              onChange={(e) => setLogResult((p) => ({ ...p, notes: e.target.value }))}
              className="w-full h-20 rounded-xl border border-slate-200 bg-slate-50 p-4 font-medium text-sm text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Observations..."
            />
          </div>
        </div>
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
          <DnaButton
            variant="outline"
            onClick={onClose}
            className="flex-1 h-12 rounded-xl font-bold"
          >
            Cancel
          </DnaButton>
          <DnaButton
            variant="primary"
            onClick={() => studyId && onSubmit(studyId)}
            disabled={isPending}
            className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200"
          >
            {isPending ? "Submitting..." : "Log Result"}
          </DnaButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
