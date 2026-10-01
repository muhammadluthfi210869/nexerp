"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";
import { DnaButton, DnaModal } from "@/components/dna";

interface PurchaseApprovalApproveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function PurchaseApprovalApproveModal({
  isOpen,
  onClose,
  onConfirm,
}: PurchaseApprovalApproveModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Konfirmasi Persetujuan"
      subtitle="Setujui PO ini? Status akan berubah menjadi APPROVED."
      size="md"
      badge={<CheckCircle2 className="h-3 w-3 text-emerald-500" />}
      footer={
        <>
          <DnaButton variant="ghost" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton
            variant="primary"
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={onConfirm}
          >
            Ya, Setujui
          </DnaButton>
        </>
      }
    />
  );
}
