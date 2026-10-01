"use client";

import React from "react";
import { CheckCircle2, Ban } from "lucide-react";
import { DnaModal, DnaButton, DnaTextarea } from "@/components/dna";
import { ApproveDialogState, RejectDialogState } from "../_types/purchasing.types";

interface PurchasingApprovalModalsProps {
  approveDialog: ApproveDialogState | null;
  onCloseApprove: () => void;
  onConfirmApprove: () => void;
  rejectDialog: RejectDialogState | null;
  rejectReason: string;
  setRejectReason: (reason: string) => void;
  onCloseReject: () => void;
  onConfirmReject: () => void;
}

export function PurchasingApprovalModals({
  approveDialog,
  onCloseApprove,
  onConfirmApprove,
  rejectDialog,
  rejectReason,
  setRejectReason,
  onCloseReject,
  onConfirmReject,
}: PurchasingApprovalModalsProps) {
  return (
    <>
      <DnaModal
        isOpen={!!approveDialog}
        onClose={onCloseApprove}
        title="Konfirmasi Persetujuan"
        subtitle={`Setujui ${
          approveDialog?.type === "PO" ? "Purchase Order" : "Purchase Request"
        } ini? Tindakan ini akan mengubah status menjadi APPROVED.`}
        size="md"
        badge={<CheckCircle2 className="h-3 w-3 text-emerald-500" />}
        footer={
          <>
            <DnaButton variant="ghost" onClick={onCloseApprove}>
              Batal
            </DnaButton>
            <DnaButton
              variant="primary"
              onClick={onConfirmApprove}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Ya, Setujui
            </DnaButton>
          </>
        }
      />

      <DnaModal
        isOpen={!!rejectDialog}
        onClose={onCloseReject}
        title="Konfirmasi Penolakan"
        subtitle={`Tolak ${
          rejectDialog?.type === "PO" ? "Purchase Order" : "Purchase Request"
        } ini. Berikan alasan penolakan.`}
        size="md"
        badge={<Ban className="h-3 w-3 text-rose-500" />}
        footer={
          <>
            <DnaButton variant="ghost" onClick={onCloseReject}>
              Batal
            </DnaButton>
            <DnaButton
              variant="danger"
              onClick={onConfirmReject}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Ya, Tolak
            </DnaButton>
          </>
        }
      >
        <DnaTextarea
          label="Alasan Penolakan"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Alasan mengapa ditolak..."
          rows={3}
        />
      </DnaModal>
    </>
  );
}
