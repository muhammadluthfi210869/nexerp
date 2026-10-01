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

interface BatchRecordsFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  selectedSalesOrderId?: string;
  onSelectSalesOrder?: (val: string) => void;
  salesOrderOptions?: Array<{ value: string; label: string }>;
  formProductName: string;
  setFormProductName: (val: string) => void;
  formFormulaRef: string;
  setFormFormulaRef: (val: string) => void;
  formBatchSizeKg: number;
  setFormBatchSizeKg: (val: number) => void;
  formFormulator: string;
  setFormFormulator: (val: string) => void;
  formNotes: string;
  setFormNotes: (val: string) => void;
}

export function BatchRecordsFormModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  selectedSalesOrderId = "",
  onSelectSalesOrder,
  salesOrderOptions = [],
  formProductName,
  setFormProductName,
  formFormulaRef,
  setFormFormulaRef,
  formBatchSizeKg,
  setFormBatchSizeKg,
  formFormulator,
  setFormFormulator,
  formNotes,
  setFormNotes,
}: BatchRecordsFormModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Buat Digital Batch Record (BMR) Baru"
      size="lg"
    >
      <div className="space-y-4 text-xs">
        {/* Auto-Pull from Sales Order */}
        {salesOrderOptions.length > 0 && (
          <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-200/80">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-indigo-950 flex items-center gap-1.5">
                <span>Pilih Sales Order (SO) Terkait</span>
                <span className="text-[10px] bg-indigo-200/60 text-indigo-800 font-extrabold px-1.5 py-0.5 rounded">
                  ⚡ Auto-Pull
                </span>
              </label>
              {selectedSalesOrderId && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Formula & Nama Produk Terisi Otomatis
                </span>
              )}
            </div>
            <select
              value={selectedSalesOrderId}
              onChange={(e) => onSelectSalesOrder?.(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-indigo-200 bg-white font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">— Pilih Sales Order (SO) yang Dikonfirmasi —</option>
              {salesOrderOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-indigo-700/80 mt-1">
              Menghubungkan BMR dengan Sales Order secara otomatis menarik nama produk, kode formula R&D, dan estimasi batch bulk.
            </p>
          </div>
        )}

        <DnaInput
          label="Nama Produk Jadi"
          placeholder="cth: Brightening Facial Serum 30ml"
          value={formProductName}
          onChange={(e) => setFormProductName(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-700">Kode Formulasi Referensi</label>
              <button
                type="button"
                onClick={() => setFormFormulaRef(generateAutoDocNumber("FORM"))}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline"
              >
                + Auto No. Formula
              </button>
            </div>
            <DnaInput
              placeholder="cth: FOR-202609-1234"
              value={formFormulaRef}
              onChange={(e) => setFormFormulaRef(e.target.value)}
              required
            />
          </div>
          <DnaInput
            label="Ukuran Batch Bulk (Kg)"
            type="number"
            value={formBatchSizeKg}
            onChange={(e) => setFormBatchSizeKg(Number(e.target.value))}
            required
          />
        </div>

        <DnaInput
          label="Nama Formulator / PIC APJ"
          placeholder="cth: apt. Siti Nurhaliza"
          value={formFormulator}
          onChange={(e) => setFormFormulator(e.target.value)}
          required
        />

        <DnaTextarea
          label="Catatan Pengolahan & Parameter Kritis"
          placeholder="Parameter suhu mixing, kecepatan homogenizer, urutan penambahan fase..."
          value={formNotes}
          onChange={(e) => setFormNotes(e.target.value)}
          rows={3}
        />

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
          <DnaButton variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Batal
          </DnaButton>
          <DnaButton variant="primary" onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Buat Batch Record"}
          </DnaButton>
        </div>
      </div>
    </DnaModal>
  );
}
