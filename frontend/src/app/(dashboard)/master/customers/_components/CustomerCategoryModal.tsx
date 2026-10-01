"use client";

import React from "react";
import { DnaModal, DnaInput, DnaTextarea, DnaButton } from "@/components/dna";
import type { CustomerCategoryItem, CustomerCategoryFormData } from "../_types/customer.types";

interface CustomerCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCategory: CustomerCategoryItem | null;
  categoryForm: CustomerCategoryFormData;
  setCategoryForm: React.Dispatch<React.SetStateAction<CustomerCategoryFormData>>;
  onSaveCategory: () => void;
  isPending: boolean;
}

export function CustomerCategoryModal({
  isOpen,
  onClose,
  editingCategory,
  categoryForm,
  setCategoryForm,
  onSaveCategory,
  isPending,
}: CustomerCategoryModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingCategory ? "Sunting Kategori Pelanggan" : "Tambah Kategori Pelanggan"}
      description="Definisikan klasifikasi segmen pelanggan (Calon Pelanggan, Sample, RO, dll)"
      size="md"
    >
      <div className="space-y-4 py-2 text-xs">
        <DnaInput
          label="Kode Kategori *"
          value={categoryForm.code}
          onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value })}
          placeholder="e.g. CUST-RO"
        />
        <DnaInput
          label="Nama Kategori *"
          value={categoryForm.name}
          onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
          placeholder="e.g. Pelanggan Repeat Order"
        />
        <DnaTextarea
          label="Deskripsi Kriteria Kategori"
          value={categoryForm.description}
          onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
          placeholder="Deskripsikan kriteria segmen mitra ini..."
        />
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <DnaButton variant="ghost" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton
            variant="primary"
            onClick={onSaveCategory}
            loading={isPending}
          >
            Simpan Kategori
          </DnaButton>
        </div>
      </div>
    </DnaModal>
  );
}
