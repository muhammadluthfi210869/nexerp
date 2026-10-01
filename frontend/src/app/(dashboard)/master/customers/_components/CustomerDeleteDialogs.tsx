"use client";

import React from "react";
import { DnaConfirmDialog } from "@/components/dna";
import type { MasterCustomerItem, CustomerCategoryItem } from "../_types/customer.types";

interface CustomerDeleteDialogsProps {
  customerToDelete: MasterCustomerItem | null;
  onCloseDeleteCustomer: () => void;
  onConfirmDeleteCustomer: (id: string) => void;
  categoryToDelete: CustomerCategoryItem | null;
  onCloseDeleteCategory: () => void;
  onConfirmDeleteCategory: (id: string) => void;
}

export function CustomerDeleteDialogs({
  customerToDelete,
  onCloseDeleteCustomer,
  onConfirmDeleteCustomer,
  categoryToDelete,
  onCloseDeleteCategory,
  onConfirmDeleteCategory,
}: CustomerDeleteDialogsProps) {
  return (
    <>
      {/* Confirmation Dialog Delete Customer */}
      <DnaConfirmDialog
        isOpen={!!customerToDelete}
        onClose={onCloseDeleteCustomer}
        onConfirm={() => {
          if (customerToDelete) onConfirmDeleteCustomer(customerToDelete.id);
        }}
        title="Hapus Data Pelanggan?"
        description={`Apakah Anda yakin ingin menghapus data mitra ${customerToDelete?.brandName} (${customerToDelete?.nama})?`}
        confirmText="Hapus Permanen"
        variant="critical"
      />

      {/* Confirmation Dialog Delete Category */}
      <DnaConfirmDialog
        isOpen={!!categoryToDelete}
        onClose={onCloseDeleteCategory}
        onConfirm={() => {
          if (categoryToDelete) onConfirmDeleteCategory(categoryToDelete.id);
        }}
        title="Hapus Kategori Pelanggan?"
        description={`Apakah Anda yakin ingin menghapus kategori "${categoryToDelete?.name}"?`}
        confirmText="Hapus Permanen"
        variant="critical"
      />
    </>
  );
}
