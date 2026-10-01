"use client";

import React from "react";
import {
  DnaModal,
  DnaInput,
  DnaTextarea,
  DnaButton,
  useDnaToast,
} from "@/components/dna";
import type { KategoriBarangItem, CategoryFormData } from "../_types/goods.types";

interface GoodsCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCategory: KategoriBarangItem | null;
  categoryForm: CategoryFormData;
  setCategoryForm: React.Dispatch<React.SetStateAction<CategoryFormData>>;
  isPending: boolean;
  onSave: () => void;
}

export function GoodsCategoryModal({
  isOpen,
  onClose,
  editingCategory,
  categoryForm,
  setCategoryForm,
  isPending,
  onSave,
}: GoodsCategoryModalProps) {
  const toast = useDnaToast();

  const handleValidateAndSave = () => {
    if (!categoryForm.name.trim()) {
      toast.error("Nama kategori wajib diisi!");
      return;
    }
    onSave();
  };

  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingCategory ? "Sunting Kategori Barang" : "Tambah Kategori Barang"}
      description="Klasifikasi jenis persediaan bahan baku, kemasan, atau barang jadi"
      size="md"
    >
      <div className="space-y-4 py-2 text-xs">
        <DnaInput
          label="Kode Kategori *"
          value={categoryForm.code}
          onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value })}
          placeholder="e.g. CAT-BBK"
        />
        <DnaInput
          label="Nama Kategori *"
          value={categoryForm.name}
          onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
          placeholder="e.g. Bahan Baku Aktif"
        />
        <DnaTextarea
          label="Deskripsi Kategori"
          value={categoryForm.description}
          onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
          placeholder="Deskripsi jenis barang dalam kelompok ini..."
        />
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <DnaButton variant="ghost" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton
            variant="primary"
            onClick={handleValidateAndSave}
            loading={isPending}
          >
            Simpan Kategori
          </DnaButton>
        </div>
      </div>
    </DnaModal>
  );
}
