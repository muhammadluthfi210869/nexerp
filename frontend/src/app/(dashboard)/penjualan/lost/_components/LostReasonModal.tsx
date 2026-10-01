import React from "react";
import { DnaModal, DnaButton, DnaCell } from "@/components/dna";
import { LostProspectItem, REASON_LABELS } from "../_types/lost.types";

export interface LostReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  prospect: LostProspectItem | null;
}

export function LostReasonModal({
  isOpen,
  onClose,
  prospect,
}: LostReasonModalProps) {
  if (!prospect) return null;

  const reason = REASON_LABELS[prospect.lostReason] || {
    label: prospect.lostReason,
    status: "neutral" as const,
  };

  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Alasan Pembatalan: ${prospect.brandName}`}
    >
      <div className="space-y-4 text-xs">
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Klien</span>
            <p className="font-semibold text-slate-800">{prospect.clientName}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block text-right">Kategori</span>
            <DnaCell.Badge label={reason.label} status={reason.status} />
          </div>
        </div>

        {prospect.lostNotes && (
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Catatan Evaluasi BusDev
            </span>
            <p className="p-3 bg-rose-50/60 rounded-xl border border-rose-200/60 text-slate-800 leading-relaxed">
              {prospect.lostNotes}
            </p>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <DnaButton variant="secondary" onClick={onClose}>
            Tutup
          </DnaButton>
        </div>
      </div>
    </DnaModal>
  );
}
