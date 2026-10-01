import React from "react";
import { DnaConfirmDialog } from "@/components/dna";
import { CoaAutoRule } from "../_types/coa-auto.types";

interface CoaAutoDeleteConfirmDialogProps {
  ruleToDelete: CoaAutoRule | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function CoaAutoDeleteConfirmDialog({
  ruleToDelete,
  onClose,
  onConfirm,
  isDeleting,
}: CoaAutoDeleteConfirmDialogProps) {
  return (
    <DnaConfirmDialog
      isOpen={!!ruleToDelete}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Hapus Aturan Jurnal Otomatis?"
      description={`Apakah Anda yakin ingin menghapus konfigurasi aturan untuk '${ruleToDelete?.transactionType}'? Transaksi jenis ini tidak akan lagi otomatis terposting ke GL.`}
      confirmText={isDeleting ? "Menghapus..." : "Hapus Aturan"}
      variant="critical"
    />
  );
}
