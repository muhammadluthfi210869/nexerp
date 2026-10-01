import React from "react";
import { DnaModal, DnaButton, DnaInput, DnaSelect, formatRupiah } from "@/components/dna";
import { MasterMaterialOption, PhaseKey } from "../_types/formula.types";

interface FormulaAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterMaterials: MasterMaterialOption[];
  newItem: {
    phase: PhaseKey;
    materialCode: string;
    inciName: string;
    functionName: string;
    percentage: number;
    unitPrice: number;
  };
  onSelectMasterMaterial: (materialId: string) => void;
  onChangeNewItem: React.Dispatch<
    React.SetStateAction<{
      phase: PhaseKey;
      materialCode: string;
      inciName: string;
      functionName: string;
      percentage: number;
      unitPrice: number;
    }>
  >;
  onAddIngredient: () => void;
}

export function FormulaAddModal({
  isOpen,
  onClose,
  masterMaterials,
  newItem,
  onSelectMasterMaterial,
  onChangeNewItem,
  onAddIngredient,
}: FormulaAddModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Tambah Bahan Baku Formulasi Lab"
      description="Pilih dari katalog bahan master baku atau masukkan spesifikasi bahan baru."
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <DnaButton variant="secondary" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton variant="primary" onClick={onAddIngredient}>
            Tambahkan ke Formula
          </DnaButton>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Quick select from master materials */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-700 uppercase">Pilih dari Master Bahan Baku (Opsional)</label>
          <select
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
            onChange={(e) => onSelectMasterMaterial(e.target.value)}
            defaultValue=""
          >
            <option value="" disabled>-- Pilih Bahan dari Database Master --</option>
            {masterMaterials.map((m) => (
              <option key={m.id} value={m.id}>
                [{m.code}] {m.name} ({m.inciName}) — {formatRupiah(m.unitPrice)}/Kg
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase">Fase Formulasi *</label>
            <select
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-semibold"
              value={newItem.phase}
              onChange={(e) =>
                onChangeNewItem((prev) => ({ ...prev, phase: e.target.value as PhaseKey }))
              }
            >
              <option value="A">Fase A (Water Phase / Pelarut Dasar)</option>
              <option value="B">Fase B (Active Phase / Ekstrak &amp; Minyak)</option>
              <option value="C">Fase C (Preservative, Aroma, &amp; Buffering)</option>
              <option value="D">Fase D (Finishing / Post-Emulsi)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase">Kode Bahan / SKU *</label>
            <input
              type="text"
              placeholder="RAW-AQUA-01"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-mono"
              value={newItem.materialCode}
              onChange={(e) =>
                onChangeNewItem((prev) => ({ ...prev, materialCode: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase">Nama Bahan / INCI Name *</label>
            <input
              type="text"
              placeholder="Niacinamide (Vitamin B3 99%)"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
              value={newItem.inciName}
              onChange={(e) =>
                onChangeNewItem((prev) => ({ ...prev, inciName: e.target.value }))
              }
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase">Fungsi Bahan</label>
            <input
              type="text"
              placeholder="Bahan Aktif Mencerahkan"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
              value={newItem.functionName}
              onChange={(e) =>
                onChangeNewItem((prev) => ({ ...prev, functionName: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase">Persentase Formula (%) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="5.00"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-bold tabular-nums"
              value={newItem.percentage}
              onChange={(e) =>
                onChangeNewItem((prev) => ({
                  ...prev,
                  percentage: parseFloat(e.target.value) || 0,
                }))
              }
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase">Harga Satuan (Rp/Kg) *</label>
            <input
              type="number"
              min="0"
              placeholder="180000"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-bold tabular-nums"
              value={newItem.unitPrice}
              onChange={(e) =>
                onChangeNewItem((prev) => ({
                  ...prev,
                  unitPrice: Number(e.target.value) || 0,
                }))
              }
            />
          </div>
        </div>
      </div>
    </DnaModal>
  );
}
