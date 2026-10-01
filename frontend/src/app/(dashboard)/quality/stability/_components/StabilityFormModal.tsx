"use client";

import React from "react";
import { FlaskConical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  Label,
  DnaInput,
  DnaButton,
} from "@/components/dna";
import { NewStudyFormState } from "../_types/stability.types";

interface StabilityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  newStudy: NewStudyFormState;
  setNewStudy: React.Dispatch<React.SetStateAction<NewStudyFormState>>;
  onSubmit: () => void;
  isPending: boolean;
}

export function StabilityFormModal({
  isOpen,
  onClose,
  newStudy,
  setNewStudy,
  onSubmit,
  isPending,
}: StabilityFormModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[520px] bg-white rounded-2xl p-0 overflow-hidden border-none shadow-xl">
        <div className="p-6 bg-blue-600 text-white relative">
          <div className="flex items-center gap-3">
            <FlaskConical className="h-6 w-6" />
            <div>
              <h3 className="text-lg font-black">New Stability Study</h3>
              <p className="text-blue-100 text-xs font-medium mt-0.5">
                Configure accelerated or real-time aging protocol
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Product / Formulation
            </Label>
            <DnaInput
              value={newStudy.product}
              onChange={(e) => setNewStudy((p) => ({ ...p, product: e.target.value }))}
              placeholder="Enter product name..."
              className="h-12 font-medium"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Batch Reference
            </Label>
            <DnaInput
              value={newStudy.batch}
              onChange={(e) => setNewStudy((p) => ({ ...p, batch: e.target.value }))}
              placeholder="Batch number..."
              className="h-12 font-medium"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Chamber
            </Label>
            <select
              value={newStudy.chamber}
              onChange={(e) => setNewStudy((p) => ({ ...p, chamber: e.target.value }))}
              className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="A">Chamber A â€” 40Â°C / 75% RH (Accelerated)</option>
              <option value="B">Chamber B â€” 25Â°C / 60% RH (Real-Time)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Start Date
              </Label>
              <DnaInput
                type="date"
                value={newStudy.startDate}
                onChange={(e) => setNewStudy((p) => ({ ...p, startDate: e.target.value }))}
                className="h-12 font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Test Interval
              </Label>
              <select
                value={newStudy.interval}
                onChange={(e) => setNewStudy((p) => ({ ...p, interval: e.target.value }))}
                className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1M">1 Month</option>
                <option value="3M">3 Months</option>
                <option value="6M">6 Months</option>
                <option value="12M">12 Months</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Notes
            </Label>
            <textarea
              value={newStudy.notes}
              onChange={(e) => setNewStudy((p) => ({ ...p, notes: e.target.value }))}
              className="w-full h-24 rounded-xl border border-slate-200 bg-slate-50 p-4 font-medium text-sm text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Study objectives or special conditions..."
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
            onClick={onSubmit}
            disabled={isPending}
            className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
          >
            {isPending ? "Creating..." : "Start Study"}
          </DnaButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
