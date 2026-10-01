"use client";

import React from "react";
import { DnaConfirmDialog } from "@/components/dna";
import type { MasterBarangItem, KategoriBarangItem } from "../_types/goods.types";

interface GoodsDeleteDialogsProps {
  barangToDelete: MasterBarangItem | null;
  onCloseBarangDelete: () => void;
  onConfirmBarangDelete: () => void;
  categoryToDelete: KategoriBarangItem | null;
  onCloseCategoryDelete: () => void;
  onConfirmCategoryDelete: () => void;
}

export function GoodsDeleteDialogs({
  barangToDelete,
  onCloseBarangDelete,
  onConfirmBarangDelete,
  categoryToDelete,
  onCloseCategoryDelete,
  onConfirmCategoryDelete,
}: GoodsDeleteDialogsProps) {
  return (
    <>
      {/* Delete Confirmation Dialog */}
      <DnaConfirmDialog
        isOpen={!!barangToDelete}
        onClose={onCloseBarangDelete}
        onConfirm={onConfirmBarangDelete}
        title="Hapus Data Barang?"
        description={`Apakah Anda yakin ingin menghapus data barang ${barangToDelete?.nama} (${barangToDelete?.kode})?`}
        confirmText="Hapus Permanen"
        variant="critical"
      />

      {/* Delete Category Confirmation Dialog */}
      <DnaConfirmDialog
        isOpen={!!categoryToDelete}
        onClose={onCloseCategoryDelete}
        onConfirm={onConfirmCategoryDelete}
        title="Hapus Kategori Barang?"
        description={`Apakah Anda yakin ingin menghapus kategori ${categoryToDelete?.name}?`}
        confirmText="Hapus Permanen"
        variant="critical"
      />
    </>
  );
}
