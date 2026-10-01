import React from "react";
import {
  DnaModal,
  DnaInput,
  DnaSelect,
  DnaButton,
} from "@/components/dna";
import {
  CostAllocationFormModalProps,
  METHODS,
} from "../_types/cost-allocation-setup.types";

export function CostAllocationFormModal({
  isOpen,
  isSaving,
  formFrom,
  formTo,
  formAmount,
  formMethod,
  formBasis,
  formDate,
  formNotes,
  onFormFromChange,
  onFormToChange,
  onFormAmountChange,
  onFormMethodChange,
  onFormBasisChange,
  onFormDateChange,
  onFormNotesChange,
  onClose,
  onSubmit,
}: CostAllocationFormModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Catat Alokasi Biaya Overhead"
      size="md"
    >
      <form onSubmit={onSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Cost Center Asal *</label>
            <DnaInput
              placeholder="Contoh: CC-OVERHEAD"
              value={formFrom}
              onChange={(e) => onFormFromChange(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Cost Center Tujuan *</label>
            <DnaInput
              placeholder="Contoh: CC-PRODUCTION"
              value={formTo}
              onChange={(e) => onFormToChange(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Metode Alokasi *</label>
            <DnaSelect
              value={formMethod}
              onChange={(val) => onFormMethodChange(val)}
              options={METHODS.map((m) => ({ value: m, label: m }))}
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Basis Alokasi</label>
            <DnaInput
              placeholder="Contoh: machine_hours"
              value={formBasis}
              onChange={(e) => onFormBasisChange(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tanggal Alokasi *</label>
            <DnaInput
              type="date"
              value={formDate}
              onChange={(e) => onFormDateChange(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nominal (Rp) *</label>
            <DnaInput
              type="number"
              min={1}
              placeholder="5000000"
              value={formAmount}
              onChange={(e) => onFormAmountChange(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Catatan</label>
          <DnaInput
            placeholder="Contoh: Alokasi overhead Q3"
            value={formNotes}
            onChange={(e) => onFormNotesChange(e.target.value)}
          />
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <DnaButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Batal
          </DnaButton>
          <DnaButton
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSaving}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isSaving ? "Menyimpan..." : "Simpan Alokasi"}
          </DnaButton>
        </div>
      </form>
    </DnaModal>
  );
}
