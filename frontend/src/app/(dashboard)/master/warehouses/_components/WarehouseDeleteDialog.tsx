"use client";

import React from "react";
import { DnaConfirmDialog } from "@/components/dna";
import type { MasterWarehouseItem } from "../_types/warehouse.types";

interface WarehouseDeleteDialogProps {
  warehouseToDelete: MasterWarehouseItem | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function WarehouseDeleteDialog({
  warehouseToDelete,
  onClose,
  onConfirm,
}: WarehouseDeleteDialogProps) {
  return (
    <DnaConfirmDialog
      isOpen={!!warehouseToDelete}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Hapus Fasilitas Gudang?"
      description={`Apakah Anda yakin ingin menghapus ${warehouseToDelete?.namaGudang}? Pastikan tidak ada stok aktif yang terpetakan ke gudang ini.`}
      confirmText="Hapus Permanen"
      variant="critical"
    />
  );
}
