import React from "react";
import {
  DnaModal,
  DnaInput,
  DnaSelect,
  DnaButton,
} from "@/components/dna";
import type { AssetFormData } from "../_types/assets.types";
import { usefulLifeMap } from "../_hooks/useAssetsOperations";

interface AssetsFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: AssetFormData;
  setFormData: React.Dispatch<React.SetStateAction<AssetFormData>>;
  onSave: () => void;
  isSaving: boolean;
}

export function AssetsFormModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSave,
  isSaving,
}: AssetsFormModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Buat Register Aset Tetap Baru"
      size="md"
    >
      <div className="space-y-3.5 text-xs">
        <div>
          <label className="block text-slate-700 font-semibold mb-1">Kode Aset (Auto Universal Global)</label>
          <DnaInput
            type="text"
            value="DL-FIN-AST-09092026-0004"
            disabled
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-100 tabular-nums text-slate-600"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-semibold mb-1">Nama Aset Tetap *</label>
          <DnaInput
            type="text"
            placeholder="e.g. Mesin Boiler Uap Tekanan Tinggi 10 Bar"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Kategori Aset *</label>
            <DnaSelect 
              value={formData.category}
              onChange={(value) => setFormData({ ...formData, category: value as any })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
            >
              <option value="Inventaris">Inventaris / Mesin Pabrik</option>
              <option value="Motor">Sepeda Motor</option>
              <option value="Mobil">Mobil / Truk Box</option>
              <option value="Bangunan">Bangunan Pabrik Permanen</option>
            </DnaSelect>
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Masa Manfaat (Auto-Fill Default)</label>
            <DnaInput
              type="text"
              value={`${usefulLifeMap[formData.category]} Tahun (Garis Lurus)`}
              disabled
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-100 font-bold text-blue-700"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Tanggal Perolehan *</label>
            <DnaInput
              type="date"
              value={formData.acquisitionDate}
              onChange={(e) => setFormData({ ...formData, acquisitionDate: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Harga Perolehan Cost (Rp) *</label>
            <DnaInput
              type="number"
              placeholder="e.g. 150000000"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-emerald-700"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Lokasi Penempatan</label>
            <DnaInput
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Departemen Penanggung Jawab</label>
            <DnaInput
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <DnaButton variant="secondary" size="md" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton variant="primary" size="md" onClick={onSave} disabled={isSaving}>
            {isSaving ? "Menyimpan..." : "Simpan Aset Register"}
          </DnaButton>
        </div>
      </div>
    </DnaModal>
  );
}
