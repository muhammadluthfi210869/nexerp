"use client";

import React from "react";
import { DnaConfirmDialog } from "@/components/dna";
import type { SalesTargetItem, SalesCategoryItem } from "../_types/sales-target.types";
import { MONTHS_ID } from "../_types/sales-target.types";
import type { useSalesTargetOperations } from "../_hooks/useSalesTargetOperations";

interface TargetDeleteDialogsProps {
  ops?: ReturnType<typeof useSalesTargetOperations>;
  targetToDelete?: SalesTargetItem | null;
  onCloseDeleteTarget?: () => void;
  onConfirmDeleteTarget?: () => void;
  categoryToDelete?: SalesCategoryItem | null;
  onCloseDeleteCategory?: () => void;
  onConfirmDeleteCategory?: () => void;
}

export function TargetDeleteDialogs(props: TargetDeleteDialogsProps) {
  const targetToDelete = props.targetToDelete !== undefined ? props.targetToDelete : (props.ops?.targetToDelete ?? null);
  const onCloseDeleteTarget = props.onCloseDeleteTarget ?? (() => props.ops?.setTargetToDelete(null));
  const onConfirmDeleteTarget = props.onConfirmDeleteTarget ?? props.ops?.handleConfirmDeleteTarget ?? (() => {});
  const categoryToDelete = props.categoryToDelete !== undefined ? props.categoryToDelete : (props.ops?.categoryToDelete ?? null);
  const onCloseDeleteCategory = props.onCloseDeleteCategory ?? (() => props.ops?.setCategoryToDelete(null));
  const onConfirmDeleteCategory = props.onConfirmDeleteCategory ?? props.ops?.handleConfirmDeleteCategory ?? (() => {});

  return (
    <>
      {/* â”€â”€ CONFIRM DELETE DIALOG: TARGET â”€â”€ */}
      <DnaConfirmDialog
        isOpen={!!targetToDelete}
        onClose={onCloseDeleteTarget}
        onConfirm={onConfirmDeleteTarget}
        title="Hapus Target Penjualan?"
        description={`Apakah Anda yakin ingin menghapus alokasi target omzet untuk ${targetToDelete?.marketingName} pada periode ${targetToDelete ? MONTHS_ID[targetToDelete.month - 1] : ""} ${targetToDelete?.year}?`}
        confirmText="Hapus Target"
        variant="critical"
      />

      {/* â”€â”€ CONFIRM DELETE DIALOG: KATEGORI â”€â”€ */}
      <DnaConfirmDialog
        isOpen={!!categoryToDelete}
        onClose={onCloseDeleteCategory}
        onConfirm={onConfirmDeleteCategory}
        title="Hapus Kategori Penjualan?"
        description={`Apakah Anda yakin ingin menghapus kategori '${categoryToDelete?.name}'?`}
        confirmText="Hapus Kategori"
        variant="critical"
      />
    </>
  );
}
