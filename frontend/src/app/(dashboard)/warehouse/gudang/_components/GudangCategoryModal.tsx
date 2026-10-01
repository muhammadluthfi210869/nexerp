"use client";

import React from "react";
import { DnaModal, DnaButton, DnaInput, DnaSelect } from "@/components/dna";
import type { CategoryFormData } from "../_types/gudang.types";

interface GudangCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: CategoryFormData;
  setForm: React.Dispatch<React.SetStateAction<CategoryFormData>>;
  onSave: () => void;
}

export function GudangCategoryModal({
  isOpen,
  onClose,
  form,
  setForm,
  onSave,
}: GudangCategoryModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Buat Kategori Barang & Mapping CoA (SCR-028)"
      description="Konfigurasi kategori produk maklon dengan integrasi akun buku besar akuntansi."
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <DnaButton variant="secondary" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton variant="primary" onClick={onSave}>
            Simpan Kategori
          </DnaButton>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-700 uppercase">Kode Kategori *</label>
            <DnaInput
              type="text"
              placeholder="Contoh: CAT-REAG"
              className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 tabular-nums text-zinc-800"
              value={form.code}
              onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-700 uppercase">Nama Kategori *</label>
            <DnaInput
              type="text"
              placeholder="Contoh: Reagen & Bahan Kimia Uji Lab"
              className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-zinc-800"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-zinc-700 uppercase">Deskripsi Kategori</label>
          <DnaInput
            type="text"
            placeholder="Keterangan kategori barang..."
            className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-zinc-800"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />
        </div>

        <div className="pt-2 border-t border-zinc-200 space-y-3">
          <h4 className="font-semibold uppercase tracking-wider text-zinc-700 text-[11px]">
            Pemetaan Akun Buku Besar (Chart of Accounts)
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-zinc-600">
                Akun Persediaan (Inventory Asset) *
              </label>
              <DnaSelect
                className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-zinc-800 tabular-nums"
                value={form.inventoryAccount}
                onChange={(value) => setForm((prev) => ({ ...prev, inventoryAccount: value }))}
              >
                <option value="110401">110401 - Persediaan Bahan Baku</option>
                <option value="110402">110402 - Persediaan Bahan Kemas</option>
                <option value="110404">110404 - Persediaan Produk Jadi</option>
                <option value="510201">510201 - Persediaan Reagen Lab & QC</option>
              </DnaSelect>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-zinc-600">
                Akun HPP (COGS Account) *
              </label>
              <DnaSelect
                className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-zinc-800 tabular-nums"
                value={form.cogsAccount}
                onChange={(value) => setForm((prev) => ({ ...prev, cogsAccount: value }))}
              >
                <option value="510101">510101 - HPP Bahan Baku</option>
                <option value="510102">510102 - HPP Bahan Kemas</option>
                <option value="510104">510104 - HPP Produk Jadi</option>
              </DnaSelect>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-zinc-600">
                Akun Penjualan (Revenue Account) *
              </label>
              <DnaSelect
                className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-zinc-800 tabular-nums"
                value={form.salesAccount}
                onChange={(value) => setForm((prev) => ({ ...prev, salesAccount: value }))}
              >
                <option value="410101">410101 - Pendapatan Penjualan Maklon</option>
                <option value="410102">410102 - Pendapatan Jasa Produksi</option>
              </DnaSelect>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-zinc-600">
                Akun Retur Penjualan *
              </label>
              <DnaSelect
                className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-zinc-800 tabular-nums"
                value={form.salesReturnAccount}
                onChange={(value) => setForm((prev) => ({ ...prev, salesReturnAccount: value }))}
              >
                <option value="410201">410201 - Retur Penjualan Maklon</option>
              </DnaSelect>
            </div>
          </div>
        </div>
      </div>
    </DnaModal>
  );
}
