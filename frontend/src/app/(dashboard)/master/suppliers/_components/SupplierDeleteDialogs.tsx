"use client";

import React from "react";
import { DnaConfirmDialog } from "@/components/dna";
import type { MasterSupplierItem } from "../_types/supplier.types";

interface SupplierDeleteDialogsProps {
  supplierToDelete: MasterSupplierItem | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function SupplierDeleteDialogs({
  supplierToDelete,
  onClose,
  onConfirm,
}: SupplierDeleteDialogsProps) {
  return (
    <DnaConfirmDialog
      isOpen={!!supplierToDelete}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Hapus Rekanan Supplier?"
      description={`Apakah Anda yakin ingin menghapus data supplier ${supplierToDelete?.nama}? Data transaksi pengadaan historis mungkin terdampak.`}
      confirmText="Hapus Permanen"
      variant="critical"
    />
  );
}
