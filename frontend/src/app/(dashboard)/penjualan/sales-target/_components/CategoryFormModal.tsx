"use client";

import React from "react";
import { DnaModal, DnaButton, DnaInput } from "@/components/dna";
import type { SalesCategoryItem } from "../_types/sales-target.types";
import type { useSalesTargetOperations } from "../_hooks/useSalesTargetOperations";

interface CategoryFormModalProps {
  ops?: ReturnType<typeof useSalesTargetOperations>;
  isOpen?: boolean;
  onClose?: () => void;
  editingCategory?: SalesCategoryItem | null;
  formCatName?: string;
  setFormCatName?: (value: string) => void;
  formCatDesc?: string;
  setFormCatDesc?: (value: string) => void;
  onSave?: () => void;
  isPending?: boolean;
}

export function CategoryFormModal(props: CategoryFormModalProps) {
  const isOpen = props.isOpen ?? props.ops?.isCategoryModalOpen ?? false;
  const onClose = props.onClose ?? (() => props.ops?.setIsCategoryModalOpen(false));
  const editingCategory = props.editingCategory !== undefined ? props.editingCategory : (props.ops?.editingCategory ?? null);
  const formCatName = props.formCatName ?? props.ops?.formCatName ?? "";
  const setFormCatName = props.setFormCatName ?? props.ops?.setFormCatName ?? (() => {});
  const formCatDesc = props.formCatDesc ?? props.ops?.formCatDesc ?? "";
  const setFormCatDesc = props.setFormCatDesc ?? props.ops?.setFormCatDesc ?? (() => {});
  const onSave = props.onSave ?? props.ops?.handleSaveCategory ?? (() => {});
  const isPending = props.isPending ?? props.ops?.saveCategoryMutation.isPending ?? false;

  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingCategory ? `Sunting Kategori: ${editingCategory.name}` : "Tambah Kategori Penjualan Baru"}
      subtitle="Definisikan kategori proyek penjualan untuk klasifikasi SPK dan pipeline alur produksi"
      size="md"
    >
      <div className="space-y-4 py-2 text-xs">
        <div>
          <label className="font-semibold text-slate-700 block mb-1">Nama Kategori Penjualan *</label>
          <DnaInput
            placeholder="e.g. Maklon Baru, Repeat Order, Jasa Maklon"
            value={formCatName}
            onChange={(e) => setFormCatName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">Deskripsi & Ruang Lingkup</label>
          <DnaInput
            placeholder="Penjelasan alur dan karakteristik kategori transaksi"
            value={formCatDesc}
            onChange={(e) => setFormCatDesc(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
          <DnaButton variant="secondary" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton
            variant="primary"
            onClick={onSave}
            disabled={isPending}
          >
            {isPending ? "Menyimpan..." : "Simpan Kategori"}
          </DnaButton>
        </div>
      </div>
    </DnaModal>
  );
}
