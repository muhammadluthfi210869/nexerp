"use client";

import React from "react";
import { DnaModal, DnaButton, DnaInput, DnaSelect } from "@/components/dna";
import type { BinFormData } from "../_types/gudang.types";

interface GudangBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: BinFormData;
  setForm: React.Dispatch<React.SetStateAction<BinFormData>>;
  onSave: () => void;
}

export function GudangBinModal({
  isOpen,
  onClose,
  form,
  setForm,
  onSave,
}: GudangBinModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Tambah Lokasi Rak / Bin"
      description="Mendaftarkan slot penyimpanan spesifik pada lorong dan tingkat rak."
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <DnaButton variant="secondary" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton variant="primary" onClick={onSave}>
            Simpan Bin
          </DnaButton>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-700 uppercase">Pilih Gudang *</label>
            <DnaSelect
              className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 font-medium text-zinc-800"
              value={form.warehouseCode}
              onChange={(value) => setForm((prev) => ({ ...prev, warehouseCode: value }))}
            >
              <option value="WH-01">WH-01 Gudang Bahan Baku</option>
              <option value="WH-02">WH-02 Gudang Bahan Kemas</option>
              <option value="WH-03">WH-03 Gudang Produk Jadi</option>
            </DnaSelect>
          </div>
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-700 uppercase">Kode Bin *</label>
            <DnaInput
              type="text"
              placeholder="Contoh: WH01-A1-05"
              className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 tabular-nums text-zinc-800"
              value={form.binCode}
              onChange={(e) => setForm((prev) => ({ ...prev, binCode: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-700 uppercase">Lorong / Baris</label>
            <DnaInput
              type="text"
              placeholder="Contoh: Lorong A"
              className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-zinc-800"
              value={form.aisle}
              onChange={(e) => setForm((prev) => ({ ...prev, aisle: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-700 uppercase">Tingkat / Level</label>
            <DnaInput
              type="text"
              placeholder="Contoh: Tingkat 1"
              className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-zinc-800"
              value={form.rackLevel}
              onChange={(e) => setForm((prev) => ({ ...prev, rackLevel: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-700 uppercase">Zona Suhu</label>
            <DnaSelect
              className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 font-medium text-zinc-800"
              value={form.zoneType}
              onChange={(value) => setForm((prev) => ({ ...prev, zoneType: value as any }))}
            >
              <option value="COOL_ROOM">Cool Room (15-25°C)</option>
              <option value="AMBIENT">Suhu Ruang (Ambient)</option>
            </DnaSelect>
          </div>
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-700 uppercase">Kapasitas Maksimal (Kg / Pcs)</label>
            <DnaInput
              type="number"
              className="w-full text-xs bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 tabular-nums text-zinc-800"
              value={form.capacityMax}
              onChange={(e) => setForm((prev) => ({ ...prev, capacityMax: Number(e.target.value) }))}
            />
          </div>
        </div>
      </div>
    </DnaModal>
  );
}
