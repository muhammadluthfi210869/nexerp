import React from "react";
import { DnaModal, DnaInput, DnaTextarea, DnaButton } from "@/components/dna";
import { DecisionStatus, DesignTaskRow } from "../_types/artwork-approval.types";

interface ArtworkApprovalApjModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTask: DesignTaskRow | null;
  apjDecision: DecisionStatus;
  apjPin: string;
  onPinChange: (value: string) => void;
  apjNotes: string;
  onNotesChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}

export function ArtworkApprovalApjModal({
  isOpen,
  onClose,
  selectedTask,
  apjDecision,
  apjPin,
  onPinChange,
  apjNotes,
  onNotesChange,
  onSubmit,
  isPending,
}: ArtworkApprovalApjModalProps) {
  return (
    <DnaModal
      isOpen={isOpen && !!selectedTask}
      onClose={onClose}
      title={apjDecision === "APPROVED" ? "ACC Review APJ / Legal" : "Tolak Review APJ / Legal"}
      maxWidth="max-w-md"
    >
      <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
        <p className="text-muted-foreground">
          Task: <span className="font-bold text-foreground">{selectedTask?.brief}</span>
        </p>
        <div>
          <label className="text-xs font-bold text-foreground block mb-1">PIN Approval (E-Signature):</label>
          <DnaInput
            type="password"
            value={apjPin}
            onChange={(e) => onPinChange(e.target.value)}
            placeholder="Masukkan PIN approval Anda"
            required
          />
        </div>
        <div>
          <label className="text-xs font-bold text-foreground block mb-1">Catatan Review:</label>
          <DnaTextarea
            rows={3}
            value={apjNotes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Catatan validasi klaim / regulasi..."
          />
        </div>
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
          <DnaButton variant="secondary" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton
            variant={apjDecision === "APPROVED" ? "primary" : "danger"}
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
