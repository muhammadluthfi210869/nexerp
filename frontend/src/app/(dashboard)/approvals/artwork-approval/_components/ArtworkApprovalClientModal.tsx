import React from "react";
import { DnaModal, DnaTextarea, DnaButton } from "@/components/dna";
import { DecisionStatus, DesignTaskRow } from "../_types/artwork-approval.types";

interface ArtworkApprovalClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTask: DesignTaskRow | null;
  clientDecision: DecisionStatus;
  clientNotes: string;
  onNotesChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}

export function ArtworkApprovalClientModal({
  isOpen,
  onClose,
  selectedTask,
  clientDecision,
  clientNotes,
  onNotesChange,
  onSubmit,
  isPending,
}: ArtworkApprovalClientModalProps) {
  return (
    <DnaModal
      isOpen={isOpen && !!selectedTask}
      onClose={onClose}
      title={clientDecision === "APPROVED" ? "ACC Klien (Final Artwork)" : "Kembalikan untuk Revisi"}
      maxWidth="max-w-md"
    >
      <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
        <p className="text-muted-foreground">
          Task: <span className="font-bold text-foreground">{selectedTask?.brief}</span>
        </p>
        <div>
          <label className="text-xs font-bold text-foreground block mb-1">
            Catatan {clientDecision === "REJECTED" ? "(wajib)" : "(opsional)"}:
          </label>
          <DnaTextarea
            rows={3}
            value={clientNotes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Catatan persetujuan atau alasan revisi..."
          />
        </div>
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
          <DnaButton variant="secondary" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton
            variant={clientDecision === "APPROVED" ? "primary" : "danger"}
            type="submit"
            disabled={isPending}
          >
            {isPending ? "Menyimpan..." : "Simpan Keputusan"}
          </DnaButton>
        </div>
      </form>
    </DnaModal>
  );
}
