"use client";

import React from "react";
import {
  DnaModal,
  DnaButton,
  DnaSelect,
  DnaTextarea,
} from "@/components/dna";
import type {
  AdjustmentFormData,
  AdjustmentType,
} from "../_types/adjustment.types";

interface WarehouseAdjustmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: AdjustmentFormData;
  setFormData: React.Dispatch<React.SetStateAction<AdjustmentFormData>>;
  onSubmit: () => void;
}

export function WarehouseAdjustmentFormModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
}: WarehouseAdjustmentFormModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Form Pengajuan Penyesuaian Stok (Stock Adjustment)"
      description="Koreksi stok fisik gudang terhadap sistem dengan jurnal penyesuaian otomatis pasca approval."
      size="2xl"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <DnaButton variant="outline" size="sm" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton
            variant="primary"
            size="sm"
            onClick={onSubmit}
          >
            Ajukan Penyesuaian Stok
          </DnaButton>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Lokasi Gudang *</label>
            <DnaSelect
              aria-label="Pilih Gudang"
              value={formData.warehouseCode}
              onChange={(val) => setFormData({ ...formData, warehouseCode: val })}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
            >
              <option value="WH-01">WH-01 Gudang Bahan Baku Utama</option>
              <option value="WH-02">WH-02 Gudang Kemas & Box</option>
              <option value="WH-03">WH-03 Gudang Produk Jadi</option>
              <option value="WH-04">WH-04 Gudang Karantina & QC</option>
            </DnaSelect>
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1">Tipe Penyesuaian *</label>
            <DnaSelect
              aria-label="Tipe Penyesuaian"
              value={formData.adjustmentType}
              onChange={(val) =>
                setFormData({ ...formData, adjustmentType: val as AdjustmentType })
              }
              className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
            >
              <option value="CORRECTION">Koreksi Selisih Hitung (Opname)</option>
              <option value="WRITE_OFF">Write-Off Kerusakan Material</option>
              <option value="DISPOSAL">Pemusnahan Limbah Kedaluwarsa</option>
              <option value="QC_SAMPLING">Pengambilan Sampel QC Laboratorium</option>
            </DnaSelect>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-bold mb-1">Akun Beban CoA *</label>
            <DnaSelect
              aria-label="Akun Beban CoA"
              value={formData.adjustmentAccountCode}
              onChange={(val) => {
                let name = "Beban Selisih Stok Persediaan";
                if (val === "510502") name = "Beban Kerusakan & Write-Off";
                if (val === "510503") name = "Beban Pemusnahan Limbah";
                if (val === "510504") name = "Beban Sampling QC";
                setFormData({
                  ...formData,
                  adjustmentAccountCode: val,
                  adjustmentAccountName: `${val} - ${name}`,
                });
              }}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
            >
              <option value="510501">510501 - Beban Selisih Stok Persediaan</option>
              <option value="510502">510502 - Beban Kerusakan & Write-Off</option>
              <option value="510503">510503 - Beban Pemusnahan Limbah</option>
              <option value="510504">510504 - Beban Sampling QC</option>
            </DnaSelect>
          </div>
        </div>

        <div>
          <label className="block text-slate-700 font-bold mb-1">Alasan / Catatan Penyesuaian</label>
          <DnaTextarea
            rows={2}
            placeholder="Jelaskan alasan terjadinya selisih stok fisik..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full text-xs border border-slate-300 rounded-lg p-2"
          />
        </div>
      </div>
    </DnaModal>
  );
}
