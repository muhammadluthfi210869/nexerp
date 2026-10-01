"use client";

import React from "react";
import { DnaModal, DnaButton } from "@/components/dna";
import {
  NpfSampleRow,
  FeedbackDecision,
  STAGE_LABEL,
  DECISION_STAGE,
} from "../_types/npf.types";

interface NpfFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNpf: NpfSampleRow | null;
  decision: FeedbackDecision;
  onDecisionChange: (decision: FeedbackDecision) => void;
  feedbackNotes: string;
  onFeedbackNotesChange: (notes: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function NpfFeedbackModal({
  isOpen,
  onClose,
  selectedNpf,
  decision,
  onDecisionChange,
  feedbackNotes,
  onFeedbackNotesChange,
  onSubmit,
  isLoading,
}: NpfFeedbackModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Input Feedback & Keputusan Sample Klien"
      description="Pencatatan respon klien setelah menguji sample kosmetik di lapangan."
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <DnaButton variant="secondary" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton
            variant="primary"
            onClick={onSubmit}
            disabled={selectedNpf?.stage !== DECISION_STAGE}
            loading={isLoading}
          >
            Simpan Keputusan
          </DnaButton>
        </div>
      }
    >
      {selectedNpf && (
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="font-bold text-slate-900">{selectedNpf.productName}</p>
            <p className="text-slate-500">
              {selectedNpf.clientName} ({selectedNpf.brandName}) â€¢ {selectedNpf.currentRevision}
            </p>
          </div>

          {selectedNpf.stage !== DECISION_STAGE && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
              Keputusan klien hanya dapat dicatat saat sample berada di tahap{" "}
              <strong>{STAGE_LABEL[DECISION_STAGE]}</strong>. Tahap saat ini:{" "}
              <strong>{selectedNpf.stageLabel}</strong>.
            </div>
          )}

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase">Keputusan Klien *</label>
            <select
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold text-slate-800"
              value={decision}
              onChange={(e) => onDecisionChange(e.target.value as FeedbackDecision)}
              disabled={selectedNpf.stage !== DECISION_STAGE}
            >
              <option value="APPROVED">âœ… Sample Disetujui (Approved Deal - Siap Produksi)</option>
              <option value="REJECTED">ðŸ”„ Sample Ditolak (Perlu Revisi Formula)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase">Rincian Feedback / Catatan Revisi</label>
            <textarea
              rows={3}
              placeholder="Berikan catatan detail terkait tekstur, aroma, warna, rasa di kulit, atau request perubahan..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
              value={feedbackNotes}
              onChange={(e) => onFeedbackNotesChange(e.target.value)}
              disabled={selectedNpf.stage !== DECISION_STAGE}
            />
          </div>
        </div>
      )}
    </DnaModal>
  );
}
