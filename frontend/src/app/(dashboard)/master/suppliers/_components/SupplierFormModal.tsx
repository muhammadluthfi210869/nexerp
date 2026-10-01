"use client";

import React from "react";
import {
  DnaModal,
  DnaInput,
  DnaSelect,
  DnaTextarea,
  DnaButton,
} from "@/components/dna";
import type {
  MasterSupplierItem,
  KategoriSupplierItem,
  SupplierFormData,
} from "../_types/supplier.types";

interface SupplierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingSupplier: MasterSupplierItem | null;
  supplierForm: SupplierFormData;
  setSupplierForm: React.Dispatch<React.SetStateAction<SupplierFormData>>;
  categoriesList: KategoriSupplierItem[];
  isPending: boolean;
  onSave: () => void;
}

export function SupplierFormModal({
  isOpen,
  onClose,
  editingSupplier,
  supplierForm,
  setSupplierForm,
  categoriesList,
  isPending,
  onSave,
}: SupplierFormModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingSupplier ? `Sunting Vendor: ${editingSupplier.nama}` : "Tambah Supplier Baru"}
      description="Lengkapi profil rekanan, syarat pembayaran (TOP), perbankan, dan data perpajakan"
      size="lg"
    >
      <div className="space-y-4 py-2 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Kode Vendor (Auto)</label>
            <DnaInput
              value={supplierForm.vendorCode || "AUTO"}
              readOnly
              className="bg-zinc-100 text-zinc-600 font-mono cursor-not-allowed"
              placeholder="VND-AUTO"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Nama Perusahaan / Supplier *</label>
            <DnaInput
              value={supplierForm.nama}
              onChange={(e) => setSupplierForm({ ...supplierForm, nama: e.target.value })}
              placeholder="e.g. PT Sumber Kimia Farma"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DnaInput
            label="Nama PIC / Kontak Person *"
            value={supplierForm.pic}
            onChange={(e) => setSupplierForm({ ...supplierForm, pic: e.target.value })}
            placeholder="e.g. Ibu Wenny"
          />
          <DnaInput
            label="Nomor Telepon / WhatsApp *"
            value={supplierForm.phone}
            onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
            placeholder="082244023077"
          />
          <DnaInput
            label="Email Resmi (Opsional)"
            value={supplierForm.email}
            onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
            placeholder="sales@vendor.com"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DnaSelect
            label="Kategori Pengadaan (Master Kategori) *"
            value={
              supplierForm.categoryId ||
              categoriesList.find((c) => c.kategori === supplierForm.kategoriBahan)?.id ||
              ""
            }
            onChange={(val) => {
              const selectedCat = categoriesList.find((c) => c.id === val);
              setSupplierForm({
                ...supplierForm,
                categoryId: val,
                kategoriBahan: selectedCat ? selectedCat.kategori : supplierForm.kategoriBahan,
              });
            }}
            options={
              categoriesList.length > 0
                ? categoriesList.map((c) => ({ value: c.id, label: `${c.kode} - ${c.kategori}` }))
                : [
                    { value: "Bahan Baku", label: "Bahan Baku" },
                    { value: "Kemasan Primer", label: "Kemasan Primer" },
                    { value: "Kemasan Sekunder", label: "Kemasan Sekunder" },
                    { value: "Bahan Pembantu", label: "Bahan Pembantu" },
                  ]
            }
          />
          <DnaSelect
            label="Tarif Pajak PPN (%) *"
            value={String(supplierForm.pajakPersen)}
            onChange={(val) =>
              setSupplierForm({
                ...supplierForm,
                pajakPersen: Number(val),
                isPkp: Number(val) > 0,
              })
            }
            options={[
              { value: "11", label: "PPN 11% (Standar PKP)" },
              { value: "12", label: "PPN 12% (Tarif Baru)" },
              { value: "0", label: "0% (Non-PKP / Bebas Pajak)" },
            ]}
          />
          <DnaInput
            label="NPWP Vendor"
            value={supplierForm.npwp}
            onChange={(e) => setSupplierForm({ ...supplierForm, npwp: e.target.value })}
            placeholder="01.234.567.8-012.000"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DnaSelect
            label="Term of Payment (TOP) *"
            value={supplierForm.paymentTerm}
            onChange={(val) => setSupplierForm({ ...supplierForm, paymentTerm: val })}
            options={[
              { value: "Cash", label: "Cash Before Delivery" },
              { value: "Net 14", label: "Net 14 Hari" },
              { value: "Net 30", label: "Net 30 Hari" },
              { value: "Net 45", label: "Net 45 Hari" },
              { value: "Net 60", label: "Net 60 Hari" },
            ]}
          />
          <DnaInput
            label="Rekening Bank Vendor *"
            value={supplierForm.bankAccount}
            onChange={(e) => setSupplierForm({ ...supplierForm, bankAccount: e.target.value })}
            placeholder="BCA 088-123-456 a/n PT DKSH"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DnaInput
            label="Provinsi *"
            value={supplierForm.provinsi}
            onChange={(e) => setSupplierForm({ ...supplierForm, provinsi: e.target.value })}
            placeholder="Jawa Timur"
          />
          <DnaInput
            label="Kota / Kabupaten *"
            value={supplierForm.kota}
            onChange={(e) => setSupplierForm({ ...supplierForm, kota: e.target.value })}
            placeholder="Kota Surabaya"
          />
        </div>

        <DnaTextarea
          label="Alamat Lengkap Kantor / Gudang Supplier *"
          value={supplierForm.alamatLengkap}
          onChange={(e) => setSupplierForm({ ...supplierForm, alamatLengkap: e.target.value })}
          placeholder="Jalan, gedung, kawasan industri, kode pos..."
        />

        <DnaTextarea
          label="Deskripsi / Catatan Supplier"
          value={supplierForm.description}
          onChange={(e) => setSupplierForm({ ...supplierForm, description: e.target.value })}
          placeholder="Catatan keandalan vendor, spesifikasi pengiriman, PIC alternatif..."
        />

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <DnaButton variant="ghost" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton variant="primary" loading={isPending} onClick={onSave}>
            Simpan Data Supplier
          </DnaButton>
        </div>
      </div>
    </DnaModal>
  );
}
