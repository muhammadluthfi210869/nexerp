"use client";

import React from "react";
import { XCircle } from "lucide-react";
import { DnaButton, DnaInput, DnaModal } from "@/components/dna";

interface PurchaseApprovalRejectModalProps {
  isOpen: boolean;
  rejectReason: string;
  onRejectReasonChange: (val: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function PurchaseApprovalRejectModal({
  isOpen,
  rejectReason,
  onRejectReasonChange,
  onClose,
  onConfirm,
}: PurchaseApprovalRejectModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Konfirmasi Penolakan"
      subtitle="Beri alasan penolakan untuk dokumentasi audit."
      size="md"
      badge={<XCircle className="h-3 w-3 text-rose-500" />}
      footer={
        <>
          <DnaButton variant="ghost" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton variant="danger" onClick={onConfirm}>
            Ya, Tolak
          </DnaButton>
        </>
      }
    >
      <DnaInput
        label="Alasan Penolakan"
        value={rejectReason}
        onChange={(e) => onRejectReasonChange(e.target.value)}
        placeholder="Berikan alasan penolakan..."
      />
    </DnaModal>
  );
}
