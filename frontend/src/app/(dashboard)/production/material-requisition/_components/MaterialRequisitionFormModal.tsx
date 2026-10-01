"use client";

import React from "react";
import {
  DnaModal,
  DnaButton,
  DnaInput,
  DnaSelect,
  DnaTextarea,
} from "@/components/dna";
import { generateAutoDocNumber } from "@/lib/document-number";

interface MaterialRequisitionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  formSpkRef: string;
  setFormSpkRef: (val: string) => void;
  formTargetProduct: string;
  setFormTargetProduct: (val: string) => void;
  formSourceWarehouse: string;
  setFormSourceWarehouse: (val: string) => void;
  formTotalTypes: number;
  setFormTotalTypes: (val: number) => void;
  formTotalQty: number;
  setFormTotalQty: (val: number) => void;
  formQtyUnit: string;
  setFormQtyUnit: (val: string) => void;
  formRequester: string;
  setFormRequester: (val: string) => void;
  formNotes: string;
  setFormNotes: (val: string) => void;
}

export function MaterialRequisitionFormModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  formSpkRef,
  setFormSpkRef,
  formTargetProduct,
  setFormTargetProduct,
  formSourceWarehouse,
  setFormSourceWarehouse,
  formTotalTypes,
  setFormTotalTypes,
  formTotalQty,
  setFormTotalQty,
  formQtyUnit,
  setFormQtyUnit,
  formRequester,
  setFormRequester,
  formNotes,
  setFormNotes,
}: MaterialRequisitionFormModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Pengajuan Permintaan Bahan (Material Requisition)"
      size="lg"
    >
      <div className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-700">No. SPK Referensi *</label>
              <button
                type="button"
                onClick={() => setFormSpkRef(generateAutoDocNumber("SPK"))}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline"
              >
                + Auto No. SPK
              </button>
            </div>
            <DnaInput
              placeholder="cth: SPK-202609-1234"
              value={formSpkRef}
              onChange={(e) => setFormSpkRef(e.target.value)}
              required
            />
          </div>
          <DnaInput
            label="Nama Produk Target"
            placeholder="cth: Brightening Facial Serum 30ml"
            value={formTargetProduct}
            onChange={(e) => setFormTargetProduct(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <DnaSelect
            label="Gudang Asal Bahan"
            value={formSourceWarehouse}
            onChange={(val) => setFormSourceWarehouse(val)}
            options={[
              { label: "WH-01 Gudang Bahan Baku", value: "WH-01 Gudang Bahan Baku" },
              { label: "WH-02 Gudang Kemasan", value: "WH-02 Gudang Kemasan" },
              { label: "WH-03 Gudang Sentral", value: "WH-03 Gudang Sentral" },
            ]}
          />
          <DnaInput
            label="PIC Pemohon"
            value={formRequester}
            onChange={(e) => setFormRequester(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <DnaInput
            label="Total Macam Bahan"
            type="number"
            value={formTotalTypes}
            onChange={(e) => setFormTotalTypes(Number(e.target.value))}
            required
          />
          <DnaInput
            label="Total Qty"
            type="number"
            value={formTotalQty}
            onChange={(e) => setFormTotalQty(Number(e.target.value))}
            required
          />
          <DnaSelect
            label="Satuan"
            value={formQtyUnit}
            onChange={(val) => setFormQtyUnit(val)}
            options={[
              { label: "Kg", value: "Kg" },
              { label: "Liter (L)", value: "L" },
              { label: "Pcs / Unit", value: "Pcs" },
            ]}
          />
        </div>

        <DnaTextarea
          label="Catatan Pengeluaran & Rincian Item"
          placeholder="Rincian bahan aktif, penimbangan batch, lot yang dialokasikan..."
          value={formNotes}
          onChange={(e) => setFormNotes(e.target.value)}
          rows={3}
        />

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
          <DnaButton variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Batal
          </DnaButton>
          <DnaButton variant="primary" onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Ajukan Permintaan"}
          </DnaButton>
        </div>
      </div>
    </DnaModal>
  );
}
