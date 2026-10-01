"use client";

import React from "react";
import {
  DnaModal,
  DnaInput,
  DnaTextarea,
  DnaButton,
  useDnaToast,
} from "@/components/dna";
import type {
  KategoriSupplierItem,
  SupplierCategoryFormData,
} from "../_types/supplier.types";

interface SupplierCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCategory: KategoriSupplierItem | null;
  categoryForm: SupplierCategoryFormData;
  setCategoryForm: React.Dispatch<React.SetStateAction<SupplierCategoryFormData>>;
  isPending: boolean;
  onSave: () => void;
}

export function SupplierCategoryModal({
  isOpen,
  onClose,
  editingCategory,
  categoryForm,
  setCategoryForm,
  isPending,
  onSave,
}: SupplierCategoryModalProps) {
  const toast = useDnaToast();

  const handleValidateAndSave = () => {
    if (!categoryForm.kategori.trim()) {
      toast.error("Nama kategori wajib diisi!");
      return;
    }
    onSave();
  };

  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        editingCategory
          ? `Sunting Kategori: ${editingCategory.kategori}`
          : "Tambah Kategori Supplier Baru"
      }
      description="Kelola kategori pengadaan supplier yang tersinkronisasi langsung ke database PostgreSQL"
      size="md"
    >
      <div className="space-y-4 py-2 text-xs">
        <DnaInput
          label="Kode Prefix Kategori *"
          value={categoryForm.kode}
          onChange={(e) => setCategoryForm({ ...categoryForm, kode: e.target.value })}
          placeholder="e.g. SUP-BBK"
        />
        <DnaInput
          label="Nama Kategori Pengadaan *"
          value={categoryForm.kategori}
          onChange={(e) => setCategoryForm({ ...categoryForm, kategori: e.target.value })}
          placeholder="e.g. Bahan Baku"
        />
        <DnaTextarea
          label="Deskripsi & Ruang Lingkup"
          value={categoryForm.deskripsi}
          onChange={(e) => setCategoryForm({ ...categoryForm, deskripsi: e.target.value })}
          placeholder="Deskripsi jenis barang dan jasa yang dipasok oleh rekanan kategori ini..."
        />
        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <DnaButton variant="ghost" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton
            variant="primary"
            loading={isPending}
            onClick={handleValidateAndSave}
          >
            Simpan Kategori
          </DnaButton>
        </div>
      </div>
    </DnaModal>
  );
}
