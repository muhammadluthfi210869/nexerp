"use client";

import React from "react";
import {
  DnaModal,
  DnaInput,
  DnaSelect,
  DnaButton,
} from "@/components/dna";
import type { MrpFormData } from "../_types/kebutuhan.types";

interface KebutuhanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: MrpFormData;
  onFormChange: React.Dispatch<React.SetStateAction<MrpFormData>>;
  onSubmit: (e: React.FormEvent) => void;
}

export function KebutuhanFormModal({
  isOpen,
  onClose,
  formData,
  onFormChange,
  onSubmit,
}: KebutuhanFormModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Input Kebutuhan Barang Baru (Manual Entry MRP)"
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Kode Material / Bahan *</label>
            <DnaInput
              placeholder="Contoh: RAW-ACT-005"
              value={formData.materialCode}
              onChange={(e) => onFormChange((prev) => ({ ...prev, materialCode: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama Material / Bahan *</label>
            <DnaInput
              placeholder="Contoh: Hyaluronic Acid 2%"
              value={formData.materialName}
              onChange={(e) => onFormChange((prev) => ({ ...prev, materialName: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Kategori Material *</label>
            <DnaSelect
              options={[
                { value: "Bahan Baku", label: "Bahan Baku (Raw Material)" },
                { value: "Kemas Primer", label: "Kemas Primer (Botol/Pot)" },
                { value: "Kemas Sekunder", label: "Kemas Sekunder (Box/Dus)" },
              ]}
              value={formData.category}
              onChange={(val) => onFormChange((prev) => ({ ...prev, category: val as any }))}
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">No. SO Referensi *</label>
            <DnaInput
              placeholder="Contoh: SO-2026-0041"
              value={formData.salesOrderRef}
              onChange={(e) => onFormChange((prev) => ({ ...prev, salesOrderRef: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama Brand / Produk *</label>
            <DnaInput
              placeholder="Contoh: Glow Serum 30ml"
              value={formData.brandProduct}
              onChange={(e) => onFormChange((prev) => ({ ...prev, brandProduct: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Gross Need *</label>
            <DnaInput
              type="number"
              value={formData.grossRequirement}
              onChange={(e) =>
                onFormChange((prev) => ({ ...prev, grossRequirement: Number(e.target.value) }))
              }
              required
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Real Stok *</label>
            <DnaInput
              type="number"
              value={formData.realStockQty}
              onChange={(e) =>
                onFormChange((prev) => ({ ...prev, realStockQty: Number(e.target.value) }))
              }
              required
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">PO On-Order</label>
            <DnaInput
              type="number"
              value={formData.onOrderQty}
              onChange={(e) =>
                onFormChange((prev) => ({ ...prev, onOrderQty: Number(e.target.value) }))
              }
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Satuan Unit</label>
            <DnaSelect
              options={[
                { value: "kg", label: "kg" },
                { value: "gram", label: "gram" },
                { value: "pcs", label: "pcs" },
                { value: "pack", label: "pack" },
              ]}
              value={formData.unit}
              onChange={(val) => onFormChange((prev) => ({ ...prev, unit: val }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mitra Supplier Utama *</label>
            <DnaInput
              placeholder="Contoh: PT Chemindo Sukses Makmur"
              value={formData.primarySupplier}
              onChange={(e) =>
                onFormChange((prev) => ({ ...prev, primarySupplier: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Est. Harga Satuan (Rp) *</label>
            <DnaInput
              type="number"
              placeholder="Rp"
              value={formData.estimatedUnitPrice}
              onChange={(e) =>
                onFormChange((prev) => ({ ...prev, estimatedUnitPrice: Number(e.target.value) }))
              }
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <DnaButton type="button" variant="secondary" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton type="submit" variant="primary">
            Simpan Kebutuhan MRP
          </DnaButton>
        </div>
      </form>
    </DnaModal>
  );
}
