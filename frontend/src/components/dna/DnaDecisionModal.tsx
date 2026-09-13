"use client";

// DnaDecisionModal — Wave 4 / D3.
//
// Triggered by GateIndicator's recommendation action button OR by a row
// click in /decision-support pending list. Posts to /v1/decision/:id/resolve
// and emits a decision.recorded toast via the existing useDnaToast.
//
// ponytail: minimal surface — action + rationale + impact preview. Real
// impact preview text is server-derived once the recommendation engine
// lands; for v1 we surface the entity label + decision type.

import React, { useEffect, useState } from "react";
import {
  DnaDialog,
  DnaDialogContent,
  DnaDialogHeader,
  DnaDialogTitle,
  DnaDialogDescription,
  DnaDialogFooter,
  DnaDialogClose,
  DnaButton,
  DnaSelect,
  DnaTextarea,
} from "@/components/dna";
import { useDnaToast } from "@/components/dna/DnaToast";
import { api, extractApiError } from "@/lib/api";

export type DecisionAction = "APPROVE" | "REJECT" | "DEFER";

export interface DnaDecisionModalProps {
  open: boolean;
  onClose: () => void;
  /** String id passed as the path param to /v1/decision/:id/resolve. */
  decisionId: string;
  /** Display-only — for the modal title + impact preview. */
  contextLabel?: string;
  entityType?: string;
  /** Called after a successful resolve (to refresh lists / mutate cache). */
  onResolved?: () => void;
}

const ACTION_OPTIONS: { value: DecisionAction; label: string; tone: string }[] = [
  { value: "APPROVE", label: "Setujui", tone: "text-emerald-700" },
  { value: "REJECT", label: "Tolak", tone: "text-rose-700" },
  { value: "DEFER", label: "Tunda", tone: "text-amber-700" },
];

export function DnaDecisionModal({
  open,
  onClose,
  decisionId,
  contextLabel,
  entityType,
  onResolved,
}: DnaDecisionModalProps) {
  const toast = useDnaToast();
  const [action, setAction] = useState<DecisionAction>("APPROVE");
  const [rationale, setRationale] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setAction("APPROVE");
      setRationale("");
      setSubmitting(false);
    }
  }, [open, decisionId]);

  const submit = async () => {
    if (rationale.trim().length < 5) {
      toast.error("Rationale wajib diisi (min 5 karakter)");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/v1/decision/${encodeURIComponent(decisionId)}/resolve`, {
        action,
        rationale: rationale.trim(),
      });
      toast.success("Keputusan tersimpan", {
        description: `${ACTION_OPTIONS.find((o) => o.value === action)?.label} ${contextLabel ?? decisionId}`,
      });
      onResolved?.();
      onClose();
    } catch (e) {
      const err = extractApiError(e);
      toast.error("Gagal menyimpan keputusan", { description: `${err.code}: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  const impact = contextLabel
    ? `Dampak: ${entityType ? entityType + " — " : ""}${contextLabel}`
    : "Dampak tercatat di ActivityLog (audit trail).";

  return (
    <DnaDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DnaDialogContent className="sm:max-w-[440px]">
        <DnaDialogHeader>
          <DnaDialogTitle>Catat Keputusan</DnaDialogTitle>
          <DnaDialogDescription>
            {contextLabel ?? "Item keputusan"} — aksi akan dicatat ke ActivityLog.
          </DnaDialogDescription>
        </DnaDialogHeader>

        <div className="space-y-3 px-6 py-2">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
              Aksi
            </label>
            <DnaSelect
              value={action}
              onChange={(e) => setAction(e.target.value as DecisionAction)}
              disabled={submitting}
            >
              {ACTION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </DnaSelect>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
              Rationale
            </label>
            <DnaTextarea
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Alasan keputusan (min 5 karakter)"
              rows={3}
              disabled={submitting}
            />
          </div>

          <div className="text-[11px] text-slate-500 italic px-1">{impact}</div>
        </div>

        <DnaDialogFooter className="gap-2">
          <DnaDialogClose asChild>
            <DnaButton variant="outline" disabled={submitting}>
              Batal
            </DnaButton>
          </DnaDialogClose>
          <DnaButton onClick={submit} disabled={submitting}>
            {submitting ? "Menyimpan…" : "Simpan Keputusan"}
          </DnaButton>
        </DnaDialogFooter>
      </DnaDialogContent>
    </DnaDialog>
  );
}