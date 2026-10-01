"use client";

import React from "react";
import {
  DnaModal,
  DnaButton,
  CustomerSelect,
} from "@/components/dna";
import { CreateNpfForm } from "../_types/npf.types";

interface NpfFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: CreateNpfForm;
  setForm: React.Dispatch<React.SetStateAction<CreateNpfForm>>;
  onSubmit: () => void;
  isLoading: boolean;
}

export function NpfFormModal({
  isOpen,
  onClose,
  form,
  setForm,
  onSubmit,
  isLoading,
}: NpfFormModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Buat Dokumen NPF Baru (SCR-123)"
      description="Formulir intake spesifikasi dan acuan produk maklon kosmetik baru."
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <DnaButton variant="secondary" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton variant="primary" onClick={onSubmit} loading={isLoading}>
            Simpan & Daftarkan NPF
          </DnaButton>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        <div className="space-y-1.5">
          <CustomerSelect
            label="Nama Pelanggan / Klien *"
            value={form.leadId}
            onChange={(id, customer) =>
              setForm((prev) => ({
                ...prev,
                leadId: id,
                clientLabel: customer?.clientName ?? "",
              }))
            }
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase">Nama Produk NPF *</label>
            <input
              type="text"
              placeholder="Brightening Serum Niacinamide 10%"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
              value={form.productName}
              onChange={(e) => setForm((prev) => ({ ...prev, productName: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase">Target Harga Produk (Rp)</label>
            <input
              type="number"
              min={0}
              placeholder="15000"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 tabular-nums"
              value={form.targetPrice}
              onChange={(e) => setForm((prev) => ({ ...prev, targetPrice: Number(e.target.value) }))}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="font-bold text-slate-700 uppercase">
            Catatan Konsep (benchmark, tekstur, aroma, warna, bahan aktif)
          </label>
          <textarea
            rows={4}
            placeholder="Contoh: benchmark Skintific 5X Ceramide; tekstur watery gel; aroma fresh floral; aktif Niacinamide 10%..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
            value={form.conceptNotes}
            onChange={(e) => setForm((prev) => ({ ...prev, conceptNotes: e.target.value }))}
          />
          <p className="text-[10px] text-slate-500">
            Spesifikasi formulasi lengkap (fungsi, tekstur, warna, aroma) diisi tim R&D saat membuat sample request.
          </p>
        </div>
      </div>
    </DnaModal>
  );
}
