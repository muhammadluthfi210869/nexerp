"use client";

import React from "react";
import { Boxes } from "lucide-react";
import {
  DnaModal,
  DnaInput,
  DnaCurrencyInput,
  DnaNumberInput,
  DnaSelect,
  DnaTextarea,
  DnaButton,
} from "@/components/dna";
import type {
  MasterBarangItem,
  KategoriBarangItem,
  AccountOptionItem,
  BarangFormData,
} from "../_types/goods.types";

interface GoodsFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingBarang: MasterBarangItem | null;
  barangForm: BarangFormData;
  setBarangForm: React.Dispatch<React.SetStateAction<BarangFormData>>;
  categoriesList: KategoriBarangItem[];
  accountsList: AccountOptionItem[];
  isPending: boolean;
  onSave: () => void;
}

export function GoodsFormModal({
  isOpen,
  onClose,
  editingBarang,
  barangForm,
  setBarangForm,
  categoriesList,
  accountsList,
  isPending,
  onSave,
}: GoodsFormModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingBarang ? `Sunting Barang: ${editingBarang.nama}` : "Buat Master Barang Baru"}
      description="Lengkapi kode SKU, harga beli pokok, satuan, dan pemetaan otomatis 8 Akun CoA"
      size="lg"
    >
      <div className="space-y-4 py-2 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Kode Unik Barang / SKU (Auto)</label>
            <DnaInput
              value={barangForm.kode || "AUTO"}
              readOnly
              className="bg-zinc-100 text-zinc-600 font-mono cursor-not-allowed"
              placeholder="SKU-AUTO"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Nama Barang *</label>
            <DnaInput
              value={barangForm.nama}
              onChange={(e) => setBarangForm({ ...barangForm, nama: e.target.value })}
              placeholder="e.g. Niacinamide 99% USP Grade"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DnaSelect
            label="Kategori Barang *"
            value={barangForm.categoryId}
            onChange={(val) => {
              const found = categoriesList.find((c) => c.id === val || c.name === val);
              setBarangForm({
                ...barangForm,
                categoryId: found ? found.id : val,
                kategori: found ? found.name : val,
              });
            }}
            options={categoriesList.map((c) => ({ value: c.id, label: c.name }))}
          />
          <DnaInput
            label="Sub Kategori"
            value={barangForm.subKategori}
            onChange={(e) => setBarangForm({ ...barangForm, subKategori: e.target.value })}
            placeholder="Active, Base, Tube..."
          />
          <DnaSelect
            label="Satuan *"
            value={barangForm.satuan}
            onChange={(val) => setBarangForm({ ...barangForm, satuan: val })}
            options={[
              { value: "pcs", label: "pcs (Pieces)" },
              { value: "gr", label: "gr (Gram)" },
              { value: "kg", label: "kg (Kilogram)" },
              { value: "ml", label: "ml (Mililiter)" },
              { value: "liter", label: "liter (Liter)" },
              { value: "botol", label: "botol (Botol)" },
              { value: "jar", label: "jar (Pot / Jar)" },
              { value: "box", label: "box (Box / Karton)" },
              { value: "drum", label: "drum (Drum)" },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DnaCurrencyInput
            label="Harga Beli Standar (Rp) *"
            value={barangForm.hargaBeli}
            onChange={(val) => setBarangForm({ ...barangForm, hargaBeli: val })}
          />
          <DnaNumberInput
            label="Stok Terendah (ROP Alert / lowest_stock) *"
            value={barangForm.stokMin}
            onChange={(val: number) => setBarangForm({ ...barangForm, stokMin: val })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DnaInput
            label="URL Foto Barang"
            value={barangForm.imageUrl}
            onChange={(e) => setBarangForm({ ...barangForm, imageUrl: e.target.value })}
            placeholder="https://... atau upload foto"
          />
          <DnaTextarea
            label="Deskripsi Barang"
            value={barangForm.description}
            onChange={(e) => setBarangForm({ ...barangForm, description: e.target.value })}
            placeholder="Keterangan spesifikasi kimia, fisik, atau cara pakai..."
          />
        </div>

        {/* CoA 8 Akun Pemetaan */}
        <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
          <div className="font-bold text-zinc-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <Boxes className="w-4 h-4 text-zinc-900" />
            Pemetaan Otomatis 8 Akun Chart of Accounts (CoA)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <DnaSelect
              label="coa_1: Akun Persediaan *"
              value={barangForm.coa_1}
              onChange={(val) => setBarangForm({ ...barangForm, coa_1: val })}
              options={accountsList.map((a) => ({ value: a.id, label: a.label }))}
            />
            <DnaSelect
              label="coa_2: Akun Penjualan *"
              value={barangForm.coa_2}
              onChange={(val) => setBarangForm({ ...barangForm, coa_2: val })}
              options={accountsList.map((a) => ({ value: a.id, label: a.label }))}
            />
            <DnaSelect
              label="coa_3: Akun Retur Penjualan"
              value={barangForm.coa_3}
              onChange={(val) => setBarangForm({ ...barangForm, coa_3: val })}
              options={accountsList.map((a) => ({ value: a.id, label: a.label }))}
            />
            <DnaSelect
              label="coa_4: Akun Diskon Penjualan"
              value={barangForm.coa_4}
              onChange={(val) => setBarangForm({ ...barangForm, coa_4: val })}
              options={accountsList.map((a) => ({ value: a.id, label: a.label }))}
            />
            <DnaSelect
              label="coa_5: Persediaan (Dalam Perjalanan)"
              value={barangForm.coa_5}
              onChange={(val) => setBarangForm({ ...barangForm, coa_5: val })}
              options={accountsList.map((a) => ({ value: a.id, label: a.label }))}
            />
            <DnaSelect
              label="coa_6: Akun COGS / Beban Pokok *"
              value={barangForm.coa_6}
              onChange={(val) => setBarangForm({ ...barangForm, coa_6: val })}
              options={accountsList.map((a) => ({ value: a.id, label: a.label }))}
            />
            <DnaSelect
              label="coa_7: Akun Retur Pembelian"
              value={barangForm.coa_7}
              onChange={(val) => setBarangForm({ ...barangForm, coa_7: val })}
              options={accountsList.map((a) => ({ value: a.id, label: a.label }))}
            />
            <DnaSelect
              label="coa_8: Akun Barang Belum Faktur"
              value={barangForm.coa_8}
              onChange={(val) => setBarangForm({ ...barangForm, coa_8: val })}
              options={accountsList.map((a) => ({ value: a.id, label: a.label }))}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <DnaButton variant="ghost" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton
            variant="primary"
            onClick={onSave}
            loading={isPending}
          >
            Simpan Data Barang
          </DnaButton>
        </div>
      </div>
    </DnaModal>
  );
}
