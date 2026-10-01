import React from "react";
import {
  DnaModal,
  DnaButton,
  DnaInput,
} from "@/components/dna";
import { SampleFormData } from "../_types/sample-sales.types";

interface SampleCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: SampleFormData;
  updateFormField: (field: keyof SampleFormData, value: string) => void;
  isSubmitting?: boolean;
}

export function SampleCreateModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  updateFormField,
  isSubmitting,
}: SampleCreateModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Buat Permintaan Sample R&D Baru"
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Nama Klien / Perusahaan *</label>
            <DnaInput
              placeholder="Contoh: PT Cantika Jelita Nusantara"
              value={formData.customer}
              onChange={(e) => updateFormField("customer", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Nama Brand Klien</label>
            <DnaInput
              placeholder="Contoh: Jelita Glow Skincare"
              value={formData.brand}
              onChange={(e) => updateFormField("brand", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">Nama Produk Sample *</label>
          <DnaInput
            placeholder="Contoh: Ceramide Barrier Repair Hydrating Essence"
            value={formData.product}
            onChange={(e) => updateFormField("product", e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Bentuk Fisik</label>
            <DnaInput
              value={formData.form}
              onChange={(e) => updateFormField("form", e.target.value)}
              placeholder="Serum / Krim"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Netto</label>
            <DnaInput
              value={formData.netto}
              onChange={(e) => updateFormField("netto", e.target.value)}
              placeholder="30 ml"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Warna Target</label>
            <DnaInput
              value={formData.color}
              onChange={(e) => updateFormField("color", e.target.value)}
              placeholder="Bening"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Aroma Target</label>
            <DnaInput
              value={formData.fragrance}
              onChange={(e) => updateFormField("fragrance", e.target.value)}
              placeholder="Rose / Citrus"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">Klaim Manfaat & Bahan Aktif Khusus</label>
          <DnaInput
            value={formData.claims}
            onChange={(e) => updateFormField("claims", e.target.value)}
            placeholder="Ceramide 5X, Hyaluronic Acid, Centella Asiatica"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Biaya Komitmen Sample (Rp)</label>
            <DnaInput
              type="number"
              value={formData.price}
              onChange={(e) => updateFormField("price", e.target.value)}
            />
            <p className="text-[10px] text-slate-400 mt-1">Biaya sample akan di-offset otomatis saat rilis PO produksi.</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Jumlah Botol Sample</label>
            <DnaInput
              type="number"
              value={formData.qty}
              onChange={(e) => updateFormField("qty", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-700 block mb-1.5">Catatan Benchmark / Catatan Khusus</label>
          <textarea
            className="w-full text-xs p-3 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
            rows={2}
            placeholder="Contoh: Klien minta tekstur mirip Somethinc Water Gel, finish semi-matte."
            value={formData.notes}
            onChange={(e) => updateFormField("notes", e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <DnaButton type="button" variant="secondary" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton type="submit" variant="primary" loading={isSubmitting}>
            Simpan & Kirim ke R&D
          </DnaButton>
        </div>
      </form>
    </DnaModal>
  );
}
