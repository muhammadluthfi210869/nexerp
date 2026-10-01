"use client";

import React from "react";
import { DnaConfirmDialog } from "@/components/dna";
import { AccountModel } from "../_types/coa.types";

interface CoaDeleteConfirmDialogProps {
  accountToDelete: AccountModel | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function CoaDeleteConfirmDialog({
  accountToDelete,
  onClose,
  onConfirm,
  isDeleting = false,
}: CoaDeleteConfirmDialogProps) {
  return (
    <DnaConfirmDialog
      isOpen={!!accountToDelete}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Hapus Akun Rekening?"
      description={`Apakah Anda yakin ingin menghapus akun ${accountToDelete?.code} - ${accountToDelete?.name}? Tindakan ini tidak dapat dibatalkan.`}
      confirmText="Hapus Akun"
      variant="danger"
      isProcessing={isDeleting}
    />
  );
}
